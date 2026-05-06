import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export default function CustomerProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName.trim(), phone: phone.trim() }, { onConflict: 'id' });
    setSaving(false);
    if (error) {
      if (Platform.OS === 'web') window.alert(error.message);
      else Alert.alert(t.error, error.message);
    } else {
      await refreshProfile();
      setEditing(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t.signOutConfirm)) {
        // Directly wipe all storage and hard-reload to the landing page.
        // This bypasses any async timing issues with the Supabase client.
        try { window.localStorage.clear(); } catch (_) {}
        try { window.sessionStorage.clear(); } catch (_) {}
        window.location.replace('/');
      }
    } else {
      Alert.alert(t.signOut, t.signOutConfirm, [
        { text: t.cancel, style: 'cancel' },
        { text: t.signOut, style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView 
        style={styles.root} 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>{t.profile}</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={88} />
          <Text style={styles.name}>{profile?.full_name ?? t.customer}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="person-outline" size={13} color={Colors.primary} />
            <Text style={styles.roleText}>{t.customer}</Text>
          </View>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{t.emailLabel}</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {editing ? (
            <>
              <Input
                label={t.fullNameLabel}
                value={fullName}
                onChangeText={setFullName}
                leftIcon="person-outline"
              />
              <Input
                label={t.phoneLabel}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                leftIcon="call-outline"
              />
              <View style={styles.editActions}>
                <Button
                  label={t.cancel}
                  variant="secondary"
                  onPress={() => {
                    setFullName(profile?.full_name ?? '');
                    setPhone(profile?.phone ?? '');
                    setEditing(false);
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  label={t.save}
                  onPress={handleSave}
                  loading={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{t.fullNameLabel}</Text>
                  <Text style={styles.infoValue}>{profile?.full_name ?? '—'}</Text>
                </View>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={Colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{t.phoneLabel}</Text>
                  <Text style={styles.infoValue}>{profile?.phone ?? '—'}</Text>
                </View>
              </View>
              <View style={styles.separator} />
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                <Text style={styles.editBtnText}>{t.editProfile}</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        <Button
          label={t.signOut}
          variant="danger"
          onPress={handleSignOut}
          fullWidth
          style={styles.signOutFullBtn}
        />

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  signOutBtn: { padding: Spacing.xs },

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.md },
  email: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  roleText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  infoCard: { marginBottom: Spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  separator: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.xs },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
  editBtnText: { color: Colors.primary, fontWeight: FontWeight.medium, fontSize: FontSize.md },
  editActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },

  signOutFullBtn: { marginTop: Spacing.sm },
});
