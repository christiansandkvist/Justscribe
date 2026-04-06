import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

interface Props {
  text: string;
}

export function TranscriptCard({ text }: Props) {
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={true}
    >
      <Text style={s.text} selectable>
        {text || 'Ingen text transkriberades.'}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131328', borderRadius: 12 },
  content:   { padding: 16, flexGrow: 1 },
  text:      { fontSize: 15, color: '#ffffff', lineHeight: 26 },
});
