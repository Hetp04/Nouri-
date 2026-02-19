import React, { useEffect, useRef } from 'react';
import { Text, View, TextStyle, Animated, Easing } from 'react-native';

import * as Haptics from 'expo-haptics';

interface Props {
    number: number;
    style?: TextStyle;
}

const NUMBERS = Array(10).fill(0).map((_, i) => i);

function AnimatedDigit({ digit, index, style }: { digit: number; index: number; style?: TextStyle }) {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const numberHeight = (style?.fontSize || 32) * 1.2;
    const lastIndex = useRef(0);

    useEffect(() => {
        // Listener to trigger haptic feedback on each number tick
        const id = animatedValue.addListener(({ value }) => {
            const currentIndex = Math.abs(Math.round(value / numberHeight));
            if (currentIndex !== lastIndex.current) {
                lastIndex.current = currentIndex;
                try {
                    // Use selection feedback for a crisp "tick" sensation
                    Haptics.selectionAsync();
                } catch (e) {
                    // ignore errors on web/unsupported devices
                }
            }
        });

        // Staggered delay based on index (left to right)
        // Spring physics: tension 20, friction 6 gives a soft, heavy mechanical roll
        Animated.sequence([
            Animated.delay(index * 100),
            Animated.spring(animatedValue, {
                toValue: -numberHeight * digit,
                useNativeDriver: true,
                friction: 6,
                tension: 20,
            })
        ]).start();

        return () => {
            animatedValue.removeListener(id);
        };
    }, [digit, numberHeight, index]);

    return (
        <View style={{ height: numberHeight, overflow: 'hidden' }}>
            <Animated.View style={{ transform: [{ translateY: animatedValue }] }}>
                {NUMBERS.map((n) => (
                    <Text
                        key={n}
                        style={[
                            style,
                            {
                                height: numberHeight,
                                textAlign: 'center',
                                lineHeight: numberHeight,
                            },
                        ]}
                    >
                        {n}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
}

export function AnimatedNumber({ number, style }: Props) {
    const digits = number.toString().split('').map(Number);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {digits.map((digit, index) => (
                <AnimatedDigit
                    key={index}
                    index={index}
                    digit={digit}
                    style={style}
                />
            ))}
        </View>
    );
}
