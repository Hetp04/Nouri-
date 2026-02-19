import React from 'react';
import { StyleSheet, View } from 'react-native';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Logo is rendered at the app level for persistence across transition */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFEFB',
  },
});
