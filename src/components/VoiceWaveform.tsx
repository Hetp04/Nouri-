import React, { useEffect, useRef, useState, memo } from 'react';
import { View, Animated, Easing } from 'react-native';

interface Props {
    level: number;          // 0–1 smoothed mic amplitude
    active: boolean;        // pill is expanded
    mode: 'recording' | 'transcribing';
    width: number;          // available width in px
    height: number;         // available height in px
}

const BAR_WIDTH = 1.5;
const BAR_GAP = 1.5;
const STEP = BAR_WIDTH + BAR_GAP;
const SPAWN_MS = 32; // 30fps - High fidelity graph updates

const MIN_H_FRAC = 0.08; // Very low base height for "axis-like" silence
const RECORDING_COLOR = '#111111'; // Pure dark for high contrast
const TRANSCRIBING_COLOR = '#8E8E93';
const IDLE_COLOR = '#E5E5EA';

/**
 * Individual Bar Component
 * Memoized so it only re-renders when height/color changes (which is never for old bars)
 */
const WaveBar = memo(({ h, color, opacity, style }: any) => (
    <View
        style={[{
            width: BAR_WIDTH,
            height: h,
            borderRadius: BAR_WIDTH / 2, // Fully rounded tips
            backgroundColor: color,
            marginRight: BAR_GAP,
            opacity: opacity,
        }, style]}
    />
));

export function VoiceWaveform({ level, active, mode, width, height }: Props) {
    const [bars, setBars] = useState<{ h: number; color: string; id: number }[]>([]);
    const scrollX = useRef(new Animated.Value(0)).current;

    const levelRef = useRef(level);
    const modeRef = useRef(mode);
    const activeRef = useRef(active);
    const lastId = useRef(0);
    // Scale container to fit dense bars
    const maxBars = Math.ceil(width / STEP) + 8;

    useEffect(() => { levelRef.current = level; }, [level]);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { activeRef.current = active; }, [active]);

    // Initialize with silent bars
    useEffect(() => {
        if (bars.length === 0) {
            const initial = Array.from({ length: maxBars }, (_, i) => ({
                h: height * MIN_H_FRAC,
                color: IDLE_COLOR,
                id: i
            }));
            setBars(initial);
            lastId.current = maxBars;
        }
    }, [width, height]);

    // The logic to add bars
    useEffect(() => {
        if (!active) return;

        const interval = setInterval(() => {
            const newMode = modeRef.current;
            const newLevel = levelRef.current;

            let barH: number;
            let barColor: string;

            if (newMode === 'transcribing') {
                const breathe = (Math.sin(Date.now() / 200) + 1) / 2;
                barH = height * (MIN_H_FRAC + 0.15 * breathe);
                barColor = TRANSCRIBING_COLOR;
            } else {
                // ACCURATE snapshot of current level
                barH = Math.max(height * MIN_H_FRAC, height * (MIN_H_FRAC + (1 - MIN_H_FRAC) * newLevel));
                barColor = RECORDING_COLOR;
            }

            setBars(prev => {
                const next = [...prev, { h: barH, color: barColor, id: ++lastId.current }];
                if (next.length > maxBars + 2) {
                    next.shift();
                }
                return next;
            });

            // Reset scroll to 0 and immediately start a transition to -STEP
            // This creates the continuous sliding effect
            scrollX.setValue(0);
            Animated.timing(scrollX, {
                toValue: -STEP,
                duration: SPAWN_MS,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start();

        }, SPAWN_MS);

        return () => clearInterval(interval);
    }, [active, height, width]);

    // Reset when inactive
    useEffect(() => {
        if (!active) {
            scrollX.setValue(0);
            const silent = Array.from({ length: maxBars }, (_, i) => ({
                h: height * MIN_H_FRAC,
                color: IDLE_COLOR,
                id: i
            }));
            setBars(silent);
        }
    }, [active]);

    const fadeZone = 32;

    return (
        <View style={{ width, height, overflow: 'hidden', justifyContent: 'center' }}>
            <Animated.View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    transform: [{ translateX: scrollX }],
                }}
            >
                {bars.map((bar, i) => {
                    // Logic for opacity fade at edges
                    // x is roughly i * STEP
                    const x = i * STEP;
                    let opacity = 0.9;
                    if (x < fadeZone) opacity = (x / fadeZone) * 0.9;
                    else if (x > width - fadeZone) opacity = ((width - x) / fadeZone) * 0.9;

                    return (
                        <WaveBar
                            key={bar.id}
                            h={bar.h}
                            color={bar.color}
                            opacity={Math.max(0, opacity)}
                        />
                    );
                })}
            </Animated.View>
        </View>
    );
}
