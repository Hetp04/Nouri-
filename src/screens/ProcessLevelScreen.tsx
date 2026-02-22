import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, SafeAreaView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { FrequencySlider } from '../components/FrequencySlider';
import { styles as allergyStyles } from '../styles/allergiesScreen.styles';
import { saveOnboardingData } from '../lib/storage';

type Props = {
    onContinue: (intake: number) => void;
    onBack: () => void;
    initialValue?: number;
    onSelectionChange?: (intake: number) => void;
};

export function ProcessLevelScreen({ onContinue, onBack, initialValue = 0, onSelectionChange }: Props) {
    const [sliderValue, setSliderValue] = useState(initialValue);
    const [backgroundColor, setBackgroundColor] = useState('#FBFBF9');

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        saveOnboardingData({ ultraProcessedIntake: sliderValue });
        onSelectionChange?.(sliderValue);
    }, [sliderValue]);

    const handleColorChange = (bg: string, accent: string) => {
        setBackgroundColor(bg);
    };

    return (
        <View style={[allergyStyles.container, { backgroundColor }]}>
            <SafeAreaView style={allergyStyles.safeArea}>
                <View style={allergyStyles.main}>
                    <View style={allergyStyles.header}>
                        <ProgressIndicator currentStep={4} totalSteps={5} />
                        <View style={allergyStyles.avatarContainer}>
                            <ExpoImage
                                source={require('../../images/ultra.png')}
                                style={[allergyStyles.avatarImage, { transform: [{ scale: 1.25 }] }]}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                                transition={0}
                            />
                        </View>
                        <Text style={allergyStyles.title}>Ultra-processed food intake</Text>
                        <Text style={allergyStyles.subtitle}>
                            Select the frequency that matches your lifestyle
                        </Text>
                    </View>

                    <View style={styles.sliderSection}>
                        <FrequencySlider
                            value={sliderValue}
                            onChange={setSliderValue}
                            onColorChange={handleColorChange}
                        />
                    </View>

                    <View style={allergyStyles.footer}>
                        <View style={allergyStyles.footerButtons}>
                            <Pressable
                                style={allergyStyles.backButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onBack();
                                }}
                            >
                                <Ionicons name="chevron-back" size={24} color="#111111" />
                            </Pressable>
                            <Pressable
                                style={allergyStyles.continueButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    onContinue(sliderValue);
                                }}
                            >
                                <Text style={allergyStyles.continueButtonText}>Next</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    sliderSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
});
