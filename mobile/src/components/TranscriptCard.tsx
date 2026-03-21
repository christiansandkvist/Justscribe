import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  text: string;
}

export function TranscriptCard({ text }: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.text} selectable>
        {text || 'Ingen text transkriberades.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  content: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  text: {
    ...Typography.body,
    lineHeight: 26,
  },
});
