import { useEffect, useRef } from 'react';
import { Animated, Keyboard, KeyboardEvent, Platform, Easing } from 'react-native';

export const useKeyboardHeight = () => {
    const keyboardHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onShow = (event: KeyboardEvent) => {
            Animated.spring(keyboardHeight, {
                toValue: event.endCoordinates.height,
                mass: 3,
                stiffness: 1000,
                damping: 500,
                useNativeDriver: true,
            }).start();
        };

        const onHide = (event: KeyboardEvent) => {
            Animated.spring(keyboardHeight, {
                toValue: 0,
                mass: 3,
                stiffness: 1000,
                damping: 500,
                useNativeDriver: true,
            }).start();
        };

        const showSubscription = Keyboard.addListener(showEvent, onShow);
        const hideSubscription = Keyboard.addListener(hideEvent, onHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [keyboardHeight]);

    return keyboardHeight;
};
