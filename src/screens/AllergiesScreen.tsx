import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { View, Text, ScrollView, Pressable, Animated, SafeAreaView, Image, TextInput, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { styles } from '../styles/allergiesScreen.styles';
import { saveOnboardingData } from '../lib/storage';

import { ALLERGY_OPTIONS } from '../data/onboardingOptions';

type Props = {
    onContinue: (allergies: string[]) => void;
    onBack: () => void;
    onSkip: () => void;
    initialAllergies?: string[];
    onSelectionChange?: (selected: string[]) => void;
};

const AllergyChip = memo(({ option, isSelected, onToggle }: {
    option: typeof ALLERGY_OPTIONS[0],
    isSelected: boolean,
    onToggle: () => void
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.96,
                duration: 100,
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
            <Animated.View style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected,
                { transform: [{ scale: scaleAnim }] }
            ]}>
                {option.image ? (
                    <Image
                        source={isSelected && option.selectedImage ? option.selectedImage : option.image}
                        style={[{ width: 20, height: 20 }, isSelected ? {} : { tintColor: '#353740' }]}
                        resizeMode="contain"
                    />
                ) : (
                    <Ionicons
                        name={isSelected ? (option.icon.replace('-outline', '') as any) : option.icon}
                        size={20}
                        color={isSelected ? '#2F6B4F' : '#353740'}
                    />
                )}
                <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                ]}>
                    {option.label}
                </Text>
            </Animated.View>
        </Pressable>
    );
});

export function AllergiesScreen({ onContinue, onBack, onSkip, initialAllergies = [], onSelectionChange }: Props) {
    // Seed from initialAllergies so back-navigation and app-restart restore selections
    const [selectedAllergies, setSelectedAllergies] = useState<string[]>(initialAllergies);
    const [customAllergy, setCustomAllergy] = useState('');
    const [placeholderText, setPlaceholderText] = useState('');

    // Notify parent + persist to AsyncStorage on every selection change.
    // isFirstRender guard prevents overwriting storage/state with [] on mount.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        saveOnboardingData({ allergies: selectedAllergies });
        onSelectionChange?.(selectedAllergies);
    }, [selectedAllergies]);
    const [isFocused, setIsFocused] = useState(false);
    const placeholderOpacity = useRef(new Animated.Value(1)).current;
    const backScale = useRef(new Animated.Value(1)).current;
    const nextScale = useRef(new Animated.Value(1)).current;
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use Set for O(1) lookup instead of O(n) array.includes()
    const selectedSet = useMemo(() => new Set(selectedAllergies), [selectedAllergies]);

    const PLACEHOLDERS = ['e.g. Sesame', 'e.g. Corn', 'e.g. Mustard'];

    useEffect(() => {
        let currentPlaceholderIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        let loopNum = 0;

        const type = () => {
            if (isFocused || customAllergy.length > 0) {
                setPlaceholderText('');
                return;
            }

            const i = loopNum % PLACEHOLDERS.length;
            const fullText = PLACEHOLDERS[i];

            if (isDeleting) {
                setPlaceholderText(fullText.substring(0, currentCharIndex - 1));
                currentCharIndex--;
            } else {
                setPlaceholderText(fullText.substring(0, currentCharIndex + 1));
                currentCharIndex++;
            }

            let typeSpeed = isDeleting ? 40 : 80;

            if (!isDeleting && currentCharIndex === fullText.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && currentCharIndex === 0) {
                isDeleting = false;
                loopNum++;
                typeSpeed = 500;
            }

            typingTimeoutRef.current = setTimeout(type, typeSpeed);
        };

        type();

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [isFocused, customAllergy]);

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

    const toggleAllergy = useCallback((id: string) => {
        setSelectedAllergies(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    }, []);

    const handleNext = () => {
        onContinue(selectedAllergies);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.main}>
                    <View style={styles.header}>
                        <ProgressIndicator currentStep={2} totalSteps={4} />
                        <View style={styles.avatarContainer}>
                            <ExpoImage
                                source={require('../../images/allergy.png')}
                                style={styles.avatarImage}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                                transition={0}
                            />
                        </View>
                        <Text style={styles.title}>Any allergies?</Text>
                        <Text style={styles.subtitle}>
                            We'll filter recipes to ensure they're safe for you.
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.optionsContainer}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                    >
                        <View style={styles.optionsGrid}>
                            {ALLERGY_OPTIONS.map((option) => (
                                <AllergyChip
                                    key={option.id}
                                    option={option}
                                    isSelected={selectedSet.has(option.id)}
                                    onToggle={() => toggleAllergy(option.id)}
                                />
                            ))}
                        </View>

                        <View style={styles.customInputContainer}>
                            <Text style={styles.customInputLabel}>Anything else? (optional)</Text>
                            <View style={styles.customInputRow}>
                                <TextInput
                                    style={styles.customInput}
                                    value={customAllergy}
                                    onChangeText={setCustomAllergy}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
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

                        <View style={styles.disclaimerContainer}>
                            <Ionicons name="bulb-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.disclaimer}>
                                Nouri provides guidance based on ingredients, but please always verify labels for severe allergies.
                            </Text>
                        </View>
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
                                    style={styles.continueButton}
                                    onPress={handleNext}
                                    onPressIn={() => handlePressIn(nextScale)}
                                    onPressOut={() => handlePressOut(nextScale)}
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
