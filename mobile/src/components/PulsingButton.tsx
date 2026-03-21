import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

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
          Animated.timing(pulse, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulse.setValue(1);
    }
  }, [isRecording, pulse]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: pulse }], opacity: isRecording ? 0.3 : 0 },
        ]}
      />
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.button, isRecording && styles.buttonActive]}
      >
        <Text style={styles.icon}>{isRecording ? '⏹' : '🎤'}</Text>
        <Text style={styles.label}>{isRecording ? 'Stop' : 'Spela in'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const BUTTON_SIZE = 160;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_SIZE + 60,
    height: BUTTON_SIZE + 60,
  },
  ring: {
    position: 'absolute',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 40,
    borderRadius: (BUTTON_SIZE + 40) / 2,
    backgroundColor: Colors.accent,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonActive: {
    backgroundColor: '#CC0000',
  },
  icon: {
    fontSize: 40,
  },
  label: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
