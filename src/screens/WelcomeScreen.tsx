import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, SafeAreaView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { styles, createAnimatedWrapperStyle } from '../styles/welcomeScreen.styles';

type Props = {
  onGetStarted?: () => void;
  onSignIn?: () => void;
};

function TypingText({ text, style, highlightStyle, delay = 0 }: { text: string; style: any; highlightStyle: any; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start typing after delay
    const startTimeout = setTimeout(() => {
      let currentIndex = 0;
      const fullText = text;

      const typeChar = () => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.substring(0, currentIndex + 1));
          currentIndex++;
          timeoutRef.current = setTimeout(typeChar, 20); // 20ms per character (faster)
        } else {
          // Hide cursor after typing completes
          setTimeout(() => setShowCursor(false), 500);
        }
      };

      typeChar();
    }, delay);

    // Cursor blink effect
    cursorIntervalRef.current = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, [text, delay]);

  // Parse the text to handle the highlight and newline
  const beforeHighlight = "Understand ingredients instantly.\nMake ";
  const highlightText = "healthier choices";
  const afterHighlight = " effortlessly.";

  const hasReachedHighlight = displayedText.length > beforeHighlight.length;
  const hasReachedAfter = displayedText.length > (beforeHighlight.length + highlightText.length);

  const beforeText = displayedText.substring(0, beforeHighlight.length);
  const highlightDisplay = hasReachedHighlight
    ? displayedText.substring(beforeHighlight.length, beforeHighlight.length + highlightText.length)
    : '';
  const afterText = hasReachedAfter
    ? displayedText.substring(beforeHighlight.length + highlightText.length)
    : '';

  return (
    <Text style={style}>
      {beforeText}
      {hasReachedHighlight && highlightDisplay.length > 0 && (
        <Text style={highlightStyle}>{highlightDisplay}</Text>
      )}
      {afterText}
      {showCursor && displayedText.length < text.length && '|'}
    </Text>
  );
}

export function WelcomeScreen({ onGetStarted, onSignIn }: Props) {
  // Separate animated values for each element
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const avatarTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const descriptionTranslateY = useRef(new Animated.Value(20)).current;
  const getStartedOpacity = useRef(new Animated.Value(0)).current;
  const getStartedTranslateY = useRef(new Animated.Value(20)).current;
  const signInOpacity = useRef(new Animated.Value(0)).current;
  const signInTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fast, snappy spring animations with minimal delays
    const createSpringAnimation = (opacity: Animated.Value, translateY: Animated.Value, delay: number) => {
      return Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          delay,
          useNativeDriver: true,
        }),
      ]);
    };

    // Animate most elements in parallel with tiny stagger
    Animated.parallel([
      createSpringAnimation(avatarOpacity, avatarTranslateY, 0),      // Avatar: immediate
      createSpringAnimation(titleOpacity, titleTranslateY, 50),       // Title: 50ms
      createSpringAnimation(descriptionOpacity, descriptionTranslateY, 100), // Description: 100ms
      createSpringAnimation(getStartedOpacity, getStartedTranslateY, 150), // Get Started: 150ms
      createSpringAnimation(signInOpacity, signInTranslateY, 180),      // Sign In: 180ms
    ]).start();
  }, [avatarOpacity, avatarTranslateY, titleOpacity, titleTranslateY, descriptionOpacity, descriptionTranslateY, getStartedOpacity, getStartedTranslateY, signInOpacity, signInTranslateY]);

  const fullText = "Understand ingredients instantly.\nMake healthier choices effortlessly.";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.main}>
          <View style={styles.centerContent}>
            <Animated.View style={createAnimatedWrapperStyle(avatarOpacity, avatarTranslateY)}>
              <Image
                source={require('../../images/splash.png')}
                style={styles.avatarImage}
                resizeMode="contain"
                accessibilityLabel="Nouri avatar"
              />
            </Animated.View>

            <Animated.View style={createAnimatedWrapperStyle(titleOpacity, titleTranslateY)}>
              <Text style={styles.title}>Welcome to Nouri</Text>
            </Animated.View>

            <Animated.View style={createAnimatedWrapperStyle(descriptionOpacity, descriptionTranslateY)}>
              <TypingText
                text={fullText}
                style={styles.subtitle}
                highlightStyle={styles.highlight}
                delay={150}
              />
            </Animated.View>
          </View>

          <View style={styles.actions}>
            <Animated.View style={createAnimatedWrapperStyle(getStartedOpacity, getStartedTranslateY)}>
              <Pressable
                style={styles.primaryButton}
                onPress={onGetStarted}
                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={createAnimatedWrapperStyle(signInOpacity, signInTranslateY)}>
              <Pressable
                style={styles.secondaryButton}
                onPress={onSignIn}
                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
