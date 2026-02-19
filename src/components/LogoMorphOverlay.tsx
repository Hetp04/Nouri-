import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /**
   * - animating: plays the full splash->welcome sequence ONCE
   * - final: shows the logo parked top-left (no animation)
   * - off: hidden (kept mounted to avoid re-running animations on re-mount)
   */
  mode: 'animating' | 'final' | 'off';
};

const INITIAL_SIZE = 200;
const FINAL_SCALE = 0.37; // ~70px when initial is 200px
const FINAL_SIZE = INITIAL_SIZE * FINAL_SCALE;

const FINAL_LEFT = 32; // 28-35px spec
const FINAL_TOP_MIN = 50; // spec (accounting for safe area)
const FINAL_TOP_SAFE_GAP = 12;

export function LogoMorphOverlay({ mode }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const finalTop = useMemo(() => Math.max(FINAL_TOP_MIN, insets.top + FINAL_TOP_SAFE_GAP), [insets.top]);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const hasAnimatedOnceRef = useRef(false);

  useEffect(() => {
    const initialX = width / 2 - INITIAL_SIZE / 2;
    const initialY = height / 2 - INITIAL_SIZE / 2;

    const finalCenterX = FINAL_LEFT + FINAL_SIZE / 2;
    const finalCenterY = finalTop + FINAL_SIZE / 2;
    const finalX = finalCenterX - INITIAL_SIZE / 2;
    const finalY = finalCenterY - INITIAL_SIZE / 2;

    if (mode === 'off') {
      opacity.setValue(0);
      return;
    }

    if (mode === 'final') {
      opacity.setValue(1);
      scale.setValue(FINAL_SCALE);
      translateX.setValue(finalX);
      translateY.setValue(finalY);
      return;
    }

    // mode === 'animating'
    if (hasAnimatedOnceRef.current) {
      // If we already played (e.g. user navigated around), keep it parked.
      opacity.setValue(1);
      scale.setValue(FINAL_SCALE);
      translateX.setValue(finalX);
      translateY.setValue(finalY);
      return;
    }

    hasAnimatedOnceRef.current = true;

    // Reset to Phase 1 start
    opacity.setValue(0);
    scale.setValue(0.8);
    translateX.setValue(initialX);
    translateY.setValue(initialY);

    const intro = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    const morph = Animated.parallel([
      Animated.timing(translateX, {
        toValue: finalX,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: finalY,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: FINAL_SCALE,
        duration: 700,
        useNativeDriver: true,
      }),
    ]);

    // Phase 1 (0-0.8s) -> Phase 2 hold (0.8-2.0s) -> Phase 3 morph (2.0-2.7s)
    const anim = Animated.sequence([intro, Animated.delay(1200), morph]);
    anim.start();

    return () => {
      // Best-effort stop (prevents stray callbacks/timers if unmounted)
      anim.stop();
    };
  }, [mode, width, height, finalTop, opacity, scale, translateX, translateY]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity,
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
      >
        <Image
          source={require('../../images/nouri.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Nouri logo"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    position: 'absolute',
    width: INITIAL_SIZE,
    height: INITIAL_SIZE,
    zIndex: 999,
  },
  logo: {
    width: INITIAL_SIZE,
    height: INITIAL_SIZE,
  },
});

