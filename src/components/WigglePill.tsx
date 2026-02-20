import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/forbiddenListModal.styles';

// ─── WigglePill ───────────────────────────────────────────────────────────────
// True iOS-style jiggle: starts at +angle immediately (like CAKeyframeAnimation
// with values=[valLeft, valRight], autoreverses=YES), with per-pill phase offsets.
// shouldRasterizeIOS prevents sub-pixel border shimmering during rotation.

export interface WigglePillProps {
    children: React.ReactNode;
    isEditMode: boolean;
    isSelected: boolean;
    phaseOffset: number;   // ms — staggers start so pills don't move in sync
    onPress: () => void;
    onLongPress: () => void;
    chipStyle: object | object[];
    onDelete?: () => void;  // only custom pills: permanently removes the item
}

export function WigglePill({
    children,
    isEditMode,
    isSelected,
    phaseOffset,
    onPress,
    onLongPress,
    chipStyle,
    onDelete,
}: WigglePillProps) {
    const rot = useRef(new Animated.Value(0)).current;
    const badgeScale = useRef(new Animated.Value(0)).current;
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    // Press feel: compresses on press-in, springs back with bounce on release
    const pressScale = useRef(new Animated.Value(1)).current;
    // Selection pulse: quick squish + spring pop when isSelected flips
    const selectionPulse = useRef(new Animated.Value(1)).current;
    const loopRef = useRef<Animated.CompositeAnimation | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    // ── Wiggle ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isEditMode) {
            timerRef.current = setTimeout(() => {
                // Snap to +angle — animation is always balanced (never passes 0)
                rot.setValue(1);
                // Sinusoidal easing = decelerates at peak, accelerates back.
                // This is what makes it feel like real iOS vs a beginner loop.
                const ease = Easing.inOut(Easing.sin);
                loopRef.current = Animated.loop(
                    Animated.sequence([
                        Animated.timing(rot, {
                            toValue: -1,
                            duration: 160,
                            easing: ease,
                            useNativeDriver: true,
                        }),
                        Animated.timing(rot, {
                            toValue: 1,
                            duration: 160,
                            easing: ease,
                            useNativeDriver: true,
                        }),
                    ])
                );
                loopRef.current.start();
            }, phaseOffset);
        } else {
            if (timerRef.current) clearTimeout(timerRef.current);
            loopRef.current?.stop();
            Animated.spring(rot, {
                toValue: 0,
                useNativeDriver: true,
                speed: 20,
                bounciness: 0,
            }).start();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            loopRef.current?.stop();
        };
    }, [isEditMode]);

    // ── Selection pulse (skip on first render) ──────────────────────────────
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // Quick compress → springy pop — gives the toggle a satisfying "click"
        Animated.sequence([
            Animated.timing(selectionPulse, {
                toValue: 0.95,
                duration: 80,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.spring(selectionPulse, {
                toValue: 1,
                useNativeDriver: true,
                speed: 28,
                bounciness: 0,
            }),
        ]).start();
    }, [isSelected]);

    // ── Badge fade-in/out ───────────────────────────────────────────────────
    useEffect(() => {
        if (isEditMode) {
            // Pop in with spring after a short settle
            setTimeout(() => {
                Animated.parallel([
                    Animated.spring(badgeScale, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 220,
                        friction: 8,
                    }),
                    Animated.timing(badgeOpacity, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, phaseOffset + 40);
        } else {
            Animated.parallel([
                Animated.timing(badgeScale, {
                    toValue: 0,
                    duration: 120,
                    useNativeDriver: true,
                }),
                Animated.timing(badgeOpacity, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isEditMode]);

    // ── Press handlers ──────────────────────────────────────────────────────
    const handlePressIn = () => {
        Animated.spring(pressScale, {
            toValue: 0.985,
            useNativeDriver: true,
            speed: 60,
            bounciness: 0,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 24,
            bounciness: 0,
        }).start();
    };

    // 0.85° is barely perceptible up close but clearly communicates edit mode.
    // Real iOS jiggle on small elements is in the 0.8–1.0° range.
    const rotate = rot.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-0.85deg', '0.85deg'],
    });

    return (
        <Animated.View
            style={{
                transform: [{ perspective: 1200 }, { rotate }],
            }}
            // Flattens the view to a GPU texture during animation — prevents
            // border anti-aliasing artifacts (the "zig-zag stroke" problem).
            shouldRasterizeIOS={isEditMode}
            renderToHardwareTextureAndroid={isEditMode}
        >
            {/* Inner animated wrapper handles press + selection pulse */}
            <Animated.View style={{ transform: [{ scale: pressScale }, { scale: selectionPulse }] }}>
                <Pressable
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onLongPress={onLongPress}
                    delayLongPress={450}
                    style={[chipStyle, { position: 'relative' }]}
                >
                    {children}

                    {/* Animated badge — only for custom items (delete) */}
                    {onDelete && (
                        <Animated.View
                            style={[
                                styles.badge,
                                styles.badgeRemove,
                                {
                                    opacity: badgeOpacity,
                                    transform: [{ scale: badgeScale }],
                                },
                            ]}
                        >
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation?.();
                                    onDelete();
                                }}
                                hitSlop={10}
                                style={styles.badgeCloseButton}
                            >
                                <Ionicons name="close" size={10} color="#FFFFFF" />
                            </Pressable>
                        </Animated.View>
                    )}
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}
