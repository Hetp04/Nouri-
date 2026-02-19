import React, { useState, useEffect, useRef } from 'react';
import { View, SafeAreaView, Image, Text, Pressable, Animated, Keyboard, TextInput, Easing, Dimensions, PanResponder, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { styles } from '../styles/homeScreen.styles';
import { NoteEditor } from '../components/NoteEditor';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { ForbiddenListModal } from '../components/ForbiddenListModal';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { useVoiceRecorder, MicStatus } from '../hooks/useVoiceRecorder';

import { supabase } from '../lib/supabase';

interface Props {
  email: string;
  onSignOut: () => void;
  onOpenSettings: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeScreen({ email, onSignOut, onOpenSettings }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Notes storage: {'YYYY-MM-DD': 'content'}
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Helper to get key for storage - moving up for scope
  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const currentDateKey = getDateKey(selectedDate);

  // Track navigation direction for page transitions
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');


  const [issueCount, setIssueCount] = useState(0);
  const [dailyScore, setDailyScore] = useState(0);

  useEffect(() => {
    // Delay slightly to trigger the "slot machine" animation
    setTimeout(() => {
      setDailyScore(87);
    }, 100);
  }, []);

  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [isDropdownMounted, setIsDropdownMounted] = useState(false);
  const [dropdownAnim] = useState(new Animated.Value(0));
  const [showForbiddenList, setShowForbiddenList] = useState(false);
  const dockRetreatAnim = useRef(new Animated.Value(0)).current;

  // Animation for the dock elevation
  const keyboardHeight = useKeyboardHeight();
  const editorRef = useRef<TextInput>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Fetch user profile from Supabase to get saved concerns/allergies
  const [userConcerns, setUserConcerns] = useState<string[]>([]);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('concerns, allergies')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setUserConcerns(profile.concerns || []);
            setUserAllergies(profile.allergies || []);
            // Update the "shield count" to be the total number of restricted items
            setIssueCount((profile.concerns?.length || 0) + (profile.allergies?.length || 0));
          }
        }
      } catch (e) {
        console.warn('Failed to fetch user profile:', e);
      }
    };

    fetchUserProfile();
  }, [email]); // Re-fetch when email changes (sign in/out)
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitNote, setExitNote] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const lastDateKey = useRef(currentDateKey);

  // Swipe gesture state
  const swipeOverlayX = useRef(new Animated.Value(0)).current;
  const [swipeOverlay, setSwipeOverlay] = useState<{
    currentNote: string;
    previewNote: string;
    direction: 'forward' | 'back';
  } | null>(null);
  const isTransitionLocked = useRef(false);
  const transitionSource = useRef<'button' | 'swipe' | null>(null);

  const commitToDate = (direction: 'forward' | 'back', nextDate: Date) => {
    if (isTransitionLocked.current) {
      return;
    }
    isTransitionLocked.current = true;

    setNavDirection(direction);

    // Stop any button animation that might be running
    slideAnim.stopAnimation(() => {
      slideAnim.setValue(1);
    });
    setIsAnimating(false);
    setExitNote(null);

    // Update date IMMEDIATELY - don't wait for animation
    // The animation is just visual, the state should change right away
    lastDateKey.current = getDateKey(nextDate);
    transitionSource.current = 'swipe';
    setSelectedDate(nextDate);

    // Animate the overlay layers:
    // - Current snapshot slides away from center (revealing real TextInput underneath)
    // - Preview layer slides into center
    // Use spring for more natural feel with velocity
    Animated.spring(swipeOverlayX, {
      toValue: direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    }).start(() => {
      // setTimeout pushes to next event loop tick, ensuring paint has completed
      setTimeout(() => {
        setSwipeOverlay(null);
        isTransitionLocked.current = false;
      }, 0);
    });
  };

  useEffect(() => {
    if (lastDateKey.current !== currentDateKey) {
      if (transitionSource.current === 'swipe') {
        transitionSource.current = null;
        lastDateKey.current = currentDateKey;
        return;
      }

      transitionSource.current = 'button';

      // 1. Capture the "old" content for the exit animation
      setExitNote(notes[lastDateKey.current] || '');
      setIsAnimating(true);

      // 2. Prepare the slide (0 is neutral, 1 is completed)
      slideAnim.setValue(0);

      // 3. Update the key ref
      lastDateKey.current = currentDateKey;

      // 4. Run the animation
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 550, // Slightly slower for more "weight"
        easing: Easing.bezier(0.33, 1, 0.68, 1), // Standard Apple-style cinematic curve
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsAnimating(false);
          setExitNote(null);
        }
        transitionSource.current = null;
      });
    }
  }, [currentDateKey]);

  // --------------------------------

  useEffect(() => {
    Animated.spring(dockRetreatAnim, {
      toValue: showForbiddenList ? 1 : 0,
      useNativeDriver: true,
      friction: 12,
      tension: 50,
    }).start();
  }, [showForbiddenList]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (showCameraMenu) {
      setIsDropdownMounted(true);
      // Reset to ensure it "pops out" fresh every time
      dropdownAnim.setValue(0);

      Animated.spring(dropdownAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    } else {
      Animated.spring(dropdownAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 10,
        tension: 50,
      }).start(({ finished }) => {
        if (finished) {
          setIsDropdownMounted(false);
        }
      });
    }
  }, [showCameraMenu]);

  const [micScale] = useState(new Animated.Value(1));
  const [cameraScale] = useState(new Animated.Value(1));
  const [keyboardScale] = useState(new Animated.Value(1));

  // Mic expand animation
  const [isMicExpanded, setIsMicExpanded] = useState(false);
  const micExpandAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded

  // Voice recording state
  const [micStatus, setMicStatus] = useState<MicStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const micLevelRef = useRef(0);

  // The dock icons row has 3 × 40px circles + 2 × 10px gaps = 140px total
  const COLLAPSED_MIC_WIDTH = 40;
  const EXPANDED_MIC_WIDTH = 140;

  // Voice recorder hook
  const recorder = useVoiceRecorder({
    onLevel: (level) => {
      micLevelRef.current = level;
      setMicLevel(level);
    },
    onTranscript: (text) => {
      if (!text) return;
      // Prepend transcribed text to today's note
      setNotes(prev => {
        const existing = prev[currentDateKey] ?? '';
        const joined = existing ? `${text}\n${existing}` : text;
        return { ...prev, [currentDateKey]: joined };
      });
    },
    onError: (msg) => {
      Alert.alert('Voice Error', msg);
      // Collapse mic pill back on error
      setIsMicExpanded(false);
      Animated.timing(micExpandAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    },
    onStatusChange: (status) => {
      setMicStatus(status);
      // When fully done (idle after transcription), collapse the pill
      if (status === 'idle' || status === 'error') {
        setIsMicExpanded(false);
        Animated.timing(micExpandAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const handleMicPress = async () => {
    if (micStatus === 'transcribing') return; // Busy — ignore tap

    if (!isMicExpanded) {
      // Expand pill first, then start recording
      setIsMicExpanded(true);
      Animated.timing(micExpandAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await recorder.start();
    } else {
      // Stop recording — pill stays open during transcription, collapses when done
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await recorder.stop();
    }
  };

  const animateScale = (scale: Animated.Value, toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  };

  const handlePreviousDay = () => {
    if (isTransitionLocked.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNavDirection('back');
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    transitionSource.current = 'button';
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    if (isTransitionLocked.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNavDirection('forward');
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    transitionSource.current = 'button';
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return 'Today';
    }

    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };


  const currentNote = notes[currentDateKey] || '';

  const getNoteForDate = (date: Date) => {
    const key = getDateKey(date);
    return notes[key] || '';
  };

  const swipeThreshold = Math.min(140, SCREEN_WIDTH * 0.25);
  const swipeVelocityThreshold = 0.8;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, gestureState) => {
      const { dx, dy } = gestureState;
      if (Math.abs(dx) < 5) return false;
      return Math.abs(dx) > Math.abs(dy) * 0.5;
    },
    onPanResponderGrant: () => {
      transitionSource.current = 'swipe';

      // Cancel any button-driven transition layers
      slideAnim.stopAnimation(() => { slideAnim.setValue(1); });
      setIsAnimating(false);
      setExitNote(null);

      Keyboard.dismiss();
      editorRef.current?.blur?.();

      swipeOverlayX.setValue(0);
      setSwipeOverlay(null);
    },
    onPanResponderMove: (_evt, gestureState) => {
      const dx = Math.max(-SCREEN_WIDTH, Math.min(SCREEN_WIDTH, gestureState.dx));
      swipeOverlayX.setValue(dx);

      if (Math.abs(dx) < 1) {
        return;
      }

      const dir: 'forward' | 'back' = dx < 0 ? 'forward' : 'back';
      const targetDate = new Date(selectedDate);
      targetDate.setDate(targetDate.getDate() + (dir === 'forward' ? 1 : -1));
      const targetNote = getNoteForDate(targetDate);

      setSwipeOverlay(prev => {
        if (prev && prev.direction === dir && prev.previewNote === targetNote) {
          return prev;
        }
        return {
          currentNote: notes[currentDateKey] || '',
          previewNote: targetNote,
          direction: dir,
        };
      });
    },
    onPanResponderRelease: (_evt, gestureState) => {
      const dx = gestureState.dx;
      const shouldCommit =
        Math.abs(dx) > swipeThreshold || Math.abs(gestureState.vx) > swipeVelocityThreshold;
      const dir: 'forward' | 'back' = dx < 0 ? 'forward' : 'back';

      if (!shouldCommit) {
        // Spring animation for cancel - more natural bounce-back
        Animated.spring(swipeOverlayX, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }).start(() => {
          setSwipeOverlay(null);
        });
        return;
      }

      const targetDate = new Date(selectedDate);
      targetDate.setDate(targetDate.getDate() + (dir === 'forward' ? 1 : -1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      commitToDate(dir, targetDate);
    },
    onPanResponderTerminate: () => {
      // Spring animation for cancel - more natural bounce-back
      Animated.spring(swipeOverlayX, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start(() => {
        setSwipeOverlay(null);
      });
    },
  });

  const handleNoteChange = (text: string) => {
    setNotes(prev => ({
      ...prev,
      [currentDateKey]: text
    }));
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {isDropdownMounted && (
          <Pressable
            style={styles.dropdownOverlay}
            onPress={() => setShowCameraMenu(false)}
          />
        )}
        <View style={styles.header}>
          {/* Logo on the left */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../images/nouri.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Centered Date Island Overlay */}
          <View style={styles.dateIslandCentered}>
            <View style={styles.dateIslandContent}>
              <Pressable
                style={styles.dateArrowButton}
                onPress={handlePreviousDay}
              >
                <Ionicons name="chevron-back" size={16} color="#6B7280" />
              </Pressable>

              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>

              <Pressable
                style={styles.dateArrowButton}
                onPress={handleNextDay}
              >
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* Right Icons Dynamic Island */}
          <View style={styles.rightIcons}>
            <View style={styles.iconsIslandContent}>
              <View style={[styles.shieldContainer, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                <Ionicons name="shield-outline" size={18} color="#FF3B30" />
              </View>
              {issueCount > 0 && (
                <Text style={styles.shieldCountText}>{issueCount}</Text>
              )}
              <Pressable style={styles.shieldContainer} onPress={onOpenSettings}>
                <Image
                  source={require('../../images/gear-setting-settings-svgrepo-com.png')}
                  style={{ width: 18, height: 18, tintColor: '#111111' }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#FFFEFB' }}>
          {/* Outgoing/Ghost Page for button transitions */}
          {isAnimating && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#FFFEFB',
                zIndex: 0,
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, navDirection === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH]
                    })
                  }
                ]
              }}
            >
              <NoteEditor
                value={exitNote || ''}
                onChangeText={() => { }}
                readOnly
              />
            </Animated.View>
          )}

          {/* Active Page - NEVER moves during swipe, only during button transitions */}
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              flex: 1,
              backgroundColor: '#FFFEFB',
              zIndex: 1,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [navDirection === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH, 0]
                  })
                }
              ]
            }}
          >
            <NoteEditor
              ref={editorRef}
              value={currentNote}
              onChangeText={handleNoteChange}
            />
          </Animated.View>

          {/* Swipe overlay - two layers for smooth transition */}
          {swipeOverlay && (
            <>
              {/* Preview layer - slides into center */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#FFFEFB',
                  zIndex: 2,
                  transform: [
                    {
                      translateX: Animated.add(
                        swipeOverlayX,
                        swipeOverlay.direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH
                      )
                    }
                  ],
                }}
              >
                <NoteEditor
                  value={swipeOverlay.previewNote}
                  onChangeText={() => { }}
                  readOnly
                />
              </Animated.View>

              {/* Current snapshot - slides away from center, revealing real TextInput */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#FFFEFB',
                  zIndex: 3,
                  transform: [
                    {
                      translateX: swipeOverlayX,
                    }
                  ],
                }}
              >
                <NoteEditor
                  value={swipeOverlay.currentNote}
                  onChangeText={() => { }}
                  readOnly
                />
              </Animated.View>
            </>
          )}
        </View>

        {/* Bottom Dock Footer - Animates with Keyboard */}
        <Animated.View
          style={[
            styles.bottomDockContainer,
            {
              transform: [{
                translateY: Animated.add(
                  Animated.add(
                    Animated.multiply(keyboardHeight, -1),
                    keyboardHeight.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0, 24],
                      extrapolate: 'clamp'
                    })
                  ),
                  dockRetreatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200]
                  })
                )
              }]
            }
          ]}
        >
          {isDropdownMounted && (
            <Animated.View
              style={[
                styles.dropdownContainer,
                {
                  opacity: dropdownAnim,
                  borderRadius: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 16] }), // Morph from perfect circle to rounded rect
                  transform: [
                    { scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }) },
                    { translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [44, 0] }) },
                    { translateX: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [4.5, 0] }) }
                  ]
                }
              ]}
            >
              <Pressable style={styles.dropdownItem} onPress={() => setShowCameraMenu(false)}>
                <Ionicons name="images-outline" size={20} color="#111111" />
                <Text style={styles.dropdownText}>Photo library</Text>
              </Pressable>
              <Pressable style={styles.dropdownItem} onPress={() => setShowCameraMenu(false)}>
                <Ionicons name="camera-outline" size={20} color="#111111" />
                <Text style={styles.dropdownText}>Take photo</Text>
              </Pressable>
              <Pressable style={styles.dropdownItem} onPress={() => setShowCameraMenu(false)}>
                <Ionicons name="barcode-outline" size={20} color="#111111" />
                <Text style={styles.dropdownText}>Scan barcode</Text>
              </Pressable>
            </Animated.View>
          )}

          <View style={styles.bottomDockPill}>
            {/* Daily Score Module */}
            <View style={styles.dailyScoreModule}>
              <View style={styles.scoreBadge}>
                <Ionicons name="sparkles" size={16} color="#8B5D43" />
              </View>
              <View style={styles.scoreTextContainer}>
                <Text style={styles.scoreLabel}>DAILY SCORE</Text>
                <View style={styles.scoreNumberContainer}>
                  <AnimatedNumber number={dailyScore} style={styles.scoreNumber} />
                  <Text style={styles.scoreTotal}>/ 100</Text>
                </View>
              </View>
            </View>

            {/* Right: mic (expands), camera, shield/keyboard */}
            <View style={styles.dockIconsRow}>
              {/* Mic button — expands rightward into a pill */}
              {/* Outer: JS-driver node for width (layout property) */}
              <Animated.View
                style={{
                  width: micExpandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [COLLAPSED_MIC_WIDTH, EXPANDED_MIC_WIDTH],
                  }),
                  height: 40,
                  borderRadius: 20,
                  overflow: 'hidden',
                  // Subtle background tint based on state
                  backgroundColor: micStatus === 'recording'
                    ? '#E8F4F0'
                    : micStatus === 'transcribing'
                      ? '#F5EDE8'
                      : '#F5F5F5',
                }}
              >
                <Pressable
                  onPressIn={() => animateScale(micScale, 0.92)}
                  onPressOut={() => animateScale(micScale, 1)}
                  onPress={handleMicPress}
                  style={{ flex: 1 }}
                >
                  {/* Inner: native-driver node for scale when collapsed, waveform when expanded */}
                  <Animated.View
                    style={{
                      flex: 1,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      transform: [{ scale: micScale }],
                    }}
                  >
                    {micStatus === 'recording' || micStatus === 'transcribing' ? (
                      <VoiceWaveform
                        level={micLevel}
                        active={isMicExpanded}
                        mode={micStatus === 'transcribing' ? 'transcribing' : 'recording'}
                        width={EXPANDED_MIC_WIDTH - 16}
                        height={26}
                      />
                    ) : (
                      <Ionicons
                        name="mic-outline"
                        size={20}
                        color="#111111"
                      />
                    )}
                  </Animated.View>
                </Pressable>
              </Animated.View>

              {/* Camera — fades out as mic expands */}
              <Animated.View
                pointerEvents={isMicExpanded ? 'none' : 'auto'}
                style={{
                  opacity: micExpandAnim.interpolate({
                    inputRange: [0, 0.4],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  width: micExpandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                    extrapolate: 'clamp',
                  }),
                  // Collapse the gap space as width shrinks
                  marginLeft: micExpandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                    extrapolate: 'clamp',
                  }),
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPressIn={() => animateScale(cameraScale, 0.92)}
                  onPressOut={() => animateScale(cameraScale, 1)}
                  onPress={() => setShowCameraMenu(!showCameraMenu)}
                >
                  <Animated.View style={[styles.dockIconCircle, { transform: [{ scale: cameraScale }] }]}>
                    <Ionicons name="camera-outline" size={20} color="#111111" />
                  </Animated.View>
                </Pressable>
              </Animated.View>

              {/* Shield / keyboard dismiss — fades out as mic expands */}
              <Animated.View
                pointerEvents={isMicExpanded ? 'none' : 'auto'}
                style={{
                  opacity: micExpandAnim.interpolate({
                    inputRange: [0, 0.4],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                  width: micExpandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                    extrapolate: 'clamp',
                  }),
                  // Collapse the gap space as width shrinks
                  marginLeft: micExpandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                    extrapolate: 'clamp',
                  }),
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPressIn={() => animateScale(keyboardScale, 0.92)}
                  onPressOut={() => animateScale(keyboardScale, 1)}
                  onPress={() => {
                    if (isKeyboardVisible) {
                      Keyboard.dismiss();
                    } else {
                      setShowForbiddenList(true);
                    }
                  }}
                >
                  <Animated.View style={[
                    styles.dockIconCircle,
                    { transform: [{ scale: keyboardScale }] }
                  ]}>
                    {isKeyboardVisible ? (
                      <Animated.View style={{
                        transform: [{
                          rotate: keyboardHeight.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['180deg', '0deg'],
                            extrapolate: 'clamp'
                          })
                        }]
                      }}>
                        <Image
                          source={require('../../images/keyboard-chevron-compact-down-svgrepo-com.png')}
                          style={[styles.dockIconImage, { tintColor: '#111111' }]}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    ) : (
                      <Ionicons name="shield-outline" size={20} color="#111111" />
                    )}
                  </Animated.View>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        <ForbiddenListModal
          visible={showForbiddenList}
          onClose={() => setShowForbiddenList(false)}
          concerns={userConcerns}
          allergies={userAllergies}
          onUpdate={(newConcerns, newAllergies) => {
            setUserConcerns(newConcerns);
            setUserAllergies(newAllergies);
            setIssueCount(newConcerns.length + newAllergies.length);
          }}
        />
      </SafeAreaView>
    </View >
  );
}
