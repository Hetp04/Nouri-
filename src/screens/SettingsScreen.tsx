import React from 'react';
import { View, Text, SafeAreaView, Pressable, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/settingsScreen.styles';
import { signOut } from '../lib/auth';
import * as Haptics from 'expo-haptics';

interface Props {
    email: string;
    onBack: () => void;
    onSignOut: () => void;
}

export function SettingsScreen({ email, onBack, onSignOut }: Props) {
    const handleSignOut = async () => {
        const result = await signOut();
        if (result.success) {
            onSignOut();
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButton}
                        onPress={onBack}
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    >
                        <Ionicons name="chevron-back" size={24} color="#111111" />
                    </Pressable>
                    <Text style={styles.title}>Settings</Text>
                </View>

                <View style={{ flex: 1 }} />

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
            </SafeAreaView>
        </View>
    );
}
