import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export type RegisterData = {
  email: string;
  password: string;
  role: 'customer' | 'vendor';
};

// We store interim data in module scope (simple MVP approach)
let _pendingRegister: RegisterData = { email: '', password: '', role: 'customer' };
export const getPendingRegister = () => _pendingRegister;

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    _pendingRegister = { email: email.trim(), password, role };
    router.push('/(auth)/register-details');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Step 1 of 2 — Account details</Text>
        </View>

        {/* Role Selector */}
        <View style={styles.roleRow}>
          {(['customer', 'vendor'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleCard, role === r && styles.roleCardActive]}
              onPress={() => setRole(r)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={r === 'customer' ? 'person-outline' : 'storefront-outline'}
                size={26}
                color={role === r ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>
                {r === 'customer' ? 'Customer' : 'Caterer'}
              </Text>
              <Text style={styles.roleDesc}>
                {r === 'customer' ? 'Browse & book' : 'Manage & sell'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.confirm}
          />

          <Button label="Next →" onPress={handleNext} fullWidth size="lg" style={styles.btn} />
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingTop: Spacing.xxl },

  backBtn: { marginBottom: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs },

  roleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  roleLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  roleLabelActive: { color: Colors.primary },
  roleDesc: { fontSize: FontSize.xs, color: Colors.textMuted },

  form: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  btn: { marginTop: Spacing.sm },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textMuted, fontSize: FontSize.md },
  loginHighlight: { color: Colors.primary, fontWeight: FontWeight.semibold },
});
