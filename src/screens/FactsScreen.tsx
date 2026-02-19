import React, { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { View, Text, Pressable, Animated, SafeAreaView, ScrollView, Image } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { styles } from '../styles/factsScreen.styles';
import * as Haptics from 'expo-haptics';

export type FoodFactType = 'sugar' | 'natural' | 'labels' | 'dye';

export interface FoodFact {
    id: string;
    type: FoodFactType;
    title: string;
    content: string;
    icon: string;
}

const FOOD_FACTS: FoodFact[] = [
    {
        id: 'sugar_60_names',
        type: 'sugar',
        title: 'Sugar has 60+ names',
        content: 'Ingredients like dextrose and maltose are hidden sugars causing glucose spikes.',
        icon: 'candy-outline'
    },
    {
        id: 'natural_vague',
        type: 'natural',
        title: '"Natural" is vague',
        content: '"Natural flavors" can contain 100+ synthetic chemicals and compounds.',
        icon: 'flask-outline'
    },
    {
        id: 'labels_mislead',
        type: 'labels',
        title: 'Labels can mislead',
        content: '"Low fat" often means added sugar to replace the lost flavor.',
        icon: 'pricetag-outline'
    },
    {
        id: 'red_dye_40',
        type: 'dye',
        title: 'Red Dye #40',
        content: 'Made from petroleum and banned in parts of Europe with other colors.',
        icon: 'color-palette-outline'
    }
];

type Props = {
    onContinue: () => void;
    onBack: () => void;
};

const STAGGER_DELAY = 100;

const FactCard = memo(({ fact, index }: { fact: FoodFact, index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(5)).current; // Subtler 5px slide

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400, // Faster, Snappier
                delay: index * STAGGER_DELAY,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                delay: index * STAGGER_DELAY,
                useNativeDriver: true,
            }),
        ]).start();
    }, [index]);

    return (
        <Animated.View
            style={[
                styles.factCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.factIconContainer}>
                {fact.id === 'sugar_60_names' ? (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        <ExpoImage
                            source={require('../../images/diabetes.gif')}
                            style={{
                                width: 38,
                                height: 38,
                                backgroundColor: 'transparent',
                            }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                        />
                    </View>
                ) : fact.id === 'natural_vague' ? (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        <ExpoImage
                            source={require('../../images/flask.gif')}
                            style={{
                                width: 38,
                                height: 38,
                                backgroundColor: 'transparent',
                            }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                        />
                    </View>
                ) : fact.id === 'labels_mislead' ? (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        <ExpoImage
                            source={require('../../images/bpa-free.gif')}
                            style={{
                                width: 38,
                                height: 36,
                                backgroundColor: 'transparent',
                            }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                        />
                    </View>
                ) : fact.id === 'red_dye_40' ? (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        <ExpoImage
                            source={require('../../images/dropper.gif')}
                            style={{
                                width: 38,
                                height: 38,
                                backgroundColor: 'transparent',
                            }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                        />
                    </View>
                ) : (
                    <Ionicons
                        name={fact.icon as any}
                        size={22}
                        color="#1A1C1E"
                    />
                )}
            </View>
            <View style={styles.factTextContainer}>
                <Text style={styles.factTitle}>{fact.title}</Text>
                <Text style={styles.factContent}>{fact.content}</Text>
            </View>
        </Animated.View>
    );
});

export function FactsScreen({ onContinue, onBack }: Props) {
    const backScale = useRef(new Animated.Value(1)).current;
    const nextScale = useRef(new Animated.Value(1)).current;

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

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.main}>
                    <View style={styles.header}>
                        <ProgressIndicator currentStep={3} totalSteps={4} />
                        <View style={styles.avatarContainer}>
                            <ExpoImage
                                source={require('../../images/facts.png')}
                                style={styles.avatarImage}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                                transition={0}
                            />
                        </View>
                        <Text style={styles.title}>Interesting Facts</Text>
                        <Text style={styles.subtitle}>
                            Insights based on your profile to help you navigate your journey.
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.factsList}
                        removeClippedSubviews={true}
                    >
                        {FOOD_FACTS.map((fact, index) => (
                            <FactCard key={fact.id} fact={fact} index={index} />
                        ))}
                    </ScrollView>

                    <View style={styles.footerContainer}>
                        <View style={styles.footerButtons}>
                            <Animated.View style={{ transform: [{ scale: backScale }] }}>
                                <Pressable
                                    style={styles.backButton}
                                    onPressIn={() => handlePressIn(backScale)}
                                    onPressOut={() => handlePressOut(backScale)}
                                    onPress={onBack}
                                >
                                    <Ionicons name="chevron-back" size={24} color="#111111" />
                                </Pressable>
                            </Animated.View>

                            <Animated.View style={{ flex: 1, transform: [{ scale: nextScale }] }}>
                                <Pressable
                                    style={styles.continueButton}
                                    onPressIn={() => handlePressIn(nextScale)}
                                    onPressOut={() => handlePressOut(nextScale)}
                                    onPress={onContinue}
                                >
                                    <Text style={styles.continueButtonText}>Get Started</Text>
                                </Pressable>
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
