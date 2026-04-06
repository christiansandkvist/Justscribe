import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onPress: () => void;
  isRecording: boolean;
}

export function PulsingButton({ onPress, isRecording }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulse.setValue(1);
    }
  }, [isRecording, pulse]);

  return (
    <View style={s.wrapper}>
      <Animated.View
        style={[
          s.ring,
          { transform: [{ scale: pulse }], opacity: isRecording ? 0.25 : 0 },
        ]}
      />
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.button}>
        {!isRecording && (
          <LinearGradient
            colors={['#64b4ff', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {isRecording && (
          <View style={[StyleSheet.absoluteFill, s.recordingBg]} />
        )}
        <Text style={s.icon}>{isRecording ? '⏹' : '🎤'}</Text>
        <Text style={s.label}>{isRecording ? 'Stop' : 'Spela in'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const BUTTON_SIZE = 160;

const s = StyleSheet.create({
  wrapper:      { alignItems: 'center', justifyContent: 'center', width: BUTTON_SIZE + 60, height: BUTTON_SIZE + 60 },
  ring:         { position: 'absolute', width: BUTTON_SIZE + 40, height: BUTTON_SIZE + 40, borderRadius: (BUTTON_SIZE + 40) / 2, backgroundColor: '#64b4ff' },
  button:       { width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  recordingBg:  { backgroundColor: '#CC0000', borderRadius: BUTTON_SIZE / 2 },
  icon:         { fontSize: 40 },
  label:        { color: '#ffffff', fontSize: 16, fontWeight: '700', marginTop: 4 },
});
