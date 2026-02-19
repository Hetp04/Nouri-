import { StyleSheet, Animated } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEFB',
  },
  safeArea: {
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 28,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 260,
    height: 260,
    marginBottom: 8,
  },
  title: {
    marginTop: 0,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#111111',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
    color: 'rgba(60, 60, 67, 0.72)',
  },
  highlight: {
    color: '#2F6B4F',
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: '#2F6B4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(17, 17, 17, 0.78)',
  },
});

// Helper function to create animated wrapper styles
export const createAnimatedWrapperStyle = (
  opacity: Animated.Value,
  translateY: Animated.Value
) => ({
  opacity,
  transform: [{ translateY }],
});
