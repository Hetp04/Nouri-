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
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { styles } from '../styles/forbiddenListModal.styles';
import { CONCERN_OPTIONS, ALLERGY_OPTIONS } from '../data/onboardingOptions';
import { WigglePill } from './WigglePill';
import { freepikService } from '../services/freepikService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
    visible: boolean;
    onClose: () => void;
    concerns?: string[];
    allergies?: string[];
    onUpdate?: (concerns: string[], allergies: string[]) => void;
}

// ─── ForbiddenListItem ────────────────────────────────────────────────────────
interface ForbiddenListItemProps {
    item: any;
    isEditMode: boolean;
    isSelected: boolean;
    phaseOffset: number;
    sparkleAnim: Animated.Value;
    activeTab: 'concerns' | 'allergies';
    isAdding: boolean;
    customText: string;
    setCustomText: (text: string) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
    onCanceladd: () => void;
    onEnterEditMode: () => void;
    onStartAdding: () => void;
}

const ForbiddenListItem = React.memo(({
    item,
    isEditMode,
    isSelected,
    phaseOffset,
    sparkleAnim,
    activeTab,
    isAdding,
    customText,
    setCustomText,
    onToggle,
    onDelete,
    onAdd,
    onCanceladd,
    onEnterEditMode,
    onStartAdding,
}: ForbiddenListItemProps) => {
    const inputRef = useRef<TextInput>(null);

    // ── "+ Add Custom" button chip ──────────────────
    if (item.id === '__ADD_BUTTON__') {
        if (isAdding) {
            // Morphed state: the chip becomes a live text input
            return (
                <View
                    key="__add_input__"
                    style={[styles.optionChip, styles.inputChipMorphed]}
                >
                    <TextInput
                        ref={inputRef}
                        style={[styles.optionText, styles.inputFieldMorphed]}
                        value={customText}
                        onChangeText={setCustomText}
                        placeholder={activeTab === 'concerns' ? 'Type concern…' : 'Type allergen…'}
                        placeholderTextColor="#9CA3AF"
                        returnKeyType="done"
                        onSubmitEditing={onAdd}
                        blurOnSubmit={true}
                        autoCorrect={false}
                        autoCapitalize="words"
                        maxLength={40}
                        autoFocus
                    />
                    <Pressable onPress={onCanceladd} hitSlop={8}>
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
                    onStartAdding();
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                style={[styles.optionChip, styles.optionChipUnselected, styles.addCustomChip]}
            >
                <Ionicons name="add" size={16} color="#2F6B4F" />
                <Text style={[styles.optionText, { color: '#2F6B4F' }]}>Add Custom</Text>
            </Pressable>
        );
    }

    const chipStyle = [
        item.type === 'known' ? styles.optionChip : styles.customChip,
        !isSelected && styles.optionChipUnselected,
    ];

    return (
        <WigglePill
            key={`${item.id}-${isEditMode}`}
            isEditMode={isEditMode}
            isSelected={isSelected}
            phaseOffset={phaseOffset}
            onLongPress={onEnterEditMode}
            onPress={() => isEditMode && onToggle(item.id)}
            chipStyle={chipStyle}
            onDelete={item.type === 'custom' ? () => onDelete(item.id) : undefined}
        >
            {/* Icon or image */}
            {item.type === 'known' ? (
                <>
                    {(item as any).image ? (
                        <Image
                            source={
                                isSelected && (item as any).selectedImage
                                    ? (item as any).selectedImage
                                    : (item as any).image
                            }
                            style={[
                                styles.iconImage,
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
            ) : (
                <Animated.View style={[
                    styles.customIconContainer,
                    item.icon === 'sparkles-outline' ? {
                        transform: [{
                            rotate: sparkleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg']
                            })
                        }]
                    } : {}
                ]}>
                    {typeof item.icon === 'string' && item.icon.startsWith('http') ? (
                        <ExpoImage
                            source={{ uri: item.icon }}
                            style={[
                                styles.customIconImage,
                                isSelected ? styles.customIconActive : styles.customIconInactive
                            ]}
                            contentFit="contain"
                            tintColor={isSelected ? '#2F6B4F' : '#9CA3AF'}
                        />
                    ) : (
                        <Ionicons
                            name={
                                isSelected
                                    ? (item.icon as any)?.replace('-outline', '')
                                    : (item.icon as any) || 'help-circle-outline'
                            }
                            size={18}
                            color={isSelected ? '#2F6B4F' : '#9CA3AF'}
                            style={isSelected ? styles.customIconActive : styles.customIconInactive}
                        />
                    )}
                </Animated.View>
            )}

            <Text style={[
                item.type === 'known' ? styles.optionText : styles.customChipText,
                !isSelected && styles.optionTextUnselected,
            ]}>
                {item.label}
            </Text>
        </WigglePill>
    );
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

    // Custom Icons mapping: label -> url
    const [customIcons, setCustomIcons] = React.useState<Record<string, { url: string; status: 'generating' | 'completed' | 'failed' }>>({});
    const generationTasks = useRef<Set<string>>(new Set());
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    // Unified state for selections and custom items
    const [selections, setSelections] = React.useState<{ concerns: string[]; allergies: string[] }>({
        concerns: [],
        allergies: []
    });
    const [allCustomItems, setAllCustomItems] = React.useState<{ concerns: string[]; allergies: string[] }>({
        concerns: [],
        allergies: []
    });
    const [aiIconEnabled, setAiIconEnabled] = React.useState(true);

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



    // Sparkle animation loop for "generating" state
    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(sparkleAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, []);

    // ── Sync when parent data refreshes ──────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            if (visible) {
                // Seed from props immediately for instant display
                const initialConcerns = concerns;
                const initialAllergies = allergies;

                setSelections({
                    concerns: initialConcerns,
                    allergies: initialAllergies
                });

                // Then fetch fresh data directly from Supabase
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data } = await supabase
                            .from('user_profiles')
                            .select('concerns, allergies, custom_icons_map, ai_icon_enabled')
                            .eq('user_id', user.id)
                            .single();

                        if (data) {
                            console.log('[ForbiddenList] allergies prop:', allergies);
                            console.log('[ForbiddenList] data.allergies from DB:', data.allergies);
                            console.log('[ForbiddenList] data.concerns from DB:', data.concerns);
                            const freshConcerns = data.concerns || concerns;
                            const freshAllergies = data.allergies || allergies;

                            setSelections({
                                concerns: freshConcerns,
                                allergies: freshAllergies
                            });

                            // Seed custom items from fresh data
                            setAllCustomItems({
                                concerns: freshConcerns.filter((id: string) => !CONCERN_OPTIONS.some(o => o.id === id)),
                                allergies: freshAllergies.filter((id: string) => !ALLERGY_OPTIONS.some(o => o.id === id))
                            });

                            if (data.custom_icons_map) {
                                setCustomIcons(data.custom_icons_map as any);
                            }
                            if (data.ai_icon_enabled !== undefined) {
                                setAiIconEnabled(data.ai_icon_enabled);
                            }
                        }
                    }
                } catch (e) {
                    // Fallback: just seed from props
                    const optionsCore = CONCERN_OPTIONS;
                    const optionsAllergy = ALLERGY_OPTIONS;
                    setAllCustomItems({
                        concerns: concerns.filter(id => !optionsCore.some(o => o.id === id)),
                        allergies: allergies.filter(id => !optionsAllergy.some(o => o.id === id))
                    });
                    console.error('Failed to fetch profile settings:', e);
                }
            } else {
                // Clean up edit mode when sheet closes
                setIsEditMode(false);
                setIsAdding(false);
                setCustomText('');
                editModeAnim.setValue(0);
            }
        };

        fetchProfile();
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
            useNativeDriver: false, // Animating width/margin requires the JS driver
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
        setSelections(prev => {
            const currentList = prev[activeTab];
            const newList = currentList.includes(id)
                ? currentList.filter(i => i !== id)
                : [...currentList, id];

            return {
                ...prev,
                [activeTab]: newList
            };
        });
    }, [activeTab]);

    // ── Permanently delete a custom item ──────────────────────────────────────
    const handleDeleteCustom = useCallback((id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        // Remove from current selection
        setSelections(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].filter(i => i !== id)
        }));

        // Remove from known custom items list
        setAllCustomItems(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].filter(i => i !== id)
        }));

        // Also remove the saved icon for this item
        setCustomIcons(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    }, [activeTab]);

    // ── Add custom item with AI Icon Generation ────────────────────────────────
    const handleAddCustom = useCallback(() => {
        const trimmed = customText.trim();
        if (trimmed && trimmed.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Add to list immediately (select it)
            setSelections(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].includes(trimmed) ? prev[activeTab] : [...prev[activeTab], trimmed]
            }));

            setAllCustomItems(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].includes(trimmed) ? prev[activeTab] : [...prev[activeTab], trimmed]
            }));

            // Trigger AI Generation if not already generating/exists AND enabled
            if (!customIcons[trimmed] && !generationTasks.current.has(trimmed)) {
                if (!aiIconEnabled) {
                    // Just set as failed/default icon immediately
                    setCustomIcons(prev => ({
                        ...prev,
                        [trimmed]: { url: '', status: 'failed' }
                    }));
                } else {
                    generationTasks.current.add(trimmed);
                    setCustomIcons(prev => ({
                        ...prev,
                        [trimmed]: { url: '', status: 'generating' }
                    }));

                    // Run generation in background — don't await so UI isn't blocked
                    (async () => {
                        try {
                            const taskId = await freepikService.generateIcon(trimmed, 'solid');
                            if (taskId) {
                                const url = await freepikService.waitForIcon(taskId);
                                const nextStatus = url ? 'completed' : 'failed';
                                const nextUrl = url ?? '';

                                setCustomIcons(prev => {
                                    const updated = {
                                        ...prev,
                                        [trimmed]: { url: nextUrl, status: nextStatus as any }
                                    };

                                    // Auto-save to Supabase as soon as the icon resolves
                                    if (url) {
                                        supabase.auth.getUser().then(({ data: { user } }) => {
                                            if (user) {
                                                supabase.from('user_profiles').upsert({
                                                    user_id: user.id,
                                                    custom_icons_map: updated,
                                                    updated_at: new Date().toISOString(),
                                                }, { onConflict: 'user_id' }).then(({ error }) => {
                                                    if (error) console.error('[Freepik] Icon save error:', error);
                                                    else console.log('[Freepik] Icon URL saved for:', trimmed);
                                                });
                                            }
                                        });
                                    }

                                    return updated;
                                });
                            } else {
                                setCustomIcons(prev => ({
                                    ...prev,
                                    [trimmed]: { url: '', status: 'failed' }
                                }));
                            }
                        } catch (err) {
                            console.error('Icon generation failed:', err);
                            setCustomIcons(prev => ({
                                ...prev,
                                [trimmed]: { url: '', status: 'failed' }
                            }));
                        } finally {
                            generationTasks.current.delete(trimmed);
                        }
                    })();
                }
            }
        }
        setCustomText('');
        setIsAdding(false);
    }, [customText, activeTab, customIcons]);

    // Dismiss input without saving
    const handleCancelCustom = useCallback(() => {
        setCustomText('');
        setIsAdding(false);
    }, []);

    // ── Save & exit edit mode ─────────────────────────────────────────────────
    // ── Save & exit edit mode ─────────────────────────────────────────────────
    const handleDone = useCallback(async () => {
        // Clone current state
        const finalSelections = { ...selections };

        // Also close any open custom input and save the text first
        if (isAdding && customText.trim()) {
            const trimmed = customText.trim();
            const currentList = finalSelections[activeTab];
            if (!currentList.includes(trimmed)) {
                finalSelections[activeTab] = [...currentList, trimmed];
            }
        }

        // Update local state to match final values
        setSelections(finalSelections);

        setIsAdding(false);
        setCustomText('');
        setIsEditMode(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // We'll store the icons map in the same profile record
                await supabase.from('user_profiles').upsert(
                    {
                        user_id: user.id,
                        concerns: finalSelections.concerns,
                        allergies: finalSelections.allergies,
                        custom_icons_map: customIcons,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                );

                if (onUpdate) onUpdate(finalSelections.concerns, finalSelections.allergies);
            }
        } catch (e) {
            console.error('Failed to save profile update:', e);
        }
    }, [selections, onUpdate, isAdding, customText, activeTab, customIcons]);

    // ── Build pill data ───────────────────────────────────────────────────────
    // ── Build pill data ───────────────────────────────────────────────────────
    const displayData = useMemo(() => {
        const optionsCore = activeTab === 'concerns' ? CONCERN_OPTIONS : ALLERGY_OPTIONS;
        const currentSelection = selections[activeTab];

        if (isEditMode) {
            // All custom items ever added (not just currently selected)
            const allCustom = allCustomItems[activeTab];
            const customItems = allCustom.map(id => {
                const customIcon = customIcons[id];
                return {
                    id,
                    label: id,
                    icon: customIcon?.status === 'completed' ? customIcon.url : (customIcon?.status === 'generating' ? 'sparkles-outline' : 'nutrition-outline'),
                    type: 'custom' as const,
                    isSelected: currentSelection.includes(id),
                };
            });

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

            const customIcon = customIcons[id];
            return {
                id,
                label: id,
                icon: customIcon?.status === 'completed' ? customIcon.url : (customIcon?.status === 'generating' ? 'sparkles-outline' : 'nutrition-outline'),
                type: 'custom' as const,
                isSelected: true
            };
        });
    }, [activeTab, selections, isEditMode, isAdding, allCustomItems, customIcons]);


    // ── Derived animation values ──────────────────────────────────────────────
    const gridOpacity = editModeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1],
    });
    const gridScale = editModeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1],
    });

    // modalHeightAnim is a raw pixel value — no interpolation needed
    const modalHeight = modalHeightAnim;

    return (
        <View style={styles.wrapper} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Backdrop */}
            <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onClose}
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

                        <View style={styles.headerActions}>
                            {/* Slot 1: The Edit Pencil — Shrinks and fades in edit mode */}
                            <Animated.View
                                pointerEvents={isEditMode ? 'none' : 'auto'}
                                style={{
                                    opacity: editModeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 0]
                                    }),
                                    width: editModeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [32, 0]
                                    }),
                                    overflow: 'hidden',
                                    marginRight: editModeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [8, 0]
                                    }),
                                }}>
                                <Pressable
                                    onPress={enterEditMode}
                                    hitSlop={20} // Increased hitSlop for better tappability
                                    style={({ pressed }) => [
                                        styles.closeButton,
                                        { backgroundColor: pressed ? '#E5E5E5' : '#F5F5F5' },
                                        styles.editButtonFixed,
                                    ]}
                                >
                                    <Ionicons name="create-outline" size={20} color="#666" />
                                </Pressable>
                            </Animated.View>

                            {/* Slot 2: The Close/Done Button — Morphs from circle to stadium */}
                            <Animated.View style={{
                                width: editModeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [32, 72]
                                }),
                            }}>
                                <Pressable
                                    onPress={isEditMode ? handleDone : onClose}
                                    hitSlop={16}
                                    style={({ pressed }) => [
                                        isEditMode ? styles.editButton : styles.closeButton,
                                        styles.actionButtonBase,
                                        {
                                            backgroundColor: pressed ? (isEditMode ? 'rgba(47, 107, 79, 0.15)' : '#E5E5E5') : (isEditMode ? 'rgba(47, 107, 79, 0.08)' : '#F5F5F5'),
                                        },
                                    ]}
                                >
                                    <Animated.View style={{
                                        opacity: editModeAnim.interpolate({
                                            inputRange: [0, 0.4, 0.6, 1],
                                            outputRange: [0, 0, 0, 1] // Late fade in for text
                                        }),
                                        position: isEditMode ? 'relative' : 'absolute',
                                        transform: [{ scale: editModeAnim }]
                                    }}>
                                        {isEditMode && <Text style={styles.editButtonText}>Done</Text>}
                                    </Animated.View>

                                    <Animated.View style={{
                                        opacity: editModeAnim.interpolate({
                                            inputRange: [0, 0.4, 0.6, 1],
                                            outputRange: [1, 0, 0, 0] // Early fade out for icon
                                        }),
                                        position: !isEditMode ? 'relative' : 'absolute',
                                        transform: [{
                                            scale: editModeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 0.5]
                                            })
                                        }]
                                    }}>
                                        {!isEditMode && <Ionicons name="close" size={20} color="#666" />}
                                    </Animated.View>
                                </Pressable>
                            </Animated.View>
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
                            {displayData.map((item, index) => (
                                <ForbiddenListItem
                                    key={item.id}
                                    item={item}
                                    isEditMode={isEditMode}
                                    isSelected={item.isSelected}
                                    phaseOffset={phaseOffsets[index % phaseOffsets.length]}
                                    sparkleAnim={sparkleAnim}
                                    activeTab={activeTab}
                                    isAdding={isAdding}
                                    customText={customText}
                                    setCustomText={setCustomText}
                                    onToggle={toggleItem}
                                    onDelete={handleDeleteCustom}
                                    onAdd={handleAddCustom}
                                    onCanceladd={handleCancelCustom}
                                    onEnterEditMode={enterEditMode}
                                    onStartAdding={() => setIsAdding(true)}
                                />
                            ))}
                        </Animated.ScrollView>
                    ) : null}

                </Animated.View>
            </Animated.View>
        </View>
    );
}



