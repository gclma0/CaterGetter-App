import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getPendingRegister } from './register';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const CUISINE_OPTIONS = ['Bengali', 'Chinese', 'Italian', 'Indian', 'Thai', 'Continental', 'Arabic', 'Mexican'];
const CATEGORY_OPTIONS = ['Wedding', 'Birthday', 'Corporate', 'Home Party', 'Outdoor Event'];

export default function RegisterDetailsScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const pending = getPendingRegister();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isVendor = pending.role === 'vendor';

  const toggleCuisine = (c: string) =>
    setSelectedCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const toggleCategory = (c: string) =>
    setSelectedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = t.fullNameRequired;
    if (!phone.trim()) e.phone = t.phoneRequired;
    if (isVendor && !businessName.trim()) e.businessName = t.businessNameRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(
      pending.email,
      pending.password,
      pending.role,
      fullName.trim(),
      phone.trim(),
      isVendor ? { businessName: businessName.trim(), cuisineTypes: selectedCuisines, categories: selectedCategories } : undefined
    );
    setLoading(false);
    if (error) {
      Alert.alert(t.registrationFailed, error);
    }
    // Auth listener in _layout will redirect automatically
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{isVendor ? t.businessDetails : t.yourDetails}</Text>
          <Text style={styles.subtitle}>{t.step2of2}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t.fullName}
            placeholder={t.fullNamePlaceholder}
            value={fullName}
            onChangeText={setFullName}
            leftIcon="person-outline"
            error={errors.fullName}
          />
          <Input
            label={t.phoneNumber}
            placeholder={t.phonePlaceholder}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            leftIcon="call-outline"
            error={errors.phone}
          />

          {isVendor && (
            <>
              <Input
                label={t.businessName}
                placeholder={t.businessNamePlaceholder}
                value={businessName}
                onChangeText={setBusinessName}
                leftIcon="storefront-outline"
                error={errors.businessName}
              />

              <Text style={styles.sectionLabel}>{t.cuisineTypes}</Text>
              <View style={styles.pillRow}>
                {CUISINE_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pill, selectedCuisines.includes(c) && styles.pillActive]}
                    onPress={() => toggleCuisine(c)}
                  >
                    <Text style={[styles.pillText, selectedCuisines.includes(c) && styles.pillTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>{t.eventCategories}</Text>
              <View style={styles.pillRow}>
                {CATEGORY_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pill, selectedCategories.includes(c) && styles.pillActive]}
                    onPress={() => toggleCategory(c)}
                  >
                    <Text style={[styles.pillText, selectedCategories.includes(c) && styles.pillTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Button
            label={t.createAccount}
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.btn}
          />
        </View>
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

  form: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  pillText: { color: Colors.textMuted, fontSize: FontSize.sm },
  pillTextActive: { color: Colors.primary, fontWeight: FontWeight.medium },

  btn: { marginTop: Spacing.md },
});
