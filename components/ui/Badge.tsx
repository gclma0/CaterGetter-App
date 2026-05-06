import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

type BadgeVariant = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'approved' | 'info' | 'success';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  pending:   { bg: Colors.warningMuted, text: Colors.warning },
  accepted:  { bg: Colors.successMuted, text: Colors.success },
  completed: { bg: Colors.successMuted, text: Colors.success },
  approved:  { bg: Colors.successMuted, text: Colors.success },
  rejected:  { bg: Colors.dangerMuted,  text: Colors.danger },
  cancelled: { bg: Colors.dangerMuted,  text: Colors.danger },
  info:      { bg: Colors.infoMuted,    text: Colors.info },
  success:   { bg: Colors.successMuted, text: Colors.success },
};

export default function Badge({ label, variant = 'info' }: BadgeProps) {
  const { bg, text } = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
});
