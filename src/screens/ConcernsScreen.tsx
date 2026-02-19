import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    Pressable,
    TextInput,
    ScrollView,
    Animated,
    Easing,
    Image,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { styles } from '../styles/concernsScreen.styles';
import { saveOnboardingData } from '../lib/storage';

import { CONCERN_OPTIONS } from '../data/onboardingOptions';

type Props = {
    onContinue?: (selected: string[]) => void;
    onBack?: () => void;
    initialConcerns?: string[];
    onSelectionChange?: (selected: string[]) => void;
};

const ConcernChip = memo(({
    option,
    isSelected,
    onToggle,
}: {
    option: any;
    isSelected: boolean;
    onToggle: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.96,
                duration: 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isSelected]);

    return (
        <Pressable
            onPress={onToggle}
            onPressIn={() => Haptics.selectionAsync()}
        >
            <Animated.View
                style={[
                    styles.optionChip,
                    isSelected && styles.optionChipSelected,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Ionicons
                    name={isSelected ? (option.icon.replace('-outline', '') as any) : option.icon}
                    size={20}
                    color={isSelected ? '#2F6B4F' : '#6E6E80'}
                />
                <Text
                    style={[styles.optionText, isSelected && styles.optionTextSelected]}
                >
                    {option.label}
                </Text>
            </Animated.View>
        </Pressable>
    );
});

export function ConcernsScreen({ onContinue, onBack, initialConcerns = [], onSelectionChange }: Props) {
    // Seed from initialConcerns so back-navigation and app-restart restore selections
    const [selectedOptions, setSelectedOptions] = useState<string[]>(initialConcerns);
    const [otherConcern, setOtherConcern] = useState('');
    const [placeholderText, setPlaceholderText] = useState('');

    // Derive any custom options that were previously saved (not in the preset list)
    const knownIds = new Set(CONCERN_OPTIONS.map(o => o.id));
    const [customOptions, setCustomOptions] = useState<string[]>(
        initialConcerns.filter(c => !knownIds.has(c))
    );

    // Notify parent + persist to AsyncStorage on every selection change.
    // isFirstRender guard prevents overwriting storage/state with [] on mount.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        saveOnboardingData({ concerns: selectedOptions });
        onSelectionChange?.(selectedOptions);
    }, [selectedOptions]);
    const [isFocused, setIsFocused] = useState(false);
    const placeholderOpacity = useRef(new Animated.Value(1)).current;
    const backScale = useRef(new Animated.Value(1)).current;
    const nextScale = useRef(new Animated.Value(1)).current;
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const PLACEHOLDERS = ['e.g. Kosher', 'e.g. Halal', 'e.g. No Preservatives'];
    const TYPING_SPEED = 80;
    const DELETING_SPEED = 30;
    const PAUSE_DURATION = 2000;

    useEffect(() => {
        Animated.timing(placeholderOpacity, {
            toValue: isFocused || otherConcern ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isFocused, otherConcern]);

    useEffect(() => {
        if (isFocused || otherConcern) {
            return;
        }

        // Reset to ensure clean start
        setPlaceholderText('');

        let currentText = '';
        let isDeleting = false;
        let loopNum = 0;

        const type = () => {
            const i = loopNum % PLACEHOLDERS.length;
            const fullText = PLACEHOLDERS[i];

            if (isDeleting) {
                currentText = fullText.substring(0, currentText.length - 1);
            } else {
                currentText = fullText.substring(0, currentText.length + 1);
            }

            setPlaceholderText(currentText);

            let typeSpeed = TYPING_SPEED;

            if (isDeleting) {
                typeSpeed = DELETING_SPEED;
            }

            if (!isDeleting && currentText === fullText) {
                typeSpeed = PAUSE_DURATION;
                isDeleting = true;
            } else if (isDeleting && currentText === '') {
                isDeleting = false;
                loopNum++;
                typeSpeed = 500;
            }

            typingTimeoutRef.current = setTimeout(type, typeSpeed);
        };

        // Small initial delay to allow opacity to start fading in first?
        // Or start immediately. Immediate feels snappier.
        type();

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [isFocused, otherConcern]);

    const handlePressIn = (scale: Animated.Value) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 20,
            bounciness: 0,
        }).start();
    };

    const handlePressOut = (scale: Animated.Value) => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    // customOptions already initialised above from initialConcerns

    // Use Set for O(1) lookup instead of O(n) array.includes()
    const selectedSet = useMemo(() => new Set(selectedOptions), [selectedOptions]);

    const toggleOption = useCallback((id: string) => {
        setSelectedOptions((prev) =>
            prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
        );
    }, []);

    const addCustomOption = () => {
        const trimmed = otherConcern.trim();
        if (
            trimmed &&
            !customOptions.includes(trimmed)
        ) {
            setCustomOptions((prev) => [...prev, trimmed]);
            setSelectedOptions((prev) => [...prev, trimmed]);
            setOtherConcern('');
        }
    };

    const removeCustomOption = (option: string) => {
        setCustomOptions((prev) => prev.filter((o) => o !== option));
        setSelectedOptions((prev) => prev.filter((o) => o !== option));
    };

    const hasSelection = selectedOptions.length > 0;

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.main}>
                    <View style={styles.header}>
                        <ProgressIndicator currentStep={1} totalSteps={4} />
                        <View style={styles.avatarContainer}>
                            <ExpoImage
                                source={require('../../images/help.png')}
                                style={styles.avatarImage}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                                transition={0}
                            />
                        </View>
                        <Text style={styles.title}>What do you care about?</Text>
                        <Text style={styles.subtitle}>
                            Select the topics that matter most to you
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.optionsContainer}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                    >
                        <View style={styles.optionsGrid}>
                            {CONCERN_OPTIONS.map((option) => (
                                <ConcernChip
                                    key={option.id}
                                    option={option}
                                    isSelected={selectedSet.has(option.id)}
                                    onToggle={() => toggleOption(option.id)}
                                />
                            ))}
                        </View>

                        <View style={styles.customInputContainer}>
                            <Text style={styles.customInputLabel}>Anything else? (optional)</Text>
                            <View>
                                <TextInput
                                    style={styles.customInput}
                                    value={otherConcern}
                                    onChangeText={setOtherConcern}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onSubmitEditing={addCustomOption}
                                    returnKeyType="done"
                                />
                                <Animated.Text
                                    style={[
                                        styles.customInputPlaceholder,
                                        { opacity: placeholderOpacity }
                                    ]}
                                    pointerEvents="none"
                                >
                                    {placeholderText}|
                                </Animated.Text>
                            </View>
                        </View>
                        {customOptions.length > 0 && (
                            <View style={styles.customChipsContainer}>
                                {customOptions.map((option) => (
                                    <View key={option} style={styles.customChip}>
                                        <Text style={styles.customChipText}>{option}</Text>
                                        <Pressable
                                            style={styles.removeButton}
                                            onPress={() => removeCustomOption(option)}
                                        >
                                            <Ionicons name="close" size={14} color="#FFFFFF" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <View style={styles.footerButtons}>
                            <Animated.View style={{ transform: [{ scale: backScale }] }}>
                                <Pressable
                                    style={styles.backButton}
                                    onPress={onBack}
                                    onPressIn={() => handlePressIn(backScale)}
                                    onPressOut={() => handlePressOut(backScale)}
                                >
                                    <Ionicons name="chevron-back" size={24} color="#111111" />
                                </Pressable>
                            </Animated.View>
                            <Animated.View style={[{ flex: 1 }, { transform: [{ scale: nextScale }] }]}>
                                <Pressable
                                    style={[
                                        styles.continueButton,
                                        !hasSelection && styles.continueButtonDisabled,
                                    ]}
                                    onPress={() => hasSelection && onContinue?.(selectedOptions)}
                                    onPressIn={() => hasSelection && handlePressIn(nextScale)}
                                    onPressOut={() => handlePressOut(nextScale)}
                                    disabled={!hasSelection}
                                >
                                    <Text style={styles.continueButtonText}>Next</Text>
                                </Pressable>
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
