import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Linking,
    PanResponder,
    ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { styles } from '../styles/signUpScreen.styles';
import { signUpWithCustomOTP, verifyCustomOTP, resendCustomOTP } from '../lib/customAuth';
import { signInWithGoogle } from '../lib/auth';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface Props {
    onBack: () => void;
    onSignUp: (data: any) => void;
    onSignIn: (email: string, isNewUser?: boolean) => void;
    hideProgressBar?: boolean;
}

export function SignUpScreen({ onBack, onSignUp, onSignIn, hideProgressBar = false }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);

    // Verification State
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const isSuccessRef = useRef(false);

    // Error and Loading State
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const loadingAnim = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        isSuccessRef.current = isSuccess;
    }, [isSuccess]);

    const [code, setCode] = useState('');
    const hiddenCodeInputRef = useRef<TextInput>(null);

    const [focusedField, setFocusedField] = useState<string | null>(null);
    const nameInputRef = useRef<TextInput>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    // Resend State
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const DEFAULT_VISIBLE_HEIGHT = 520;
    const DRAG_BAR_HEIGHT = 60;
    const INITIAL_OFFSET = SCREEN_HEIGHT - DEFAULT_VISIBLE_HEIGHT;

    // Bottom Sheet animations
    const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const sheetHeightOffset = useRef(new Animated.Value(INITIAL_OFFSET)).current;
    const lastOffset = useRef(INITIAL_OFFSET);



    // Button scales
    const appleScale = useRef(new Animated.Value(1)).current;
    const googleScale = useRef(new Animated.Value(1)).current;
    const emailScale = useRef(new Animated.Value(1)).current;
    const signUpScale = useRef(new Animated.Value(1)).current;
    const backScale = useRef(new Animated.Value(1)).current;

    // Form Animation
    const formOpacity = useRef(new Animated.Value(1)).current;
    const formTranslateX = useRef(new Animated.Value(0)).current;

    // Polish Animations
    const successScale = useRef(new Animated.Value(0)).current;
    const errorShake = useRef(new Animated.Value(0)).current;





    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let newVal = lastOffset.current + gestureState.dy;

                // Boundaries:
                // Min: 0 (fully expanded up to top)
                // Max: SCREEN_HEIGHT - DRAG_BAR_HEIGHT (only bar visible)
                if (newVal < 0) newVal = 0;
                if (newVal > SCREEN_HEIGHT - DRAG_BAR_HEIGHT) newVal = SCREEN_HEIGHT - DRAG_BAR_HEIGHT;

                sheetHeightOffset.setValue(newVal);
            },
            onPanResponderRelease: (_, gestureState) => {
                lastOffset.current += gestureState.dy;
                if (lastOffset.current < 0) lastOffset.current = 0;
                if (lastOffset.current > SCREEN_HEIGHT - DRAG_BAR_HEIGHT) lastOffset.current = SCREEN_HEIGHT - DRAG_BAR_HEIGHT;
            },
        })
    ).current;

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardWillShow', (e) => {
            // Auto expand to show more content when keyboard is up
            Animated.spring(sheetHeightOffset, {
                toValue: 120, // Slightly increased lift (was 140)
                useNativeDriver: true,
            }).start();
        });
        const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
            // Return to previous manual position
            Animated.spring(sheetHeightOffset, {
                toValue: lastOffset.current,
                useNativeDriver: true,
            }).start();
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [sheetHeightOffset]);





    useEffect(() => {
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
            // Reset success ref/state when opening to avoid stale redirect on close.
            isSuccessRef.current = false;
            setIsSuccess(false);
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
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start(() => {
                const wasSuccess = isSuccessRef.current;
                console.log('[SignUp] Modal closed. wasSuccess:', wasSuccess);

                setIsEmailModalVisible(false);
                setIsVerifying(false);
                setIsSuccess(false);
                isSuccessRef.current = false;
                setCode('');
                setFocusedField(null);
                sheetHeightOffset.setValue(INITIAL_OFFSET);
                lastOffset.current = INITIAL_OFFSET;

                // If it was a successful verification, trigger final redirect
                if (wasSuccess) {
                    console.log('[SignUp] Triggering onSignUp redirect...');
                    onSignUp({ name, email, password });
                }
            });
        }
    };

    const triggerShake = useCallback(() => {
        errorShake.setValue(0);
        Animated.sequence([
            Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(errorShake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(errorShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    }, [errorShake]);

    const handleVerifyCode = useCallback(async (verificationCode: string) => {
        if (!verificationCode || verificationCode.length !== 6) {
            triggerShake();
            setCode('');
            setErrorMessage('Please enter the 6-digit code.');
            setTimeout(() => {
                hiddenCodeInputRef.current?.focus();
            }, 100);
            return;
        }

        setIsVerifyingCode(true);

        // Verify with custom 6-digit OTP
        const result = await verifyCustomOTP(email, verificationCode);

        if (result.success) {
            setIsVerifyingCode(false);
            setIsSuccess(true);
            isSuccessRef.current = true;
            successScale.setValue(0);

            // Trigger celebration animation
            Animated.spring(successScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();

            // Start coherent transition sequence
            // User is now signed in (session created)
            setTimeout(() => {
                toggleEmailModal(false);
            }, 2000);
        } else {
            setIsVerifyingCode(false);
            console.log('Verification error:', result.error);
            triggerShake();
            setCode('');
            isSuccessRef.current = false;
            setErrorMessage(result.error || 'Invalid or expired code. Please try again.');

            // Refocus hidden input
            setTimeout(() => {
                hiddenCodeInputRef.current?.focus();
            }, 100);
        }
    }, [email, toggleEmailModal, successScale, triggerShake]);

    const handleCodeChange = useCallback((text: string) => {
        const cleanText = text.replace(/[^0-9]/g, '').slice(0, 6);
        setCode(cleanText);

        // Auto-submit if full
        if (cleanText.length === 6) {
            Keyboard.dismiss();
            handleVerifyCode(cleanText);
        }
    }, [handleVerifyCode]);

    // KeyPress no longer needed with single input approach

    const handleResend = async () => {
        if (resendTimer > 0 || isResending) return;

        setIsResending(true);

        // Resend custom 6-digit OTP via Resend
        const result = await resendCustomOTP(email, name);

        if (result.success) {
            setIsResending(false);
            setResendTimer(30);
            console.log('Resent verification code to', email);
        } else {
            setIsResending(false);
            console.error('Failed to resend:', result.error);
            setErrorMessage(result.error || 'Failed to resend code. Please try again.');
        }
    };

    const handleOpenGmail = useCallback(async () => {
        const gmailAppUrl = 'googlegmail://';
        const gmailWebUrl = 'https://mail.google.com';

        try {
            const supported = await Linking.canOpenURL(gmailAppUrl);
            if (supported) {
                await Linking.openURL(gmailAppUrl);
            } else {
                await Linking.openURL(gmailWebUrl);
            }
        } catch (error) {
            console.log('Error opening Gmail:', error);
            await Linking.openURL(gmailWebUrl);
        }
    }, []);

    // Resend Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSignUp = async () => {
        // Clear previous errors
        setErrorMessage(null);
        isSuccessRef.current = false;
        setIsSuccess(false);

        // Validation
        if (!name || !email || !password) {
            setErrorMessage('Please fill in all fields');
            triggerShake();
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            triggerShake();
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters');
            triggerShake();
            return;
        }

        setIsSigningUp(true);

        // Animate out
        Animated.parallel([
            Animated.timing(formOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(formTranslateX, {
                toValue: -50,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(async () => {
            setIsVerifying(true);
            setIsSuccess(false);
            isSuccessRef.current = false;
            setIsVerifyingCode(false);
            formTranslateX.setValue(50);

            // Call custom OTP sign up (6-digit codes via Resend)
            console.log('Attempting sign up with custom OTP:', { email, name });
            const result = await signUpWithCustomOTP({ email, password, name });
            console.log('Sign up result:', result);

            if (result.success) {
                setIsSigningUp(false);
                // Always show verification screen for custom OTP
                Animated.parallel([
                    Animated.timing(formOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(formTranslateX, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    hiddenCodeInputRef.current?.focus();
                });
            } else {
                // Show error and reset form
                console.warn('Sign up error:', result.error);
                setErrorMessage(result.error || 'Failed to sign up. Please try again.');
                triggerShake();
                Animated.parallel([
                    Animated.timing(formOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(formTranslateX, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
                setIsVerifying(false);
                setIsSigningUp(false);
            }
        });
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
                        {!hideProgressBar && <ProgressIndicator currentStep={4} totalSteps={4} />}
                        <Animated.View style={{ transform: [{ scale: backScale }] }}>
                            <Pressable
                                style={styles.backButtonHeader}
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
                            source={require('../../images/signup.png')}
                            style={styles.avatarImage}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                        />
                    </Animated.View>

                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Create account</Text>
                        <Text style={styles.subtitle}>
                            Know what's really in your food, instantly.
                        </Text>
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

                    <View style={styles.footerLink}>
                        <Text style={styles.footerText}>
                            Already have an account? <Text style={styles.footerLinkText} onPress={() => onSignIn('', false)}>Sign in</Text>
                        </Text>
                    </View>
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
                        <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
                            <View style={styles.dragHandle} />
                        </View>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={20}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{isVerifying ? 'Verify Email' : 'Create with Email'}</Text>
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => toggleEmailModal(false)}
                                    hitSlop={15}
                                >
                                    <Ionicons name="close" size={24} color="#111111" />
                                </Pressable>
                            </View>


                            <Animated.View style={[
                                styles.form,
                                {
                                    opacity: formOpacity,
                                    transform: [{ translateX: formTranslateX }]
                                }
                            ]}>
                                {isVerifying ? (
                                    isSuccess ? (
                                        <View style={styles.successContainer}>
                                            <Animated.View
                                                style={{
                                                    transform: [{ scale: successScale }],
                                                    marginBottom: 24,
                                                }}
                                            >
                                                <Ionicons name="checkmark-circle" size={80} color="#2F6B4F" />
                                            </Animated.View>
                                            <Text style={styles.successTitle}>Email Verified</Text>
                                            <Text style={styles.successSubtitle}>Your account is ready.</Text>
                                            <Text style={[styles.successSubtitle, { marginTop: 12, fontSize: 14, opacity: 0.6 }]}>
                                                Redirecting to home...
                                            </Text>
                                        </View>
                                    ) : (
                                        <>
                                            <Text style={styles.verificationText}>
                                                Enter the code we sent to <Text style={styles.emailHighlight}>{email}</Text>
                                            </Text>

                                            <Animated.View style={{ transform: [{ translateX: errorShake }] }}>
                                                <Pressable
                                                    style={styles.codeContainer}
                                                    onPress={() => hiddenCodeInputRef.current?.focus()}
                                                >
                                                    {[0, 1, 2, 3, 4, 5].map((index) => {
                                                        const digit = code[index] || '';
                                                        const isFocused = isVerifying && code.length === index;
                                                        const isActive = digit !== '' || isFocused;

                                                        return (
                                                            <View
                                                                key={index}
                                                                style={[
                                                                    styles.codeInput,
                                                                    {
                                                                        borderColor: isActive ? '#2F6B4F' : '#EAE9E4',
                                                                        backgroundColor: isActive ? '#FFFFFF' : '#F7F6F2',
                                                                        shadowOpacity: isActive ? 0.1 : 0,
                                                                        elevation: isActive ? 2 : 0,
                                                                        transform: [{ scale: isActive ? 1.05 : 1 }],
                                                                    }
                                                                ]}
                                                            >
                                                                <Text style={styles.codeInputText}>{digit}</Text>
                                                            </View>
                                                        );
                                                    })}
                                                    <TextInput
                                                        ref={hiddenCodeInputRef}
                                                        value={code}
                                                        onChangeText={handleCodeChange}
                                                        keyboardType="number-pad"
                                                        maxLength={6}
                                                        style={styles.hiddenInput}
                                                        caretHidden
                                                    />
                                                </Pressable>
                                            </Animated.View>
                                            <Animated.View style={{ transform: [{ scale: signUpScale }] }}>
                                                <Pressable
                                                    style={styles.verifyButton}
                                                    onPress={() => handleVerifyCode(code)}
                                                    onPressIn={() => handlePressIn(signUpScale)}
                                                    onPressOut={() => handlePressOut(signUpScale)}
                                                    hitSlop={10}
                                                    disabled={isVerifyingCode}
                                                >
                                                    {isVerifyingCode ? (
                                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                                    ) : (
                                                        <Text style={styles.verifyButtonText}>Verify Email</Text>
                                                    )}
                                                </Pressable>
                                            </Animated.View>

                                            <Pressable
                                                style={styles.gmailButton}
                                                onPress={handleOpenGmail}
                                            >
                                                <Image
                                                    source={require('../../images/gmail.png')}
                                                    style={styles.gmailIconImage}
                                                />
                                                <Text style={styles.gmailButtonText}>Open Gmail</Text>
                                            </Pressable>

                                            <Pressable
                                                style={styles.resendContainer}
                                                onPress={handleResend}
                                                disabled={resendTimer > 0 || isResending}
                                            >
                                                <Text style={[styles.resendText, (resendTimer > 0 || isResending) && { opacity: 0.6 }]}>
                                                    {isResending ? 'Sending...' : (
                                                        resendTimer > 0 ? (
                                                            `Resend code in ${resendTimer}s`
                                                        ) : (
                                                            <>Didn't receive code? <Text style={styles.resendLink}>Resend</Text></>
                                                        )
                                                    )}
                                                </Text>
                                            </Pressable>
                                        </>
                                    )
                                ) : (
                                    <>
                                        {/* Sign Up Form Inputs */}
                                        {/* ... (existing inputs) ... */}

                                        <Pressable
                                            style={[
                                                styles.inputWrapper,
                                                focusedField === 'name' && styles.inputWrapperFocused
                                            ]}
                                            onPress={() => nameInputRef.current?.focus()}
                                        >
                                            <View style={styles.iconContainer}>
                                                <Ionicons
                                                    name="person-outline"
                                                    size={20}
                                                    color={focusedField === 'name' ? "#2F6B4F" : "#9CA3AF"}
                                                />
                                            </View>
                                            <TextInput
                                                ref={nameInputRef}
                                                style={styles.input}
                                                placeholder="Full Name"
                                                placeholderTextColor="#9CA3AF"
                                                value={name}
                                                onChangeText={setName}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(prev => prev === 'name' ? null : prev)}
                                                textContentType="none"
                                                autoComplete="off"
                                            />
                                        </Pressable>

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
                                                textContentType="none"
                                                autoComplete="off"
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
                                                textContentType="oneTimeCode"
                                            />
                                            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                                            </Pressable>
                                        </Pressable>

                                        <Pressable
                                            style={[
                                                styles.inputWrapper,
                                                focusedField === 'confirmPassword' && styles.inputWrapperFocused
                                            ]}
                                            onPress={() => confirmPasswordInputRef.current?.focus()}
                                        >
                                            <View style={styles.iconContainer}>
                                                <Ionicons
                                                    name="lock-closed-outline"
                                                    size={20}
                                                    color={focusedField === 'confirmPassword' ? "#2F6B4F" : "#9CA3AF"}
                                                />
                                            </View>
                                            <TextInput
                                                ref={confirmPasswordInputRef}
                                                style={styles.input}
                                                placeholder="Confirm Password"
                                                placeholderTextColor="#9CA3AF"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry={!showConfirmPassword}
                                                onFocus={() => setFocusedField('confirmPassword')}
                                                onBlur={() => setFocusedField(prev => prev === 'confirmPassword' ? null : prev)}
                                                textContentType="oneTimeCode"
                                            />
                                            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={10}>
                                                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                                            </Pressable>
                                        </Pressable>

                                        {errorMessage && (
                                            <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                                                <Text style={{ color: '#DC2626', fontSize: 14, textAlign: 'center' }}>
                                                    {errorMessage}
                                                </Text>
                                            </View>
                                        )}
                                        <Animated.View style={{ transform: [{ scale: signUpScale }] }}>
                                            <Pressable
                                                style={[styles.signUpButton, isSigningUp && { opacity: 0.7 }]}
                                                onPress={handleSignUp}
                                                onPressIn={() => handlePressIn(signUpScale)}
                                                onPressOut={() => handlePressOut(signUpScale)}
                                                hitSlop={10}
                                                disabled={isSigningUp}
                                            >
                                                {isSigningUp ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <Text style={styles.signUpButtonText}>Sign Up</Text>
                                                )}
                                            </Pressable>
                                        </Animated.View>
                                    </>
                                )}
                            </Animated.View>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            </Modal >
        </View >
    );
}
