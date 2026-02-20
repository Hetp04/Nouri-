import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_600SemiBold, Poppins_500Medium, Poppins_400Regular } from '@expo-google-fonts/poppins';
import { OpenSans_400Regular, OpenSans_600SemiBold } from '@expo-google-fonts/open-sans';
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { ConcernsScreen } from './src/screens/ConcernsScreen';
import { AllergiesScreen } from './src/screens/AllergiesScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { FactsScreen } from './src/screens/FactsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnimatedScreen } from './src/components/AnimatedScreen';
import { LogoMorphOverlay } from './src/components/LogoMorphOverlay';
import { supabase } from './src/lib/supabase';
import { loadOnboardingData, clearOnboardingData } from './src/lib/storage';


type Screen = 'splash' | 'welcome' | 'concerns' | 'allergies' | 'facts' | 'signIn' | 'signUp' | 'home';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [previousScreen, setPreviousScreen] = useState<Screen>('welcome');
  const [logoMode, setLogoMode] = useState<'animating' | 'final' | 'off'>('animating');
  const hasPlayedSplashIntroRef = useRef(false);
  const [userData, setUserData] = useState({
    concerns: [] as string[],
    allergies: [] as string[],
  });
  const [pendingEmail, setPendingEmail] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);
  // Holds the Google email during onboarding so we don't set pendingEmail prematurely
  const pendingGoogleEmailRef = useRef('');
  // True once the user has passed through Concerns → Allergies → Facts
  const onboardingDoneRef = useRef(false);

  // On app load, check if user already has a valid session.
  // If yes → skip splash/welcome and go straight to Home.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setPendingEmail(session.user.email || '');
          setCurrentScreen('home');
          setLogoMode('off');
        }
      } catch (e) {
        // If session check fails, just show welcome as normal
        if (__DEV__) console.warn('Session check failed:', e);
      } finally {
        setSessionChecked(true);
      }
    };
    checkSession();
  }, []);

  // Restore any partially-completed onboarding data from AsyncStorage.
  // This means if the user quit mid-flow, their pill selections are recovered.
  useEffect(() => {
    loadOnboardingData().then((saved) => {
      if (saved.concerns.length > 0 || saved.allergies.length > 0) {
        setUserData(saved);
        if (__DEV__) console.log('[App] Restored onboarding data from storage:', saved);
      }
    });
  }, []);

  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_500Medium,
    Poppins_400Regular,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
  });

  // Preload all avatar images and GIFs for instant display
  useEffect(() => {
    if (fontsLoaded) {
      // Preload GIFs first (they're more important for the facts screen)
      const gifsToPreload = [
        require('./images/diabetes.gif'),
        require('./images/flask.gif'),
        require('./images/bpa-free.gif'),
        require('./images/dropper.gif'),
      ];

      // Preload avatar images
      const avatarsToPreload = [
        require('./images/help.png'),
        require('./images/allergy.png'),
        require('./images/facts.png'),
        require('./images/sign.png'),
        require('./images/signup.png'),
      ];

      // Preload GIFs with higher priority
      gifsToPreload.forEach((imageSource) => {
        const source = Image.resolveAssetSource(imageSource);
        if (source?.uri) {
          Image.prefetch(source.uri).catch(() => {
            // Silently fail if prefetch doesn't work
          });
        }
      });

      // Preload avatars
      avatarsToPreload.forEach((imageSource) => {
        const source = Image.resolveAssetSource(imageSource);
        if (source?.uri) {
          Image.prefetch(source.uri).catch(() => {
            // Silently fail if prefetch doesn't work
          });
        }
      });
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Keep the overlay mounted and just switch modes so the animation cannot
    // re-trigger when users navigate back to Welcome.
    if (currentScreen === 'splash') {
      setLogoMode(hasPlayedSplashIntroRef.current ? 'final' : 'animating');

      const timer = setTimeout(() => {
        hasPlayedSplashIntroRef.current = true;
        setLogoMode('final'); // stays top-left during transition
        setDirection('forward');
        setCurrentScreen('welcome');
      }, 2900); // Transition right after logo morph completes (2.7s) + small buffer

      return () => clearTimeout(timer);
    }

    if (currentScreen === 'welcome') {
      setLogoMode('final');
      return;
    }

    setLogoMode('off');
  }, [currentScreen]);

  if (!fontsLoaded || !sessionChecked) {
    return null;
  }

  const handleConcernsContinue = (selectedConcerns: string[]) => {
    setUserData(prev => ({ ...prev, concerns: selectedConcerns }));
    setCurrentScreen('allergies');
  };

  const handleAllergiesContinue = (selectedAllergies: string[]) => {
    setUserData(prev => ({ ...prev, allergies: selectedAllergies }));
    setDirection('forward');
    setCurrentScreen('facts');
  };

  // Called when a user finishes onboarding and lands on Home.
  // Writes a user_profiles row so next time they sign in with Google
  // they are correctly identified as a returning user and skip onboarding.
  const markOnboardingComplete = async (concerns: string[], allergies: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').upsert({
          user_id: user.id,
          onboarding_completed: true,
          concerns,
          allergies,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        // Clear locally-persisted onboarding data now that it's safely in Supabase
        await clearOnboardingData();
        // Apply the Google email now that onboarding is done
        if (pendingGoogleEmailRef.current) {
          setPendingEmail(pendingGoogleEmailRef.current);
          pendingGoogleEmailRef.current = '';
        } else {
          setPendingEmail(user.email || '');
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('Could not save user profile:', e);
    }
  };


  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'welcome':
        return (
          <WelcomeScreen
            onGetStarted={() => {
              setDirection('forward');
              setCurrentScreen('concerns');
            }}
            onSignIn={() => {
              setDirection('forward');
              setCurrentScreen('signIn');
            }}
          />
        );
      case 'signIn':
        return (
          <SignInScreen
            onBack={() => {
              setDirection('back');
              setCurrentScreen('welcome');
            }}
            onSignIn={(email, isNewUser) => {
              console.log('Signed in with email:', email, 'isNewUser:', isNewUser);
              setDirection('forward');
              if (isNewUser) {
                // Store email in ref — will be applied when they finish onboarding
                pendingGoogleEmailRef.current = email;
                setCurrentScreen('concerns');
              } else {
                // Returning user — set email and go home immediately
                setPendingEmail(email);
                setCurrentScreen('home');
              }
            }}
            onSignUp={() => {
              setDirection('forward');
              setPreviousScreen('signIn');
              setCurrentScreen('signUp');
            }}
          />
        );
      case 'concerns':
        return (
          <ConcernsScreen
            initialConcerns={userData.concerns}
            onSelectionChange={(selected) => {
              setUserData(prev => ({ ...prev, concerns: selected }));
            }}
            onContinue={(selected) => {
              setDirection('forward');
              handleConcernsContinue(selected);
            }}
            onBack={() => {
              setDirection('back');
              // If they arrived here from signIn→signUp, go back to signUp
              // Otherwise go back to welcome
              setCurrentScreen(previousScreen === 'signIn' ? 'signUp' : 'welcome');
            }}
          />
        );
      case 'allergies':
        return (
          <AllergiesScreen
            initialAllergies={userData.allergies}
            onSelectionChange={(selected) => {
              setUserData(prev => ({ ...prev, allergies: selected }));
            }}
            onContinue={handleAllergiesContinue}
            onBack={() => {
              setDirection('back');
              setCurrentScreen('concerns');
            }}
            onSkip={() => handleAllergiesContinue([])}
          />
        );
      case 'facts':
        return (
          <FactsScreen
            onContinue={async () => {
              setDirection('forward');
              // Mark that the user has completed the onboarding flow
              onboardingDoneRef.current = true;
              // Check if user is already authenticated (e.g. via Google earlier)
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                setPendingEmail(session.user.email || '');
                await markOnboardingComplete(userData.concerns, userData.allergies);
                setCurrentScreen('home');
              } else {
                setCurrentScreen('signUp');
              }
            }}
            onBack={() => {
              setDirection('back');
              setCurrentScreen('allergies');
            }}
          />
        );
      case 'signUp':
        return (
          <SignUpScreen
            onBack={() => {
              setDirection('back');
              setCurrentScreen(previousScreen === 'signIn' ? 'signIn' : 'facts');
            }}
            onSignUp={async (data) => {
              console.log('Signed up with data:', data);
              setPendingEmail(data.email);
              setDirection('forward');
              if (previousScreen === 'signIn') {
                // User came from Sign In → Sign Up (hasn't done onboarding yet).
                // Send them through onboarding now.
                onboardingDoneRef.current = false;
                setCurrentScreen('concerns');
              } else {
                // Came through full onboarding (Facts → SignUp) → save everything and go home
                await markOnboardingComplete(userData.concerns, userData.allergies);
                setCurrentScreen('home');
              }
            }}
            onSignIn={(email, isNewUser) => {
              setDirection('forward');
              if (!email) {
                // "Already have an account? Sign in" link → go to sign in screen
                setCurrentScreen('signIn');
              } else if (!isNewUser) {
                // Returning Google user → go straight home
                setPendingEmail(email);
                setCurrentScreen('home');
              } else if (onboardingDoneRef.current) {
                // New Google user but they already completed onboarding screens —
                // save their profile and go home. Don't loop back to Concerns.
                pendingGoogleEmailRef.current = email;
                markOnboardingComplete(userData.concerns, userData.allergies).then(() => {
                  setCurrentScreen('home');
                });
              } else {
                // New Google user who hasn't done onboarding yet → start it
                pendingGoogleEmailRef.current = email;
                setCurrentScreen('concerns');
              }
            }}
            hideProgressBar={previousScreen === 'signIn'}
          />
        );
      case 'home':
        return (
          <HomeScreen
            email={pendingEmail}
            onSignOut={() => {
              setPendingEmail('');
              setUserData({ concerns: [], allergies: [] });
              setDirection('back');
              setCurrentScreen('welcome');
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        {currentScreen === 'splash' ? (
          renderScreen()
        ) : (
          <AnimatedScreen screenKey={currentScreen} direction={direction}>
            {renderScreen()}
          </AnimatedScreen>
        )}
        <LogoMorphOverlay mode={logoMode} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
