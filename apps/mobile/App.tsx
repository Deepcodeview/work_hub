import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@workhub/design-tokens';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WorkHub Mobile</Text>
      <Text style={styles.subtitle}>Company Operating System</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Phase 0 Baseline</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  badge: {
    backgroundColor: colors.primary.subtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  badgeText: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
    fontSize: 12,
  },
});
