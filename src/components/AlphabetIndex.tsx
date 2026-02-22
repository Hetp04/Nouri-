import React, { useRef } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet } from 'react-native';
import { styles } from '../styles/alphabetIndex.styles';
import * as Haptics from 'expo-haptics';

const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

export interface AlphabetIndexProps {
    onLetterClick?: (letter: string) => void;
}

export function AlphabetIndex({ onLetterClick }: AlphabetIndexProps) {
    const containerHeight = useRef(0);
    const lastActiveIndex = useRef<number | null>(null);

    // Smooth independent liquid scales for every letter exactly like iOS native lists
    const scales = useRef(alphabet.map(() => new Animated.Value(1))).current;

    // Pure performance: track the target we requested so we don't violently flood the bridge with duplicate animations
    const targetScales = useRef(alphabet.map(() => 1)).current;

    const panResponder = useRef(
        PanResponder.create({
            // Bypass scroll views instantly for immediate drag responsiveness
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationY),
            onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationY),
            onPanResponderRelease: () => handleRelease(),
            onPanResponderTerminate: () => handleRelease(),
        })
    ).current;

    const handleRelease = () => {
        lastActiveIndex.current = null;
        // Snap every letter seamlessly back to size 1 natively
        alphabet.forEach((_, i) => {
            if (targetScales[i] !== 1) { // Only animate if it actually needs to reset
                targetScales[i] = 1;
                Animated.spring(scales[i], {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 7,
                    tension: 100,
                }).start();
            }
        });
    };

    const handleTouch = (y: number) => {
        if (!containerHeight.current) return;

        // Account for layout padding inside the container
        const PADDING_TOP = 8;
        const letterHeight = (containerHeight.current - (PADDING_TOP * 2)) / alphabet.length;

        // The exact fractional letter index for continuous mathematical animation tracking
        let rawFloatIndex = (y - PADDING_TOP) / letterHeight;
        let focalPoint = rawFloatIndex - 0.5; // Offset by half a letter so the peak is directly over the physical letter center

        // Discrete calculation for logic/haptic triggers
        let activeIndex = Math.floor(rawFloatIndex);
        activeIndex = Math.max(0, Math.min(activeIndex, alphabet.length - 1));

        if (activeIndex !== lastActiveIndex.current) {
            lastActiveIndex.current = activeIndex;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (onLetterClick) onLetterClick(alphabet[activeIndex]);
        }

        // Subpixel continuous mathematically smooth scaling
        // This calculates the exact organic fluid shape of the bulge for every frame, totally eliminating skipping.
        alphabet.forEach((_, i) => {
            const dist = Math.abs(i - focalPoint);
            let targetScale = 1;

            if (dist <= 1) {
                targetScale = 2.0 - (dist * 0.7); // interpolates gracefully from 2.0 at center to 1.3 at neighbor
            } else if (dist <= 1.5) {
                targetScale = 1.3 - ((dist - 1) * 0.6); // tight constraint: rolls it back down to 1.0 sharply over the next half letter
            }

            // High performance animation bridge protection (only push physics to GPU if it meaningfully moved)
            if (targetScale === 1) {
                if (targetScales[i] !== 1) {
                    targetScales[i] = 1;
                    Animated.spring(scales[i], {
                        toValue: 1,
                        useNativeDriver: true,
                        friction: 6,
                        tension: 150,
                    }).start();
                }
            } else if (Math.abs(targetScales[i] - targetScale) > 0.05) {
                targetScales[i] = targetScale;
                Animated.spring(scales[i], {
                    toValue: targetScale,
                    useNativeDriver: true,
                    friction: 6,
                    tension: 180, // High tension so the continuous visual perfectly keeps up with fast drags natively
                }).start();
            }
        });
    };

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <View
                style={styles.container}
                onLayout={(e) => containerHeight.current = e.nativeEvent.layout.height}
            >
                {alphabet.map((letter, idx) => (
                    <Animated.View
                        key={letter}
                        style={[
                            styles.letterButton,
                            {
                                transform: [{ scale: scales[idx] }],
                            }
                        ]}
                    >
                        <Text style={styles.letterText}>
                            {letter}
                        </Text>
                    </Animated.View>
                ))}

                {/* Transparent touch catcher overlay ensures locationY is completely stable */}
                <View
                    style={StyleSheet.absoluteFill}
                    {...panResponder.panHandlers}
                />
            </View>
        </View>
    );
}
