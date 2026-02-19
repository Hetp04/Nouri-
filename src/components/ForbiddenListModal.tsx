import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { styles } from '../styles/forbiddenListModal.styles';
import { CONCERN_OPTIONS, ALLERGY_OPTIONS } from '../data/onboardingOptions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
    visible: boolean;
    onClose: () => void;
    concerns?: string[];
    allergies?: string[];
    onUpdate?: (concerns: string[], allergies: string[]) => void;
}

// ─── WigglePill ───────────────────────────────────────────────────────────────
// True iOS-style jiggle: starts at +angle immediately (like CAKeyframeAnimation
// with values=[valLeft, valRight], autoreverses=YES), with per-pill phase offsets.
// shouldRasterizeIOS prevents sub-pixel border shimmering during rotation.

interface WigglePillProps {
    children: React.ReactNode;
    isEditMode: boolean;
    isSelected: boolean;
    phaseOffset: number;   // ms — staggers start so pills don't move in sync
    onPress: () => void;
    onLongPress: () => void;
    chipStyle: object | object[];
}

function WigglePill({
    children,
    isEditMode,
    isSelected,
    phaseOffset,
    onPress,
    onLongPress,
    chipStyle,
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

                    {/* Animated badge */}
                    <Animated.View
                        style={[
                            badgeStyles.badge,
                            isSelected ? badgeStyles.badgeRemove : badgeStyles.badgeAdd,
                            {
                                opacity: badgeOpacity,
                                transform: [{ scale: badgeScale }],
                            },
                        ]}
                        pointerEvents="none"
                    >
                        <Ionicons
                            name={isSelected ? 'remove' : 'add'}
                            size={11}
                            color="#FFFFFF"
                        />
                    </Animated.View>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}



const badgeStyles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeRemove: {
        backgroundColor: '#FF3B30',
    },
    badgeAdd: {
        backgroundColor: '#2F6B4F',
    },
});

// ─── ForbiddenListModal ───────────────────────────────────────────────────────

export function ForbiddenListModal({
    visible,
    onClose,
    concerns = [],
    allergies = [],
    onUpdate,
}: Props) {
    const anim = useRef(new Animated.Value(0)).current;     // Sheet entrance (translateY only — native driver)
    const tabAnim = useRef(new Animated.Value(0)).current;
    const editModeAnim = useRef(new Animated.Value(0)).current;
    // Modal height constants
    const STATIC_HEIGHT = 165;                   // Header (~80) + Tabs (~85)
    const BASE_HEIGHT = SCREEN_HEIGHT * 0.55;
    const MAX_HEIGHT = SCREEN_HEIGHT * 0.82;
    const KEYBOARD_HEIGHT = SCREEN_HEIGHT * 0.72;

    // Total height animation
    const modalHeightAnim = useRef(new Animated.Value(BASE_HEIGHT)).current;

    // Tracks the current "fitting" height based on content
    const baseHeightRef = useRef(BASE_HEIGHT);
    const isKeyboardOpen = useRef(false);

    // ── Update Modal Height based on content ──────────────────────────────────
    const updateModalHeight = useCallback((contentHeight: number) => {
        // Total needed = static chrome + grid content
        // contentHeight from onContentSizeChange includes the grid's padding
        const needed = contentHeight + STATIC_HEIGHT;

        // Clamp between BASE (initial min) and MAX (safety limit)
        const target = Math.max(BASE_HEIGHT, Math.min(needed, MAX_HEIGHT));

        if (target !== baseHeightRef.current) {
            baseHeightRef.current = target;

            // Only animate base height if keyboard isn't currently overriding it
            if (!isKeyboardOpen.current) {
                Animated.spring(modalHeightAnim, {
                    toValue: target,
                    useNativeDriver: false,
                    friction: 14,
                    tension: 50,
                }).start();
            }
        }
    }, [BASE_HEIGHT, MAX_HEIGHT, modalHeightAnim]);

    const [activeTab, setActiveTab] = React.useState<'concerns' | 'allergies'>('concerns');
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [localConcerns, setLocalConcerns] = React.useState<string[]>(concerns);
    const [localAllergies, setLocalAllergies] = React.useState<string[]>(allergies);

    // ── Custom add state ─────────────────────────────────────────────────────
    // isAdding: whether the inline footer input is visible
    const [isAdding, setIsAdding] = React.useState(false);
    const [customText, setCustomText] = React.useState('');
    const inputRef = useRef<TextInput>(null);
    const scrollRef = useRef<any>(null);

    // Stable per-pill phase offsets (0-100ms spread)
    const phaseOffsets = useRef(
        Array.from({ length: 20 }, () => Math.round(Math.random() * 100))
    ).current;



    // ── Sync when parent data refreshes ──────────────────────────────────────
    useEffect(() => {
        if (visible) {
            setLocalConcerns(concerns);
            setLocalAllergies(allergies);
        } else {
            // Clean up edit mode when sheet closes
            setIsEditMode(false);
            setIsAdding(false);
            setCustomText('');
            editModeAnim.setValue(0);
        }
    }, [visible, concerns.join(','), allergies.join(',')]);

    // ── Keyboard listener ───────────────────────────────────────────────────────
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onShow = Keyboard.addListener(showEvent, () => {
            isKeyboardOpen.current = true;
            // Grow to keyboard-safe height (only if base is smaller)
            const target = Math.max(baseHeightRef.current, KEYBOARD_HEIGHT);
            Animated.spring(modalHeightAnim, {
                toValue: target,
                useNativeDriver: false,
                friction: 14,
                tension: 50,
            }).start();
        });
        const onHide = Keyboard.addListener(hideEvent, () => {
            isKeyboardOpen.current = false;
            // Snap back to whatever the current base height is
            Animated.spring(modalHeightAnim, {
                toValue: baseHeightRef.current,
                useNativeDriver: false,
                friction: 14,
                tension: 50,
            }).start();
        });

        return () => {
            onShow.remove();
            onHide.remove();
        };
    }, []);

    // ── Sheet entrance spring ────────────────────────────────────────────────
    useEffect(() => {
        if (visible && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Animated.spring(anim, {
            toValue: visible ? 1 : 0,
            useNativeDriver: true,
            friction: 10,
            tension: 65,
        }).start();
    }, [visible]);

    // ── Edit mode transition ──────────────────────────────────────────────────
    useEffect(() => {
        Animated.timing(editModeAnim, {
            toValue: isEditMode ? 1 : 0,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [isEditMode]);

    // ── Tab change ────────────────────────────────────────────────────────────
    const handleTabChange = (tab: 'concerns' | 'allergies') => {
        if (tab === activeTab) return;
        Haptics.selectionAsync();
        setActiveTab(tab);
        Animated.spring(tabAnim, {
            toValue: tab === 'concerns' ? 0 : 1,
            useNativeDriver: true,
            friction: 8,
            tension: 55,
        }).start();
    };

    // ── Enter edit mode ───────────────────────────────────────────────────────
    const enterEditMode = useCallback(() => {
        if (!isEditMode) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsEditMode(true);
        }
    }, [isEditMode]);

    // ── Toggle a pill ─────────────────────────────────────────────────────────
    const toggleItem = useCallback((id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (activeTab === 'concerns') {
            setLocalConcerns(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            setLocalAllergies(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    }, [activeTab]);

    const handleAddCustom = useCallback(() => {
        const trimmed = customText.trim();
        if (trimmed && trimmed.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (activeTab === 'concerns') {
                setLocalConcerns(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
            } else {
                setLocalAllergies(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
            }
        }
        setCustomText('');
        setIsAdding(false);
    }, [customText, activeTab]);

    // Dismiss input without saving
    const handleCancelCustom = useCallback(() => {
        setCustomText('');
        setIsAdding(false);
    }, []);

    // ── Save & exit edit mode ─────────────────────────────────────────────────
    const handleDone = useCallback(async () => {
        let finalConcerns = [...localConcerns];
        let finalAllergies = [...localAllergies];

        // Also close any open custom input and save the text first
        if (isAdding && customText.trim()) {
            const trimmed = customText.trim();
            if (activeTab === 'concerns') {
                if (!finalConcerns.includes(trimmed)) finalConcerns.push(trimmed);
            } else {
                if (!finalAllergies.includes(trimmed)) finalAllergies.push(trimmed);
            }
        }

        // Update local state to match final values
        setLocalConcerns(finalConcerns);
        setLocalAllergies(finalAllergies);

        setIsAdding(false);
        setCustomText('');
        setIsEditMode(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_profiles').upsert(
                    {
                        user_id: user.id,
                        concerns: finalConcerns,
                        allergies: finalAllergies,
                        updated_at: new Date().toISOString(),
                    }
                );

                if (onUpdate) onUpdate(finalConcerns, finalAllergies);
            }
        } catch (e) {
            console.error('Failed to save profile update:', e);
        }
    }, [localConcerns, localAllergies, onUpdate, isAdding, customText, activeTab]);

    // ── Build pill data ───────────────────────────────────────────────────────
    const displayData = useMemo(() => {
        const optionsCore = activeTab === 'concerns' ? CONCERN_OPTIONS : ALLERGY_OPTIONS;
        const currentSelection = activeTab === 'concerns' ? localConcerns : localAllergies;

        if (isEditMode) {
            // Any custom items the user has already added (not in core options)
            const customItems = currentSelection
                .filter(id => !optionsCore.some(opt => opt.id === id))
                .map(id => ({
                    id,
                    label: id,
                    icon: null as any,
                    type: 'custom' as const,
                    isSelected: true,
                }));

            // The "+ Add Custom" action chip (always last)
            const addButton = {
                id: '__ADD_BUTTON__',
                label: 'Add Custom',
                icon: 'add-outline' as any,
                type: 'action' as const,
                isSelected: false,
            };

            if (isAdding) {
                // Keyboard is open — only show custom items + input chip.
                // Hiding predefined options keeps the grid compact so the
                // keyboard doesn't push the input out of view.
                return [...customItems, addButton];
            }

            // Normal edit mode: core options + custom items + add button
            const coreItems = optionsCore.map(opt => ({
                ...opt,
                type: 'known' as const,
                isSelected: currentSelection.includes(opt.id),
            }));

            return [...coreItems, ...customItems, addButton];
        }

        // View Mode: only selected items
        return currentSelection.map(id => {
            const known = optionsCore.find(opt => opt.id === id);
            if (known) return { ...known, type: 'known' as const, isSelected: true };
            return { id, label: id, icon: null as any, type: 'custom' as const, isSelected: true };
        });
    }, [activeTab, localConcerns, localAllergies, isEditMode, isAdding]);


    // ── Derived animation values ──────────────────────────────────────────────
    const gridOpacity = editModeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1], // both modes stay visible; crossfade handled by content switch
    });
    const gridScale = editModeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1],
    });

    // modalHeightAnim is a raw pixel value — no interpolation needed
    const modalHeight = modalHeightAnim;

    return (
        <React.Fragment>
            {/* Backdrop */}
            <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onClose}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                <Animated.View style={[styles.backdrop, { opacity: anim }]} />
            </Pressable>

            {/* ── Outer: slide-up entrance (translateY, native driver) ── */}
            <Animated.View
                style={[
                    styles.modalSlider,
                    {
                        transform: [{
                            translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [SCREEN_HEIGHT * 0.6, 0],
                            }),
                        }],
                    },
                ]}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                {/* ── Inner: height expansion (JS driver — no conflict with translateY) ── */}
                <Animated.View style={[styles.modalContainer, { height: modalHeight }]}>
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="shield" size={18} color="#FF3B30" />
                            </View>
                            <Text style={styles.headerTitle}>Forbidden List</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Pressable
                                onPress={isEditMode ? handleDone : () => setIsEditMode(true)}
                                hitSlop={12}
                                style={({ pressed }) => [
                                    styles.editButton,
                                    { opacity: pressed ? 0.6 : 1 },
                                ]}
                            >
                                <Text style={styles.editButtonText}>
                                    {isEditMode ? 'Done' : 'Edit'}
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={onClose}
                                hitSlop={16}
                                style={({ pressed }) => [
                                    styles.closeButton,
                                    { backgroundColor: pressed ? '#E5E5E5' : '#F5F5F5' },
                                ]}
                            >
                                <Ionicons name="close" size={20} color="#666" />
                            </Pressable>
                        </View>
                    </View>

                    {/* ── Tab Toggle ── */}
                    <View style={styles.toggleWrapper}>
                        <View style={styles.toggleContainer}>
                            <Animated.View
                                style={[
                                    styles.toggleSlider,
                                    {
                                        transform: [{
                                            translateX: tabAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, (SCREEN_WIDTH - 48 - 8) / 2],
                                            }),
                                        }],
                                    },
                                ]}
                            />
                            <Pressable style={styles.toggleButton} onPress={() => handleTabChange('concerns')}>
                                <Text style={[styles.toggleText, activeTab === 'concerns' && styles.toggleTextActive]}>
                                    Concerns
                                </Text>
                            </Pressable>
                            <Pressable style={styles.toggleButton} onPress={() => handleTabChange('allergies')}>
                                <Text style={[styles.toggleText, activeTab === 'allergies' && styles.toggleTextActive]}>
                                    Allergies
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* ── Pill Grid ── */}
                    {displayData.length > 0 ? (
                        <Animated.ScrollView
                            ref={scrollRef}
                            style={[styles.contentScrollView]}
                            contentContainerStyle={[styles.optionsGrid, { paddingBottom: isEditMode ? 40 : 24 }]}
                            scrollEnabled={true}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            onContentSizeChange={(_w, h) => updateModalHeight(h)}
                        >
                            {displayData.map((item, index) => {
                                // ── "+ Add Custom" button chip ──────────────────
                                if (item.id === '__ADD_BUTTON__') {
                                    if (isAdding) {
                                        // Morphed state: the chip becomes a live text input
                                        return (
                                            <View
                                                key="__add_input__"
                                                style={[styles.optionChip, {
                                                    borderColor: '#2F6B4F',
                                                    backgroundColor: '#F0F7F4',
                                                    borderWidth: 1.5,
                                                    minWidth: 130,
                                                    flexShrink: 1,
                                                }]}
                                            >
                                                <TextInput
                                                    ref={inputRef}
                                                    style={[styles.optionText, {
                                                        color: '#1A1A1A',
                                                        padding: 0,
                                                        margin: 0,
                                                        minWidth: 80,
                                                        flexShrink: 1,
                                                    }]}
                                                    value={customText}
                                                    onChangeText={setCustomText}
                                                    placeholder={activeTab === 'concerns' ? 'Type concern…' : 'Type allergen…'}
                                                    placeholderTextColor="#9CA3AF"
                                                    returnKeyType="done"
                                                    onSubmitEditing={handleAddCustom}
                                                    blurOnSubmit={true}
                                                    autoCorrect={false}
                                                    autoCapitalize="words"
                                                    maxLength={40}
                                                    autoFocus
                                                />
                                                <Pressable onPress={handleCancelCustom} hitSlop={8}>
                                                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                                </Pressable>
                                            </View>
                                        );
                                    }

                                    // Default: dashed "+ Add Custom" chip
                                    return (
                                        <Pressable
                                            key="__add_btn__"
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setIsAdding(true);
                                                setTimeout(() => inputRef.current?.focus(), 50);
                                            }}
                                            style={[styles.optionChip, styles.optionChipUnselected, {
                                                borderStyle: 'dashed',
                                                borderWidth: 1.5,
                                            }]}
                                        >
                                            <Ionicons name="add" size={16} color="#2F6B4F" />
                                            <Text style={[styles.optionText, { color: '#2F6B4F' }]}>Add Custom</Text>
                                        </Pressable>
                                    );
                                }


                                const isSelected = item.isSelected;
                                const chipStyle = [
                                    item.type === 'known' ? styles.optionChip : styles.customChip,
                                    !isSelected && styles.optionChipUnselected,
                                ];

                                return (
                                    <WigglePill
                                        key={`${item.id}-${isEditMode}`}
                                        isEditMode={isEditMode}
                                        isSelected={isSelected}
                                        phaseOffset={phaseOffsets[index % phaseOffsets.length]}
                                        onLongPress={enterEditMode}
                                        onPress={() => isEditMode && toggleItem(item.id)}
                                        chipStyle={chipStyle}
                                    >
                                        {/* Icon or image */}
                                        {item.type === 'known' && (
                                            <>
                                                {(item as any).image ? (
                                                    <Image
                                                        source={
                                                            isSelected && (item as any).selectedImage
                                                                ? (item as any).selectedImage
                                                                : (item as any).image
                                                        }
                                                        style={[
                                                            { width: 20, height: 20 },
                                                            !isSelected && { tintColor: '#9CA3AF' },
                                                        ]}
                                                        resizeMode="contain"
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name={
                                                            isSelected
                                                                ? (item as any).icon?.replace('-outline', '') as any
                                                                : (item as any).icon as any
                                                        }
                                                        size={18}
                                                        color={isSelected ? '#2F6B4F' : '#9CA3AF'}
                                                    />
                                                )}
                                            </>
                                        )}

                                        <Text style={[
                                            item.type === 'known' ? styles.optionText : styles.customChipText,
                                            !isSelected && styles.optionTextUnselected,
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </WigglePill>
                                );
                            })}
                        </Animated.ScrollView>
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons
                                name={activeTab === 'concerns' ? 'list-outline' : 'warning-outline'}
                                size={72}
                                color="#E5E5E5"
                                style={{ marginBottom: 20 }}
                            />
                            <Text style={styles.placeholderTitle}>
                                {activeTab === 'concerns' ? 'No concerns added' : 'No allergies added'}
                            </Text>
                            <Text style={styles.placeholderText}>
                                {activeTab === 'concerns'
                                    ? 'Tap Edit to add your dietary concerns.'
                                    : 'Tap Edit to add your allergens.'}
                            </Text>
                        </View>
                    )}

                </Animated.View>
            </Animated.View>
        </React.Fragment>
    );
}

// ─── Custom Input Inline Styles ────────────────────────────────────────────────
const customInputStyles = StyleSheet.create({
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#2F6B4F',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
        color: '#111111',
        padding: 0,
        margin: 0,
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
    },
    actionText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
    },
    cancelBtn: {
        padding: 4,
    },
});
