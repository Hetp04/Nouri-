import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Switch, ActivityIndicator, Dimensions, StyleSheet, Platform, TextInput, Easing, Keyboard, Image, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../styles/settingsScreen.styles';
import { styles as forbiddenStyles } from '../styles/forbiddenListModal.styles';
import { signOut } from '../lib/auth';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import { CONCERN_OPTIONS, ALLERGY_OPTIONS } from '../data/onboardingOptions';
import { WigglePill } from '../components/WigglePill';
import { freepikService } from '../services/freepikService';
import { Image as ExpoImage } from 'expo-image';
import { IngredientWatchlist } from '../components/IngredientWatchlist';
import { AlphabetIndex } from '../components/AlphabetIndex';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SAMPLE_INGREDIENTS = [
    { id: '1', name: 'Acetic Acid', scans: 8, category: 'Food', risk: 'SAFE', riskColor: '#059669', icon: 'fast-food-outline' as const },
    { id: '2', name: 'Allura Red', scans: 6, category: 'Cosmetic', risk: 'AVOID', riskColor: '#DC2626', icon: 'sparkles-outline' as const },
    { id: '3', name: 'BHT', scans: 2, category: 'Household', risk: 'LIMIT', riskColor: '#D97706', icon: 'home-outline' as const },
];

const LIST_DATA: any[] = [];
SAMPLE_INGREDIENTS.forEach(item => {
    LIST_DATA.push({ ...item, type: 'item' });
});

const AnimatedSvgGradient = Animated.createAnimatedComponent(SvgGradient);

interface Props {
    visible: boolean;
    onClose: () => void;
    email: string;
    onSignOut: () => void;
    onOpenDietaryProfile: () => void;
    onUpdateProfile?: () => void;
}

export function SettingsScreen({ visible, onClose, email, onSignOut, onOpenDietaryProfile, onUpdateProfile }: Props) {
    const [aiIconEnabled, setAiIconEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [name, setName] = useState('');
    const [watchlistSearch, setWatchlistSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState<'ALL' | 'SAFE' | 'LIMIT' | 'AVOID'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Food' | 'Cosmetic' | 'Household'>('ALL');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const anim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    const watchlistRef = useRef<FlatList>(null);

    const scrollToLetter = useCallback((letter: string) => {
        if (!watchlistRef.current) return;
        const index = LIST_DATA.findIndex(i => i.type === 'item' && i.name?.[0]?.toUpperCase() >= letter);
        if (index >= 0) {
            watchlistRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
        } else {
            watchlistRef.current.scrollToEnd({ animated: true });
        }
    }, []);

    // ── Navigation States ──
    const [currentView, setCurrentView] = useState<string>('main');
    const [lastSubView, setLastSubView] = useState<string>('dietary');
    const navigationAnim = useRef(new Animated.Value(0)).current; // 0 = main, 1 = dietary/watchlist

    // ── Dietary Profile States ──
    const [activeTab, setActiveTab] = useState<'concerns' | 'allergies'>('concerns');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selections, setSelections] = useState<{ concerns: string[]; allergies: string[] }>({
        concerns: [],
        allergies: []
    });
    const [allCustomItems, setAllCustomItems] = useState<{ concerns: string[]; allergies: string[] }>({
        concerns: [],
        allergies: []
    });
    const [customIcons, setCustomIcons] = useState<Record<string, { url: string; status: 'generating' | 'completed' | 'failed' }>>({});
    const generationTasks = useRef<Set<string>>(new Set());
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const [isAdding, setIsAdding] = useState(false);
    const [customText, setCustomText] = useState('');
    const editModeAnim = useRef(new Animated.Value(0)).current;
    const tabAnim = useRef(new Animated.Value(0)).current;

    const startShimmer = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.delay(1000),
            ])
        ).start();
    };

    useEffect(() => {
        if (visible) {
            fetchSettings();
            startShimmer();
            Animated.spring(anim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 10,
                tension: 65,
            }).start();
        } else {
            Animated.spring(anim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 10,
                tension: 65,
            }).start(({ finished }) => {
                if (finished) {
                    // Reset all states back to default quietly while hidden
                    setCurrentView('main');
                    setLastSubView('dietary');
                    navigationAnim.setValue(0);
                    setIsEditMode(false);
                    setIsAdding(false);
                    setCustomText('');
                    setActiveTab('concerns');
                }
            });
        }
    }, [visible]);

    const fetchSettings = async () => {
        if (!visible) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Get name from metadata
                if (user.user_metadata?.full_name) {
                    setName(user.user_metadata.full_name);
                }

                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('ai_icon_enabled, concerns, allergies, custom_icons_map')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    setAiIconEnabled(data.ai_icon_enabled ?? true);
                    const freshConcerns = data.concerns || [];
                    const freshAllergies = data.allergies || [];
                    setSelections({ concerns: freshConcerns, allergies: freshAllergies });

                    setAllCustomItems({
                        concerns: freshConcerns.filter((id: string) => !CONCERN_OPTIONS.some(o => o.id === id)),
                        allergies: freshAllergies.filter((id: string) => !ALLERGY_OPTIONS.some(o => o.id === id))
                    });

                    if (data.custom_icons_map) setCustomIcons(data.custom_icons_map as any);
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAiIcon = async (value: boolean) => {
        setAiIconEnabled(value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_profiles').upsert({
                    user_id: user.id,
                    ai_icon_enabled: value,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            // Revert on error
            setAiIconEnabled(!value);
        }
    };

    const handleSignOut = async () => {
        const result = await signOut();
        if (result.success) {
            onSignOut();
        }
    };

    const navigateToSubView = (viewId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLastSubView(viewId);
        setCurrentView(viewId);
        Animated.spring(navigationAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 12,
            tension: 50,
        }).start();
    };

    const navigateToMain = () => {
        if (isEditMode) {
            handleDone();
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(navigationAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 12,
            tension: 50,
        }).start(({ finished }) => {
            if (finished) {
                setCurrentView('main');
            }
        });
    };

    const handleBack = () => {
        if (currentView !== 'main') {
            navigateToMain();
        } else {
            onClose();
        }
    };

    // ── Dietary Profile Logic ──
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

    useEffect(() => {
        Animated.timing(editModeAnim, {
            toValue: isEditMode ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [isEditMode]);

    const handleTabChange = (tab: 'concerns' | 'allergies') => {
        if (tab === activeTab) return;
        Haptics.selectionAsync();
        setActiveTab(tab);
        // Reset adding state if they switch tabs mid-type
        setIsAdding(false);
        setCustomText('');

        Animated.spring(tabAnim, {
            toValue: tab === 'concerns' ? 0 : 1,
            useNativeDriver: true,
            friction: 8,
            tension: 55,
        }).start();
    };

    const toggleItem = useCallback((id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelections(prev => {
            const currentList = prev[activeTab];
            const newList = currentList.includes(id)
                ? currentList.filter(i => i !== id)
                : [...currentList, id];
            return { ...prev, [activeTab]: newList };
        });
    }, [activeTab]);

    const handleDeleteCustom = useCallback((id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setSelections(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(i => i !== id) }));
        setAllCustomItems(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(i => i !== id) }));
        setCustomIcons(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    }, [activeTab]);

    const handleAddCustom = useCallback(() => {
        const trimmed = customText.trim();
        if (trimmed && trimmed.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSelections(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].includes(trimmed) ? prev[activeTab] : [...prev[activeTab], trimmed]
            }));
            setAllCustomItems(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].includes(trimmed) ? prev[activeTab] : [...prev[activeTab], trimmed]
            }));

            if (!customIcons[trimmed] && !generationTasks.current.has(trimmed)) {
                if (!aiIconEnabled) {
                    setCustomIcons(prev => ({ ...prev, [trimmed]: { url: '', status: 'failed' } }));
                } else {
                    generationTasks.current.add(trimmed);
                    setCustomIcons(prev => ({ ...prev, [trimmed]: { url: '', status: 'generating' } }));
                    (async () => {
                        try {
                            const taskId = await freepikService.generateIcon(trimmed, 'solid');
                            if (taskId) {
                                const url = await freepikService.waitForIcon(taskId);
                                const nextStatus = url ? 'completed' : 'failed';
                                const nextUrl = url ?? '';
                                setCustomIcons(prev => {
                                    const updated = { ...prev, [trimmed]: { url: nextUrl, status: nextStatus as any } };
                                    if (url) {
                                        supabase.auth.getUser().then(({ data: { user } }) => {
                                            if (user) {
                                                supabase.from('user_profiles').upsert({
                                                    user_id: user.id,
                                                    custom_icons_map: updated,
                                                    updated_at: new Date().toISOString(),
                                                }, { onConflict: 'user_id' });
                                            }
                                        });
                                    }
                                    return updated;
                                });
                            }
                        } catch (err) {
                            setCustomIcons(prev => ({ ...prev, [trimmed]: { url: '', status: 'failed' } }));
                        } finally {
                            generationTasks.current.delete(trimmed);
                        }
                    })();
                }
            }
        }
        setCustomText('');
        setIsAdding(false);
    }, [customText, activeTab, customIcons, aiIconEnabled]);

    const handleDone = useCallback(async () => {
        const finalSelections = { ...selections };
        if (isAdding && customText.trim()) {
            const trimmed = customText.trim();
            if (!finalSelections[activeTab].includes(trimmed)) {
                finalSelections[activeTab] = [...finalSelections[activeTab], trimmed];
            }
        }
        setSelections(finalSelections);
        setIsAdding(false);
        setCustomText('');
        setIsEditMode(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('user_profiles').upsert({
                    user_id: user.id,
                    concerns: finalSelections.concerns,
                    allergies: finalSelections.allergies,
                    custom_icons_map: customIcons,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

                if (onUpdateProfile) {
                    onUpdateProfile();
                }
            }
        } catch (e) {
            console.error('Failed to save profile update:', e);
        }
    }, [selections, isAdding, customText, activeTab, customIcons, onUpdateProfile]);

    const displayData = useMemo(() => {
        const optionsCore = activeTab === 'concerns' ? CONCERN_OPTIONS : ALLERGY_OPTIONS;
        const currentSelection = selections[activeTab];

        if (isEditMode) {
            const allCustom = allCustomItems[activeTab];
            const customItems = allCustom.map(id => {
                const customIcon = customIcons[id];
                return {
                    id, label: id,
                    icon: customIcon?.status === 'completed' ? customIcon.url : (customIcon?.status === 'generating' ? 'sparkles-outline' : 'nutrition-outline'),
                    type: 'custom' as const, isSelected: currentSelection.includes(id),
                };
            });
            const addButton = { id: '__ADD_BUTTON__', label: 'Add Custom', icon: 'add-outline' as any, type: 'action' as const, isSelected: false };
            if (isAdding) return [...customItems, addButton];
            const coreItems = optionsCore.map(opt => ({ ...opt, type: 'known' as const, isSelected: currentSelection.includes(opt.id) }));
            return [...coreItems, ...customItems, addButton];
        }

        return currentSelection.map(id => {
            const known = optionsCore.find(opt => opt.id === id);
            if (known) return { ...known, type: 'known' as const, isSelected: true };
            const customIcon = customIcons[id];
            return {
                id, label: id,
                icon: customIcon?.status === 'completed' ? customIcon.url : (customIcon?.status === 'generating' ? 'sparkles-outline' : 'nutrition-outline'),
                type: 'custom' as const, isSelected: true
            };
        });
    }, [activeTab, selections, isEditMode, isAdding, allCustomItems, customIcons]);

    // ── Global Subscreens Map ──
    const SCREENS: Record<string, { title: string, rightAction?: React.ReactNode, render: () => React.ReactNode }> = {
        'dietary': {
            title: 'Dietary Profile',
            rightAction: (
                <Pressable
                    style={[forbiddenStyles.actionButtonBase, isEditMode ? forbiddenStyles.editButton : forbiddenStyles.closeButton, { width: isEditMode ? 72 : 32, backgroundColor: isEditMode ? 'rgba(47, 107, 79, 0.08)' : '#F5F5F5' }]}
                    onPress={isEditMode ? handleDone : () => setIsEditMode(true)}
                >
                    {isEditMode ? (
                        <Text style={forbiddenStyles.editButtonText}>Done</Text>
                    ) : (
                        <Ionicons name="create-outline" size={20} color="#666" />
                    )}
                </Pressable>
            ),
            render: () => (
                <>
                    <View style={forbiddenStyles.toggleWrapper}>
                        <View style={forbiddenStyles.toggleContainer}>
                            <Animated.View style={[forbiddenStyles.toggleSlider, {
                                transform: [{
                                    translateX: tabAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, (SCREEN_WIDTH - 48 - 8) / 2]
                                    })
                                }]
                            }]} />
                            <Pressable style={forbiddenStyles.toggleButton} onPress={() => handleTabChange('concerns')}>
                                <Text style={[forbiddenStyles.toggleText, activeTab === 'concerns' && forbiddenStyles.toggleTextActive]}>Concerns</Text>
                            </Pressable>
                            <Pressable style={forbiddenStyles.toggleButton} onPress={() => handleTabChange('allergies')}>
                                <Text style={[forbiddenStyles.toggleText, activeTab === 'allergies' && forbiddenStyles.toggleTextActive]}>Allergies</Text>
                            </Pressable>
                        </View>
                        {!isEditMode && !isAdding && (
                            <Text style={{
                                textAlign: 'center',
                                fontSize: 12,
                                color: '#9CA3AF',
                                fontFamily: 'OpenSans_400Regular',
                                marginTop: 8,
                                opacity: 0.8
                            }}>
                                Hold any item to edit
                            </Text>
                        )}
                    </View>

                    <ScrollView style={forbiddenStyles.contentScrollView} showsVerticalScrollIndicator={false}>
                        <View style={forbiddenStyles.optionsGrid}>
                            {displayData.map((item, idx) => {
                                if (item.id === '__ADD_BUTTON__') {
                                    if (isAdding) {
                                        return (
                                            <View key="__add_input__" style={[forbiddenStyles.optionChip, forbiddenStyles.inputChipMorphed]}>
                                                <TextInput
                                                    style={[forbiddenStyles.optionText, forbiddenStyles.inputFieldMorphed]}
                                                    value={customText}
                                                    onChangeText={setCustomText}
                                                    placeholder={activeTab === 'concerns' ? 'Type concern…' : 'Type allergen…'}
                                                    placeholderTextColor="#9CA3AF"
                                                    returnKeyType="done"
                                                    onSubmitEditing={handleAddCustom}
                                                    autoFocus
                                                />
                                                <Pressable onPress={() => setIsAdding(false)} hitSlop={8}>
                                                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                                </Pressable>
                                            </View>
                                        );
                                    }
                                    return (
                                        <Pressable
                                            key="__add_btn__"
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setIsAdding(true);
                                            }}
                                            style={[forbiddenStyles.optionChip, forbiddenStyles.optionChipUnselected, forbiddenStyles.addCustomChip]}
                                        >
                                            <Ionicons name="add" size={16} color="#2F6B4F" />
                                            <Text style={[forbiddenStyles.optionText, { color: '#2F6B4F' }]}>Add Custom</Text>
                                        </Pressable>
                                    );
                                }

                                const isSelected = item.isSelected;
                                const chipStyle = [
                                    item.type === 'known' ? forbiddenStyles.optionChip : forbiddenStyles.customChip,
                                    !isSelected && forbiddenStyles.optionChipUnselected,
                                ];

                                return (
                                    <WigglePill
                                        key={`${item.id}-${isEditMode}`}
                                        isEditMode={isEditMode}
                                        isSelected={isSelected}
                                        phaseOffset={idx * 40}
                                        onPress={() => isEditMode ? toggleItem(item.id) : null}
                                        onLongPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setIsEditMode(true);
                                        }}
                                        chipStyle={chipStyle}
                                        onDelete={item.type === 'custom' ? () => handleDeleteCustom(item.id) : undefined}
                                    >
                                        {item.type === 'known' ? (
                                            <>
                                                {(item as any).image ? (
                                                    <Image
                                                        source={isSelected && (item as any).selectedImage ? (item as any).selectedImage : (item as any).image}
                                                        style={[forbiddenStyles.iconImage, !isSelected && { tintColor: '#9CA3AF' }]}
                                                        resizeMode="contain"
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name={isSelected ? (item as any).icon?.replace('-outline', '') as any : (item as any).icon as any}
                                                        size={18}
                                                        color={isSelected ? '#2F6B4F' : '#9CA3AF'}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <Animated.View style={[
                                                forbiddenStyles.customIconContainer,
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
                                                        style={[forbiddenStyles.customIconImage, isSelected ? forbiddenStyles.customIconActive : forbiddenStyles.customIconInactive]}
                                                        contentFit="contain"
                                                        tintColor={isSelected ? '#2F6B4F' : '#9CA3AF'}
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name={isSelected ? (item.icon as any)?.replace('-outline', '') : (item.icon as any) || 'help-circle-outline'}
                                                        size={18}
                                                        color={isSelected ? '#2F6B4F' : '#9CA3AF'}
                                                        style={isSelected ? forbiddenStyles.customIconActive : forbiddenStyles.customIconInactive}
                                                    />
                                                )}
                                            </Animated.View>
                                        )}
                                        <Text style={[item.type === 'known' ? forbiddenStyles.optionText : forbiddenStyles.customChipText, !isSelected && forbiddenStyles.optionTextUnselected]}>{item.label}</Text>
                                    </WigglePill>
                                );
                            })}
                        </View>
                    </ScrollView>
                </>
            )
        },
        'watchlist': {
            title: 'Ingredient Watchlist',
            render: () => {
                const filteredData = LIST_DATA.filter(item => {
                    if (item.type !== 'item') return false;
                    const matchesSearch = watchlistSearch.trim() === '' || item.name?.toLowerCase().includes(watchlistSearch.toLowerCase());
                    const matchesRisk = riskFilter === 'ALL' || item.risk === riskFilter;
                    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
                    return matchesSearch && matchesRisk && matchesCategory;
                });

                const categoryOptions = [
                    { value: 'ALL', label: 'All', icon: 'apps-outline' as const },
                    { value: 'Food', label: 'Food', icon: 'fast-food-outline' as const },
                    { value: 'Cosmetic', label: 'Cosmetic', icon: 'sparkles-outline' as const },
                    { value: 'Household', label: 'Household', icon: 'home-outline' as const },
                ];

                return (
                    <View style={{ flex: 1, paddingTop: 8 }}>
                        <IngredientWatchlist />
                        {/* Integrated Search & Filter Container */}
                        <View style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            marginHorizontal: 16,
                            marginTop: 12,
                            marginBottom: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 10,
                            overflow: 'visible',
                            zIndex: 100,
                        }}>
                            {/* Search Input Area */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 14,
                                paddingTop: 12,
                                paddingBottom: 16,
                                gap: 10,
                            }}>
                                <Ionicons name="search" size={18} color="#9CA3AF" />
                                <TextInput
                                    style={{ flex: 1, fontSize: 15, color: '#111111', fontWeight: '500' }}
                                    placeholder="Search ingredients..."
                                    placeholderTextColor="#9CA3AF"
                                    value={watchlistSearch}
                                    onChangeText={setWatchlistSearch}
                                />
                                {watchlistSearch.length > 0 && (
                                    <Pressable onPress={() => setWatchlistSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                    </Pressable>
                                )}
                            </View>

                            {/* Integrated Filters (Bottom Edge) */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 10,
                                paddingBottom: 12,
                                gap: 8
                            }}>
                                {/* Risk Filters */}
                                <View style={{ flexDirection: 'row', gap: 2, flex: 1 }}>
                                    {(['ALL', 'SAFE', 'LIMIT', 'AVOID'] as const).map((risk) => {
                                        const isActive = riskFilter === risk;
                                        return (
                                            <Pressable
                                                key={risk}
                                                onPress={() => setRiskFilter(risk)}
                                                style={{
                                                    paddingVertical: 4,
                                                    paddingHorizontal: 8,
                                                    borderRadius: 6,
                                                    backgroundColor: isActive ? 'rgba(47, 107, 79, 0.08)' : 'transparent',
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 12,
                                                    fontWeight: isActive ? '600' : '500',
                                                    color: isActive ? '#2F6B4F' : '#9CA3AF'
                                                }}>
                                                    {risk === 'ALL' ? 'All' : risk.charAt(0) + risk.slice(1).toLowerCase()}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                {/* Category Dropdown (Minimal Style) */}
                                <View style={{ position: 'relative' }}>
                                    <Pressable
                                        onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 4,
                                            paddingHorizontal: 8,
                                            borderRadius: 6,
                                            backgroundColor: categoryFilter === 'ALL' ? 'transparent' : 'rgba(47, 107, 79, 0.08)',
                                            gap: 4,
                                        }}
                                    >
                                        <Ionicons
                                            name={categoryOptions.find(c => c.value === categoryFilter)?.icon || 'apps-outline'}
                                            size={12}
                                            color={categoryFilter === 'ALL' ? '#9CA3AF' : '#2F6B4F'}
                                        />
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: categoryFilter === 'ALL' ? '500' : '600',
                                            color: categoryFilter === 'ALL' ? '#9CA3AF' : '#2F6B4F'
                                        }}>
                                            {categoryOptions.find(c => c.value === categoryFilter)?.label || 'All'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={10} color={categoryFilter === 'ALL' ? '#9CA3AF' : '#2F6B4F'} />
                                    </Pressable>
                                    {showCategoryDropdown && (
                                        <View style={{
                                            position: 'absolute',
                                            top: 28,
                                            right: 0,
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: 12,
                                            paddingVertical: 4,
                                            minWidth: 130,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 12,
                                            elevation: 5,
                                            zIndex: 100,
                                        }}>
                                            {categoryOptions.map((cat) => (
                                                <Pressable
                                                    key={cat.value}
                                                    onPress={() => {
                                                        setCategoryFilter(cat.value as 'ALL' | 'Food' | 'Cosmetic' | 'Household');
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingVertical: 8,
                                                        paddingHorizontal: 12,
                                                        gap: 8,
                                                        backgroundColor: categoryFilter === cat.value ? '#F3F4F6' : 'transparent',
                                                    }}
                                                >
                                                    <Ionicons name={cat.icon} size={16} color="#6B7280" />
                                                    <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500' }}>{cat.label}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                        <FlatList
                            ref={watchlistRef}
                            data={filteredData}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 16, gap: 16 }}
                            onScrollToIndexFailed={(info) => {
                                const wait = new Promise(resolve => setTimeout(resolve, 100));
                                wait.then(() => {
                                    watchlistRef.current?.scrollToIndex({ index: info.index, animated: false });
                                });
                            }}
                            renderItem={({ item }) => {
                                return (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingVertical: 16,
                                            paddingHorizontal: 16,
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: 16,
                                            marginRight: 48,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.04,
                                            shadowRadius: 8,
                                            elevation: 2,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: '#F3F4F6',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12
                                            }}>
                                                <Ionicons name={item.icon} size={16} color="#6B7280" />
                                            </View>
                                            <View style={{ flex: 1, marginRight: 12 }}>
                                                <Text style={{ fontSize: 15, color: '#111111', fontWeight: '600', marginBottom: 4 }}>{item.name}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '400' }}>{item.category}</Text>
                                                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB', marginHorizontal: 6 }} />
                                                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '400' }}>{item.scans} scans</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.riskColor, marginRight: 6 }} />
                                            <Text style={{ fontSize: 12, color: item.riskColor, fontWeight: '600' }}>{item.risk}</Text>
                                        </View>
                                    </View>
                                );
                            }}
                        />
                        <AlphabetIndex onLetterClick={scrollToLetter} />
                    </View >
                )
            }
        }
    };

    return (
        <View style={modalStyles.wrapper} pointerEvents={visible ? 'auto' : 'none'}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                <Animated.View style={[modalStyles.backdrop, { opacity: anim }]} />
            </Pressable>

            <Animated.View
                style={[
                    styles.container,
                    modalStyles.modalContainer,
                    {
                        transform: [{
                            translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [SCREEN_HEIGHT, 0],
                            }),
                        }],
                    },
                ]}
            >
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButton}
                        onPress={handleBack}
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    >
                        <Animated.View style={{
                            transform: [{
                                rotate: navigationAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '0deg'], // We use the icon swap for now but could rotate if needed
                                })
                            }]
                        }}>
                            <Ionicons name={currentView !== 'main' ? "chevron-back" : "chevron-down"} size={24} color="#111111" />
                        </Animated.View>
                    </Pressable>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        {/* Main Title */}
                        <Animated.Text style={[styles.title, {
                            position: 'absolute',
                            opacity: navigationAnim.interpolate({
                                inputRange: [0, 0.5],
                                outputRange: [1, 0],
                            }),
                            transform: [{
                                translateY: navigationAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -10],
                                })
                            }]
                        }]}>Settings</Animated.Text>

                        {/* Dietary/Watchlist Title */}
                        <Animated.Text style={[styles.title, {
                            opacity: navigationAnim.interpolate({
                                inputRange: [0.5, 1],
                                outputRange: [0, 1],
                            }),
                            transform: [{
                                translateY: navigationAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [10, 0],
                                })
                            }]
                        }]}>{SCREENS[lastSubView]?.title}</Animated.Text>
                    </View>

                    <Animated.View style={{
                        position: 'absolute',
                        right: 20,
                        opacity: navigationAnim.interpolate({
                            inputRange: [0.8, 1],
                            outputRange: [0, 1],
                        }),
                        transform: [{
                            scale: navigationAnim.interpolate({
                                inputRange: [0.8, 1],
                                outputRange: [0.8, 1],
                            })
                        }]
                    }}>
                        {SCREENS[lastSubView]?.rightAction}
                    </Animated.View>
                </View>

                <View style={{ flex: 1, overflow: 'hidden' }}>
                    {/* ── Main Settings View ── */}
                    <Animated.View style={{
                        flex: 1,
                        width: SCREEN_WIDTH,
                        transform: [{
                            translateX: navigationAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -SCREEN_WIDTH * 0.3], // iOS style partial slide out
                            })
                        }],
                        opacity: navigationAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0.5],
                        })
                    }}>
                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            <View style={styles.section}>
                                <View style={styles.settingsGroup}>
                                    <View style={[styles.settingsItem, { justifyContent: 'space-between' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 32 }}>
                                                <MaterialCommunityIcons name="account-outline" size={22} color="#111111" />
                                            </View>
                                            <Text style={styles.settingsItemText}>Name</Text>
                                        </View>
                                        <Text style={styles.settingsItemValue}>{name}</Text>
                                    </View>
                                    <View style={styles.separator} />
                                    <View style={[styles.settingsItem, { justifyContent: 'space-between' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 32 }}>
                                                <MaterialCommunityIcons name="email-outline" size={22} color="#111111" />
                                            </View>
                                            <Text style={styles.settingsItemText}>Email</Text>
                                        </View>
                                        <Text style={styles.settingsItemValue}>{email}</Text>
                                    </View>
                                    <View style={styles.separator} />
                                    <View style={[styles.settingsItem, { justifyContent: 'space-between' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 32 }}>
                                                <MaterialCommunityIcons name="plus-box-outline" size={22} color="#111111" />
                                            </View>
                                            <Text style={styles.settingsItemText}>Subscription</Text>
                                        </View>
                                        <View style={{ width: 80, height: 24, justifyContent: 'center' }}>
                                            <Svg height="24" width="80">
                                                <Defs>
                                                    <AnimatedSvgGradient
                                                        id="shimmer"
                                                        x1={shimmerAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: ['-100%', '150%'],
                                                        })}
                                                        y1="0%"
                                                        x2={shimmerAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: ['0%', '250%'],
                                                        })}
                                                        y2="0%"
                                                    >
                                                        <Stop offset="0%" stopColor="#6B7280" stopOpacity="1" />
                                                        <Stop offset="50%" stopColor="#111111" stopOpacity="1" />
                                                        <Stop offset="100%" stopColor="#6B7280" stopOpacity="1" />
                                                    </AnimatedSvgGradient>
                                                </Defs>
                                                <SvgText
                                                    fill="url(#shimmer)"
                                                    fontSize="16"
                                                    fontFamily="OpenSans_400Regular"
                                                    x="80"
                                                    y="18"
                                                    textAnchor="end"
                                                >
                                                    Free Trial
                                                </SvgText>
                                            </Svg>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Dietary Profile</Text>
                                <View style={styles.settingsGroup}>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.settingsItem,
                                            { justifyContent: 'space-between', backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF' }
                                        ]}
                                        onPress={() => navigateToSubView('dietary')}
                                    >
                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View style={{ width: 32, marginTop: 2 }}>
                                                <MaterialCommunityIcons name="shield-outline" size={22} color="#111111" />
                                            </View>
                                            <View style={{ flex: 1, marginRight: 16 }}>
                                                <Text style={styles.settingsItemText}>Concerns & Allergies</Text>
                                                <Text style={[styles.settingsItemValue, { fontSize: 13, marginTop: 4, lineHeight: 18 }]}>
                                                    Manage your dietary restrictions and health concerns
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#6B7280" style={{ marginTop: 2 }} />
                                    </Pressable>
                                    <View style={styles.separator} />
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.settingsItem,
                                            { justifyContent: 'space-between', backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF' }
                                        ]}
                                        onPress={() => navigateToSubView('watchlist')}
                                    >
                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View style={{ width: 32, marginTop: 2 }}>
                                                <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#111111" />
                                            </View>
                                            <View style={{ flex: 1, marginRight: 16 }}>
                                                <Text style={styles.settingsItemText}>Ingredient Watchlist</Text>
                                                <Text style={[styles.settingsItemValue, { fontSize: 13, marginTop: 4, lineHeight: 18 }]}>
                                                    View ingredients you've flagged from product scans
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#6B7280" style={{ marginTop: 2 }} />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Personalization</Text>
                                <View style={styles.settingsGroup}>
                                    <View style={[styles.settingsItem, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View style={{ width: 32, marginTop: 2 }}>
                                                <MaterialCommunityIcons name="star-four-points-outline" size={20} color="#111111" />
                                            </View>
                                            <View style={{ flex: 1, marginRight: 16 }}>
                                                <Text style={styles.settingsItemText}>AI Icon Generation</Text>
                                                <Text style={[styles.settingsItemValue, { fontSize: 13, marginTop: 4, lineHeight: 18 }]}>
                                                    Generate custom icons using AI for your allergies & concerns
                                                </Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={aiIconEnabled}
                                            onValueChange={toggleAiIcon}
                                            trackColor={{ false: '#E5E7EB', true: '#2F6B4F' }}
                                            thumbColor="#fff"
                                            ios_backgroundColor="#E5E7EB"
                                            disabled={isLoading}
                                            style={{ transform: [{ scale: 0.8 }], marginTop: -4 }}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Support</Text>
                                <View style={styles.settingsGroup}>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.settingsItem,
                                            { justifyContent: 'space-between', backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF' }
                                        ]}
                                        onPress={() => {/* TODO: Handle feedback */ }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 32 }}>
                                                <MaterialCommunityIcons name="message-outline" size={22} color="#111111" />
                                            </View>
                                            <Text style={styles.settingsItemText}>Feedback</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                                    </Pressable>
                                    <View style={styles.separator} />
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.settingsItem,
                                            { justifyContent: 'space-between', backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF' }
                                        ]}
                                        onPress={() => {/* TODO: Handle about */ }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 32 }}>
                                                <MaterialCommunityIcons name="information-outline" size={22} color="#111111" />
                                            </View>
                                            <Text style={styles.settingsItemText}>About the App</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.signOutButton,
                                        pressed && { opacity: 0.7 }
                                    ]}
                                    onPress={handleSignOut}
                                    onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                                >
                                    <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                                    <Text style={styles.signOutText}>Sign Out</Text>
                                </Pressable>
                            </View>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </Animated.View>

                    {/* ── Dietary Profile / Sub Views ── */}
                    <Animated.View style={{
                        ...StyleSheet.absoluteFillObject,
                        width: SCREEN_WIDTH,
                        backgroundColor: '#F9FAFB',
                        transform: [{
                            translateX: navigationAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [SCREEN_WIDTH, 0], // Slide in fully
                            })
                        }],
                        zIndex: 10,
                    }}>
                        {SCREENS[lastSubView]?.render()}
                    </Animated.View>
                </View>
            </Animated.View>
        </View>
    );
}

const modalStyles = StyleSheet.create({
    wrapper: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.94,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
});
