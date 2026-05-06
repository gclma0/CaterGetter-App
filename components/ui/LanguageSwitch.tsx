import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '@/lib/i18n';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  const isEN = language === 'en';

  const slideAnim = useRef(new Animated.Value(isEN ? 0 : 1)).current;

  const toggle = () => {
    const toValue = isEN ? 1 : 0;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setLanguage(isEN ? 'bn' : 'en');
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 46],
  });

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.wrapper}>
      {/* Track */}
      <View style={[styles.track, !isEN && styles.trackActive]}>
        {/* Labels */}
        <Text style={[styles.label, styles.labelLeft, isEN && styles.labelActive]}>EN</Text>
        <Text style={[styles.label, styles.labelRight, !isEN && styles.labelActive]}>বাং</Text>

        {/* Thumb */}
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]}>
          <Text style={styles.thumbText}>{isEN ? 'EN' : 'বাং'}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const TRACK_WIDTH = 88;
const THUMB_SIZE = 38;

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  track: {
    width: TRACK_WIDTH,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    position: 'relative',
  },
  trackActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    zIndex: 1,
  },
  labelLeft: { paddingLeft: 2 },
  labelRight: { paddingRight: 2 },
  labelActive: {
    color: Colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 2,
  },
  thumbText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
