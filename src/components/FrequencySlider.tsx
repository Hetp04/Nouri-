import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Constants
const TRACK_HEIGHT = 320;
const HANDLE_RADIUS = 28;
const HANDLE_SIZE = 56;
const LABEL_ROW_HEIGHT = 44;
const MIN_BOUND = HANDLE_RADIUS;
const MAX_BOUND = TRACK_HEIGHT - HANDLE_RADIUS;

// Color palette
const COLORS = {
    bg: ['#FBFBF9', '#FFFDE7', '#FFF3E0', '#FFEBEE'], // page bg -> yellow -> orange -> red
    accent: ['#4CAF50', '#FFC107', '#FF9800', '#F44336'],
};

const LABELS = [
    { label: 'Daily', value: 3, description: 'Every day' },
    { label: 'Often', value: 2, description: 'Several times a week' },
    { label: 'Rarely', value: 1, description: 'Occasionally' },
    { label: 'Never', value: 0, description: 'Avoid completely' },
];

// Pure utility functions (memoized via module scope)
const getYFromValue = (val: number): number => MAX_BOUND - (val / 3) * (MAX_BOUND - MIN_BOUND);
const getValueFromY = (y: number): number => Math.round(((MAX_BOUND - y) / (MAX_BOUND - MIN_BOUND)) * 3);

const lerpColor = (c1: string, c2: string, t: number): string => {
    const parse = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const [r1, g1, b1] = parse(c1), [r2, g2, b2] = parse(c2);
    return `#${Math.round(r1 + (r2 - r1) * t).toString(16).padStart(2, '0')}${Math.round(g1 + (g2 - g1) * t).toString(16).padStart(2, '0')}${Math.round(b1 + (b2 - b1) * t).toString(16).padStart(2, '0')}`;
};

const interpolateColors = (pos: number): { background: string; accent: string } => {
    const idx = Math.min(3, Math.floor(pos * 3) + (pos === 1 ? 0 : 1));
    const t = pos === 1 ? 1 : (pos * 3) % 1;
    return {
        background: lerpColor(COLORS.bg[Math.max(0, idx - 1)], COLORS.bg[idx], t),
        accent: lerpColor(COLORS.accent[Math.max(0, idx - 1)], COLORS.accent[idx], t),
    };
};

const getIcon = (pos: number): keyof typeof Ionicons.glyphMap => {
    if (pos >= 0.75) return 'calendar-outline';      // Daily - every day
    if (pos >= 0.5) return 'time-outline';           // Often - several times a week
    if (pos >= 0.25) return 'hourglass-outline';     // Rarely - occasionally
    return 'close-circle-outline';                    // Never - avoid completely
};

// Spring config - smoother, less snappy
const SPRING_CONFIG = { useNativeDriver: true, tension: 80, friction: 12 } as const;

type Props = {
    value: number;
    onChange: (value: number) => void;
    onColorChange?: (background: string, accent: string) => void;
};

export function FrequencySlider({ value, onChange, onColorChange }: Props) {
    const [currentDragValue, setCurrentDragValue] = useState(value);
    const [isDragging, setIsDragging] = useState(false);
    const animatedY = useRef(new Animated.Value(getYFromValue(value))).current;
    const animatedScale = useRef(new Animated.Value(1)).current;
    const animatedYRef = useRef(getYFromValue(value));
    const dragStartY = useRef(0);
    const currentValue = useRef(value);

    // Sync animated value listener
    useEffect(() => {
        const id = animatedY.addListener(({ value: y }) => { animatedYRef.current = y; });
        return () => animatedY.removeListener(id);
    }, [animatedY]);

    // Update when prop changes
    useEffect(() => {
        currentValue.current = value;
        setCurrentDragValue(value);
        const y = getYFromValue(value);
        animatedY.setValue(y);
        animatedYRef.current = y;
        onColorChange?.(...Object.values(interpolateColors(value / 3)) as [string, string]);
    }, [value]);

    // Pan responder - larger touch area for easier grabbing
    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: (e) => {
            const { locationX, locationY } = e.nativeEvent;
            // Expanded touch area: 80px width, 20px padding top/bottom
            return locationX >= -10 && locationX <= 70 && locationY >= -20 && locationY <= TRACK_HEIGHT + 20;
        },
        onMoveShouldSetPanResponder: (e, g) => {
            const { locationX, locationY } = e.nativeEvent;
            return locationX >= -10 && locationX <= 70 && locationY >= -20 && locationY <= TRACK_HEIGHT + 20 && Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 5;
        },
        onPanResponderGrant: () => {
            dragStartY.current = animatedYRef.current;
            setIsDragging(true);
            Animated.spring(animatedScale, { toValue: 1.05, useNativeDriver: true, tension: 300, friction: 20 }).start();
        },
        onPanResponderMove: (_, g) => {
            let newY = dragStartY.current + g.dy;
            if (newY < MIN_BOUND) newY = MIN_BOUND + (newY - MIN_BOUND) * 0.15;
            else if (newY > MAX_BOUND) newY = MAX_BOUND + (newY - MAX_BOUND) * 0.15;
            animatedY.setValue(newY);
            animatedYRef.current = newY;
            const val = getValueFromY(Math.max(MIN_BOUND, Math.min(MAX_BOUND, newY)));
            if (val !== currentValue.current) {
                // Trigger intensity based on level
                if (val === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                else if (val === 1) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                else if (val === 2) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                else if (val === 3) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

                currentValue.current = val;
            }
            setCurrentDragValue(val);
            onColorChange?.(...Object.values(interpolateColors(val / 3)) as [string, string]);
        },
        onPanResponderRelease: (_, g) => {
            const clampedY = Math.max(MIN_BOUND, Math.min(MAX_BOUND, dragStartY.current + g.dy));
            const newVal = getValueFromY(clampedY);
            const snappedY = getYFromValue(newVal);
            Animated.spring(animatedY, { ...SPRING_CONFIG, toValue: snappedY }).start(({ finished }) => {
                if (finished) animatedYRef.current = snappedY;
            });
            setIsDragging(false);
            Animated.spring(animatedScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
            // Final confirmation haptic matching level intensity
            if (newVal === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            else if (newVal === 1) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            else if (newVal === 2) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            else if (newVal === 3) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            currentValue.current = newVal;
            setCurrentDragValue(newVal);
            onChange(newVal);
            onColorChange?.(...Object.values(interpolateColors(newVal / 3)) as [string, string]);
        },
        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: () => {
            setIsDragging(false);
            Animated.spring(animatedScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
            const snappedY = getYFromValue(currentValue.current);
            Animated.spring(animatedY, { ...SPRING_CONFIG, toValue: snappedY }).start(({ finished }) => {
                if (finished) animatedYRef.current = snappedY;
            });
        },
    })).current;

    // Derived values
    const colors = useMemo(() => interpolateColors(currentDragValue / 3), [currentDragValue]);
    const icon = useMemo(() => getIcon(currentDragValue / 3), [currentDragValue]);

    // Animated label opacity with ease in/out
    const getAnimatedLabelStyle = useCallback((labelValue: number) => {
        const handleY = getYFromValue(currentDragValue);
        const labelY = getYFromValue(labelValue);
        const distance = Math.abs(handleY - labelY) / (MAX_BOUND - MIN_BOUND);
        const isActive = distance < 0.15, isNear = distance < 0.3;
        const opacity = isActive ? 1 : isNear ? 0.7 : 0.4;
        return {
            fontWeight: isActive ? '700' : isNear ? '500' : '400' as TextStyle['fontWeight'],
            color: isActive ? '#202123' : isNear ? '#6E6E80' : '#A1A1AA',
            opacity,
        };
    }, [currentDragValue]);

    // Track fill interpolation
    const animatedFillScale = useMemo(() => animatedY.interpolate({
        inputRange: [MIN_BOUND, MAX_BOUND],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    }), [animatedY]);

    const animatedFillTranslateY = useMemo(() =>
        Animated.multiply(Animated.subtract(1, animatedFillScale), (TRACK_HEIGHT - HANDLE_RADIUS) / 2),
        [animatedFillScale]);

    return (
        <View style={styles.container}>
            <View style={styles.sliderContainer}>
                <View style={styles.track}>
                    <Animated.View style={[styles.trackFill, {
                        height: TRACK_HEIGHT - HANDLE_RADIUS,
                        backgroundColor: colors.accent,
                        transform: [{ translateY: animatedFillTranslateY }, { scaleY: animatedFillScale }],
                    }]} />
                </View>
                <Animated.View
                    style={[styles.handle, {
                        width: HANDLE_SIZE, height: HANDLE_SIZE, borderRadius: HANDLE_RADIUS,
                        borderColor: colors.accent, shadowColor: colors.accent,
                        transform: [
                            { translateY: Animated.add(animatedY, -HANDLE_RADIUS) },
                            { scale: animatedScale },
                        ],
                    }]}
                    {...panResponder.panHandlers}
                >
                    <Ionicons name={icon} size={24} color={colors.accent} />
                </Animated.View>
            </View>
            <View style={[styles.labelsContainer, { height: TRACK_HEIGHT }]}>
                {LABELS.map(item => (
                    <View key={item.label} style={[styles.labelWrapper, { top: getYFromValue(item.value) - LABEL_ROW_HEIGHT / 2 }]}>
                        <Animated.Text style={[styles.label, getAnimatedLabelStyle(item.value)]}>{item.label}</Animated.Text>
                        <Animated.Text style={[styles.description, getAnimatedLabelStyle(item.value)]}>{item.description}</Animated.Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center' },
    sliderContainer: { width: 60, alignItems: 'center' },
    track: { width: 8, height: TRACK_HEIGHT, backgroundColor: '#E5E5E5', borderRadius: 4, overflow: 'hidden' },
    trackFill: { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 4 },
    handle: { position: 'absolute', backgroundColor: '#FFFFFF', borderWidth: 4, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, left: (60 - HANDLE_SIZE) / 2 },
    labelsContainer: { marginLeft: 16, width: 140, position: 'relative' },
    labelWrapper: { position: 'absolute', left: 0, right: 0, height: LABEL_ROW_HEIGHT, justifyContent: 'flex-start', paddingTop: 4 },
    label: { fontSize: 16, letterSpacing: 0.3, fontWeight: '600' },
    description: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
});
