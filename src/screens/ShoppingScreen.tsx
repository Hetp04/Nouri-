import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { View, Text, ScrollView, Pressable, Animated, SafeAreaView, Image, TextInput } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { styles } from '../styles/ShoppingStyles';
import { saveOnboardingData } from '../lib/storage';

import { SHOPPING_OPTIONS } from '../data/onboardingOptions';

type Props = {
    onContinue: (shopping: string[]) => void;
    onBack: () => void;
    initialShopping?: string[];
    onSelectionChange?: (selected: string[]) => void;
};

const ShoppingChip = memo(({ option, isSelected, onToggle }: {
    option: typeof SHOPPING_OPTIONS[0],
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
                <Ionicons
                    name={isSelected ? (option.icon.replace('-outline', '') as any) : option.icon}
                    size={20}
                    color={isSelected ? '#2F6B4F' : '#353740'}
                />
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

export function ShoppingScreen({ onContinue, onBack, initialShopping = [], onSelectionChange }: Props) {
    const [selectedShopping, setSelectedShopping] = useState<string[]>(initialShopping);
    const [customShopping, setCustomShopping] = useState('');
    const [placeholderText, setPlaceholderText] = useState('');

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        saveOnboardingData({ shopping: selectedShopping });
        onSelectionChange?.(selectedShopping);
    }, [selectedShopping]);

    const [isFocused, setIsFocused] = useState(false);
    const placeholderOpacity = useRef(new Animated.Value(1)).current;
    const backScale = useRef(new Animated.Value(1)).current;
    const nextScale = useRef(new Animated.Value(1)).current;
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const selectedSet = useMemo(() => new Set(selectedShopping), [selectedShopping]);

    const PLACEHOLDERS = ['e.g. Kosher options', 'e.g. Halal items', 'e.g. Meal prep kits'];

    useEffect(() => {
        let currentPlaceholderIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        let loopNum = 0;

        const type = () => {
            if (isFocused || customShopping.length > 0) {
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
    }, [isFocused, customShopping]);

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

    const toggleShopping = useCallback((id: string) => {
        setSelectedShopping(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    }, []);

    const handleNext = () => {
        // Here we could technically merge customShopping into string array if needed, 
        // similar logic could be done across the app, but for now we follow the existing pattern.
        onContinue(selectedShopping);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.main}>
                    <View style={styles.header}>
                        <ProgressIndicator currentStep={3} totalSteps={5} />
                        <View style={styles.avatarContainer}>
                            <ExpoImage
                                source={require('../../images/cart.png')}
                                style={styles.avatarImage}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                                transition={0}
                            />
                        </View>
                        <Text style={styles.title}>What do you shop for the most?</Text>
                        <Text style={styles.subtitle}>
                            Select the categories you buy most often.
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.optionsContainer}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                    >
                        <View style={styles.optionsGrid}>
                            {SHOPPING_OPTIONS.map((option) => (
                                <ShoppingChip
                                    key={option.id}
                                    option={option}
                                    isSelected={selectedSet.has(option.id)}
                                    onToggle={() => toggleShopping(option.id)}
                                />
                            ))}
                        </View>

                        <View style={styles.customInputContainer}>
                            <Text style={styles.customInputLabel}>Anything else? (optional)</Text>
                            <View style={styles.customInputRow}>
                                <TextInput
                                    style={styles.customInput}
                                    value={customShopping}
                                    onChangeText={setCustomShopping}
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
