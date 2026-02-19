import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    SafeAreaView,
    ScrollView,
    Image,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Dimensions,
    StyleSheet,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/signInScreen.styles';
import { signInWithEmail, signInWithGoogle } from '../lib/auth';
import * as Haptics from 'expo-haptics';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    onBack: () => void;
    onSignIn: (email: string, isNewUser?: boolean) => void;
    onSignUp: () => void;
}

export function SignInScreen({ onBack, onSignIn, onSignUp }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const INITIAL_OFFSET = SCREEN_HEIGHT * 0.48;
    const EXPANDED_OFFSET = 120;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    // Bottom Sheet animations
    const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const sheetHeightOffset = useRef(new Animated.Value(INITIAL_OFFSET)).current;
    const lastOffset = useRef(INITIAL_OFFSET);

    // Loading transition
    const [isLoading, setIsLoading] = useState(false);
    const loadingAnim = useRef(new Animated.Value(0)).current;

    // Button animations
    const appleScale = useRef(new Animated.Value(1)).current;
    const googleScale = useRef(new Animated.Value(1)).current;
    const emailScale = useRef(new Animated.Value(1)).current;
    const signInScale = useRef(new Animated.Value(1)).current;
    const backScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                Animated.spring(sheetHeightOffset, {
                    toValue: EXPANDED_OFFSET,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 40,
                }).start();
                lastOffset.current = EXPANDED_OFFSET;
            }
        );

        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                Animated.spring(sheetHeightOffset, {
                    toValue: INITIAL_OFFSET,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 40,
                }).start();
                lastOffset.current = INITIAL_OFFSET;
            }
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        // Start entrance animations with a slight delay to allow screen transition to begin
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    const toggleEmailModal = (visible: boolean) => {
        if (visible) {
            setIsEmailModalVisible(true);
            Animated.parallel([
                Animated.spring(sheetAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 40,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(sheetAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setIsEmailModalVisible(false);
                setFocusedField(null);
                setEmail('');
                setPassword('');
                // Reset sheet height
                sheetHeightOffset.setValue(INITIAL_OFFSET);
                lastOffset.current = INITIAL_OFFSET;
            });
        }
    };

    const handleSignIn = async () => {
        // Clear previous errors
        setErrorMessage(null);

        const normalizedEmail = email.trim().toLowerCase();

        // Validation
        if (!normalizedEmail || !password) {
            setErrorMessage('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        Animated.timing(loadingAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Sign in with Supabase
        const result = await signInWithEmail({ email: normalizedEmail, password });

        if (result.success && result.user) {
            // Success - proceed with sign in
            onSignIn(normalizedEmail, false); // Manual email sign-in is never "new" in this context
            toggleEmailModal(false);
        } else {
            // Error - show error and reset
            setIsLoading(false);
            Animated.timing(loadingAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            const msg = result.error || 'Failed to sign in. Please try again.';
            // Avoid noisy redbox-style logging for expected auth failures in dev.
            setErrorMessage(
                msg.includes('Invalid login credentials')
                    ? 'Incorrect email or password.'
                    : msg
            );
        }
    };

    const handleGoogleSignIn = async () => {
        setErrorMessage(null);
        setIsLoading(true);

        Animated.timing(loadingAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        const result = await signInWithGoogle();

        if (result.success && result.user) {
            onSignIn(result.user.email || '', result.isNewUser);
        } else {
            setIsLoading(false);
            Animated.timing(loadingAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();

            if (result.error && result.error !== 'Authorization was cancelled or failed.') {
                setErrorMessage(result.error);
            }
        }
    };


    const handlePressIn = (scale: Animated.Value) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(scale, {
            toValue: 0.95,
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

    const handleBack = () => {
        if (isEmailModalVisible) {
            toggleEmailModal(false);
        } else {
            onBack();
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.scrollContent}>
                    <View style={styles.header}>
                        <Animated.View style={{ transform: [{ scale: backScale }] }}>
                            <Pressable
                                style={styles.backButton}
                                onPress={handleBack}
                                onPressIn={() => handlePressIn(backScale)}
                                onPressOut={() => handlePressOut(backScale)}
                            >
                                <Ionicons name="chevron-back" size={28} color="#111111" />
                            </Pressable>
                        </Animated.View>
                    </View>

                    <Animated.View style={[
                        styles.avatarContainer,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}>
                        <ExpoImage
                            source={require('../../images/sign.png')}
                            style={styles.avatarImage}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                        />
                    </Animated.View>

                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Welcome back</Text>
                        <Text style={styles.subtitle}>Your journey to better food choices.</Text>
                    </View>

                    <View style={styles.actions}>
                        <Animated.View style={{ transform: [{ scale: appleScale }] }}>
                            <Pressable
                                style={[styles.socialButton, styles.appleButton]}
                                onPress={() => { }}
                                onPressIn={() => handlePressIn(appleScale)}
                                onPressOut={() => handlePressOut(appleScale)}
                                hitSlop={10}
                            >
                                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                                    Continue with Apple
                                </Text>
                            </Pressable>
                        </Animated.View>

                        <Animated.View style={{ transform: [{ scale: googleScale }] }}>
                            <Pressable
                                style={[styles.socialButton, styles.googleButton]}
                                onPress={handleGoogleSignIn}
                                onPressIn={() => handlePressIn(googleScale)}
                                onPressOut={() => handlePressOut(googleScale)}
                                hitSlop={10}
                                disabled={isLoading}
                            >
                                <Image
                                    source={require('../../images/—Pngtree—google internet icon vector_12256707.png')}
                                    style={{ width: 22, height: 22 }}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.socialButtonText, styles.googleButtonText]}>
                                    Continue with Google
                                </Text>
                            </Pressable>
                        </Animated.View>

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Animated.View style={{ transform: [{ scale: emailScale }] }}>
                            <Pressable
                                style={[styles.socialButton, styles.emailButton]}
                                onPress={() => toggleEmailModal(true)}
                                onPressIn={() => handlePressIn(emailScale)}
                                onPressOut={() => handlePressOut(emailScale)}
                                hitSlop={10}
                            >
                                <Ionicons name="mail-outline" size={20} color="#111111" />
                                <Text style={[styles.socialButtonText, styles.emailButtonText]}>
                                    Continue with Email
                                </Text>
                            </Pressable>
                        </Animated.View>
                    </View>

                    <Pressable style={styles.footerLink} onPress={onSignUp} hitSlop={10}>
                        <Text style={styles.footerText}>
                            Don't have an account? <Text style={styles.footerLinkText}>Sign up</Text>
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>

            <Modal
                visible={isEmailModalVisible}
                transparent
                animationType="none"
                onRequestClose={() => toggleEmailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                opacity: overlayAnim
                            }
                        ]}
                    />
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => toggleEmailModal(false)}
                    />
                    <Animated.View style={[
                        styles.modalContent,
                        {
                            transform: [
                                { translateY: sheetAnim },
                                { translateY: sheetHeightOffset }
                            ]
                        }
                    ]}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={20}
                        >
                            <View style={styles.dragHandleContainer}>
                                <View style={styles.dragHandle} />
                            </View>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Login with Email</Text>
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => toggleEmailModal(false)}
                                    hitSlop={15}
                                >
                                    <Ionicons name="close" size={24} color="#111111" />
                                </Pressable>
                            </View>

                            <View style={styles.form} pointerEvents="box-none">
                                <Pressable
                                    style={[
                                        styles.inputWrapper,
                                        focusedField === 'email' && styles.inputWrapperFocused
                                    ]}
                                    onPress={() => emailInputRef.current?.focus()}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons
                                            name="mail-outline"
                                            size={20}
                                            color={focusedField === 'email' ? "#2F6B4F" : "#9CA3AF"}
                                        />
                                    </View>
                                    <TextInput
                                        ref={emailInputRef}
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(prev => prev === 'email' ? null : prev)}
                                    />
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.inputWrapper,
                                        focusedField === 'password' && styles.inputWrapperFocused
                                    ]}
                                    onPress={() => passwordInputRef.current?.focus()}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={20}
                                            color={focusedField === 'password' ? "#2F6B4F" : "#9CA3AF"}
                                        />
                                    </View>
                                    <TextInput
                                        ref={passwordInputRef}
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(prev => prev === 'password' ? null : prev)}
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword(!showPassword)}
                                        hitSlop={10}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </Pressable>
                                </Pressable>

                                <View style={styles.formOptions}>
                                    <Pressable
                                        style={styles.rememberMeContainer}
                                        onPress={() => setRememberMe(!rememberMe)}
                                        hitSlop={10}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            rememberMe && styles.checkboxChecked
                                        ]}>
                                            {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                                        </View>
                                        <Text style={styles.rememberMeText}>Remember me</Text>
                                    </Pressable>

                                    <Pressable
                                        style={styles.forgotPassword}
                                        onPress={() => { }}
                                        hitSlop={10}
                                    >
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </Pressable>
                                </View>

                                {errorMessage && (
                                    <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                                        <Text style={{ color: '#DC2626', fontSize: 14, textAlign: 'center' }}>
                                            {errorMessage}
                                        </Text>
                                    </View>
                                )}

                                <Animated.View style={{ transform: [{ scale: signInScale }] }}>
                                    <Pressable
                                        style={[styles.signInButton, isLoading && { opacity: 0.7 }]}
                                        onPress={handleSignIn}
                                        onPressIn={() => handlePressIn(signInScale)}
                                        onPressOut={() => handlePressOut(signInScale)}
                                        hitSlop={10}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.signInButtonText}>Sign In</Text>
                                        )}
                                    </Pressable>
                                </Animated.View>
                            </View>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            </Modal>
            {isLoading && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: 'rgba(255, 254, 251, 0.8)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: loadingAnim,
                            zIndex: 9999,
                        }
                    ]}
                >
                    <View style={styles.loadingContainer}>
                        <Animated.View style={{
                            transform: [{
                                rotate: loadingAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '360deg']
                                })
                            }]
                        }}>
                            <Ionicons name="reload" size={40} color="#2F6B4F" />
                        </Animated.View>
                        <Text style={styles.loadingText}>Signing you in...</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}
