import { useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// ---------- constants ----------
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const METERING_INTERVAL_MS = 32; // ~30fps - High fidelity update rate

// dB range typical for a phone mic: -60 dB (silence) to -10 dB (loud speech)
const DB_SILENCE = -60;
const DB_LOUD = -10;

export type MicStatus = 'idle' | 'recording' | 'transcribing' | 'error';

export interface UseVoiceRecorderOptions {
    /** Called on every metering tick. level is 0–1, smoothed. */
    onLevel: (level: number) => void;
    /** Called when transcription finishes successfully. */
    onTranscript: (text: string) => void;
    /** Called on unrecoverable error. */
    onError: (msg: string) => void;
    /** Called whenever status changes. */
    onStatusChange: (status: MicStatus) => void;
}

export function useVoiceRecorder(opts: UseVoiceRecorderOptions) {
    const recordingRef = useRef<Audio.Recording | null>(null);
    const smoothedLevel = useRef(0);
    // Always point to the latest opts so callbacks are never stale
    const optsRef = useRef(opts);
    optsRef.current = opts;

    // ---- helpers ----
    const normalise = (db: number): number => {
        const clamped = Math.max(DB_SILENCE, Math.min(DB_LOUD, db));
        return (clamped - DB_SILENCE) / (DB_LOUD - DB_SILENCE);
    };

    const applyEMA = (next: number): number => {
        // Very sharp attack (0.9) for "graph-like" accuracy, reasonable decay (0.5)
        const attack = 0.9;
        const decay = 0.5;
        const alpha = next > smoothedLevel.current ? attack : decay;

        smoothedLevel.current = alpha * next + (1 - alpha) * smoothedLevel.current;
        return smoothedLevel.current;
    };

    // ---- start ----
    const start = useCallback(async (): Promise<boolean> => {
        try {
            // 1. Request permission
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                optsRef.current.onError('Microphone access was denied.');
                return false;
            }

            // 2. Configure audio session for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // 3. Create & start recording
            const { recording } = await Audio.Recording.createAsync(
                {
                    ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                    isMeteringEnabled: true,
                    android: {
                        ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
                        extension: '.m4a',
                    },
                    ios: {
                        ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
                        extension: '.m4a',
                    },
                },
                (status) => {
                    if (!status.isRecording) return;
                    const db = status.metering ?? DB_SILENCE;
                    const level = applyEMA(normalise(db));
                    optsRef.current.onLevel(level);
                },
                METERING_INTERVAL_MS
            );

            recordingRef.current = recording;
            smoothedLevel.current = 0;
            optsRef.current.onStatusChange('recording');
            return true;
        } catch (e) {
            console.warn('[VoiceRecorder] start error', e);
            optsRef.current.onError('Could not start recording.');
            optsRef.current.onStatusChange('error');
            return false;
        }
    }, []);

    // ---- stop ----
    const stop = useCallback(async (): Promise<void> => {
        const recording = recordingRef.current;
        if (!recording) return;
        recordingRef.current = null;

        try {
            await recording.stopAndUnloadAsync();
            // Restore audio session for playback
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

            const uri = recording.getURI();
            if (!uri) {
                optsRef.current.onError('Recording file not found.');
                optsRef.current.onStatusChange('error');
                return;
            }

            optsRef.current.onStatusChange('transcribing');
            await transcribe(uri);
        } catch (e) {
            console.warn('[VoiceRecorder] stop error', e);
            optsRef.current.onError('Recording failed.');
            optsRef.current.onStatusChange('error');
        }
    }, []);

    // ---- transcribe via Groq (Whisper) ----
    const transcribe = async (uri: string) => {
        if (!GROQ_API_KEY) {
            optsRef.current.onError('Groq API Key missing in .env');
            optsRef.current.onStatusChange('error');
            return;
        }

        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) throw new Error('file missing');

            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Groq uses the OpenAI-compatible endpoint
            const blob = await (await fetch(`data:audio/m4a;base64,${base64}`)).blob();

            const form = new FormData();
            // @ts-ignore – RN FormData accepts blobs
            form.append('file', blob, 'recording.m4a');
            form.append('model', 'whisper-large-v3-turbo'); // Groq's best model
            form.append('language', 'en');

            const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                },
                body: form,
            });

            if (!resp.ok) {
                const err = await resp.text();
                throw new Error(err);
            }

            const json = await resp.json();
            const text: string = (json.text ?? '').trim();
            optsRef.current.onTranscript(text);
            optsRef.current.onStatusChange('idle');
        } catch (e) {
            console.warn('[VoiceRecorder] transcribe error', e);
            optsRef.current.onError('Transcription failed.');
            optsRef.current.onStatusChange('error');
        }
    };

    return { start, stop };
}
