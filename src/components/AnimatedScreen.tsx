import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Easing } from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
    children: React.ReactNode;
    screenKey: string;
    direction?: 'forward' | 'back';
}

export function AnimatedScreen({ children, screenKey, direction = 'forward' }: Props) {
    // Always keep a ref to the latest children so animation callbacks never use stale closures
    const latestChildrenRef = useRef(children);
    useEffect(() => {
        latestChildrenRef.current = children;
    });

    const [displayScreens, setDisplayScreens] = useState<{
        key: string;
        content: React.ReactNode;
        isBack: boolean;
    }[]>([
        { key: screenKey, content: children, isBack: direction === 'back' }
    ]);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const lastKey = useRef(screenKey);

    useEffect(() => {
        if (screenKey !== lastKey.current) {
            const isBack = direction === 'back';
            const oldScreen = displayScreens[displayScreens.length - 1];

            setDisplayScreens([
                oldScreen,
                { key: screenKey, content: children, isBack }
            ]);

            lastKey.current = screenKey;
            slideAnim.setValue(0);

            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 450,
                easing: Easing.bezier(0.22, 1, 0.36, 1), // Smooth deceleration for paper-like feel
                useNativeDriver: true,
            }).start(() => {
                // Use latestChildren ref so we always settle on the most up-to-date
                // props, not a stale closure captured 450ms ago.
                setDisplayScreens([{ key: screenKey, content: latestChildrenRef.current, isBack }]);
            });
        }
    }, [screenKey, direction]);

    const isBack = direction === 'back';

    // Old screen moves slower (60% speed) for subtle parallax depth
    const oldScreenTranslate = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, isBack ? width * 0.6 : -width * 0.6],
    });

    const newScreenTranslate = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [isBack ? -width : width, 0],
    });

    // Subtle fade on old screen for paper-like depth
    const oldScreenOpacity = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
    });

    return (
        <View style={styles.container}>
            {displayScreens.map((screen, index) => {
                const isOld = index === 0 && displayScreens.length === 2;
                const isNew = index === 1;

                return (
                    <Animated.View
                        key={screen.key}
                        style={[
                            styles.screen,
                            isOld ? {
                                transform: [{ translateX: oldScreenTranslate }],
                                opacity: oldScreenOpacity,
                                zIndex: 1,
                            } : isNew ? {
                                transform: [{ translateX: newScreenTranslate }],
                                zIndex: 2,
                            } : {
                                zIndex: 1,
                            },
                        ]}
                    >
                        {screen.content}
                    </Animated.View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFEFB',
        position: 'relative',
        overflow: 'hidden',
    },
    screen: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFEFB',
    },
});
