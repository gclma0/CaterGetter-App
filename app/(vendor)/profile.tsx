import React, { useCallback, useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LocationPicker from '@/components/ui/LocationPicker';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface VendorData {
  business_name: string;
  description: string | null;
  location: string | null;
  is_approved: boolean;
}

export default function VendorProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [editing, setEditing] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchVendor = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setVendor(data);
      setBusinessName(data.business_name ?? '');
      setDescription(data.description ?? '');
      setLocation(data.location ?? '');
    }
  }, [user?.id]);

  useEffect(() => { fetchVendor(); }, [fetchVendor]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Upsert profiles (handles case where row may not exist yet)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName.trim(), phone: phone.trim() }, { onConflict: 'id' });

    // Upsert vendors (handles case where vendor row may not exist yet)
    const { error: vendorError } = await supabase
      .from('vendors')
      .upsert({
        id: user.id,
        business_name: businessName.trim() || 'My Business',
        description: description.trim() || null,
        location: location.trim() || null,
      }, { onConflict: 'id' });

    setSaving(false);

    if (profileError || vendorError) {
      const msg = profileError
        ? `Profile: ${profileError.message}`
        : `Vendor: ${vendorError?.message}`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Save Failed', msg);
      }
    } else {
      await Promise.all([refreshProfile(), fetchVendor()]);
      setEditing(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        signOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Avatar + Business */}
        <View style={styles.avatarSection}>
          <Avatar uri={profile?.avatar_url} name={vendor?.business_name ?? profile?.full_name} size={88} />
          <Text style={styles.businessNameText}>{vendor?.business_name ?? '—'}</Text>
          <Text style={styles.ownerName}>{profile?.full_name}</Text>
          <View style={styles.statusRow}>
            <Badge
              label={vendor?.is_approved ? 'Approved' : 'Pending Approval'}
              variant={vendor?.is_approved ? 'approved' : 'pending'}
            />
          </View>
        </View>

        {/* Info Card */}
        <Card style={styles.card}>
          {editing ? (
            <>
              <Input label="Full Name" value={fullName} onChangeText={setFullName} leftIcon="person-outline" />
              <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" leftIcon="call-outline" />
              <Input label="Business Name" value={businessName} onChangeText={setBusinessName} leftIcon="storefront-outline" />
              <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} leftIcon="document-text-outline" />
              <LocationPicker label="Location / Address" value={location} onChange={setLocation} />
              <View style={styles.editActions}>
                <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} />
                <Button label="Save" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              {[
                { icon: 'mail-outline', label: 'Email', value: user?.email },
                { icon: 'person-outline', label: 'Full Name', value: profile?.full_name },
                { icon: 'call-outline', label: 'Phone', value: profile?.phone },
                { icon: 'storefront-outline', label: 'Business', value: vendor?.business_name },
                { icon: 'document-text-outline', label: 'Description', value: vendor?.description },
                { icon: 'location-outline', label: 'Location', value: vendor?.location },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <View style={styles.infoRow}>
                    <Ionicons name={row.icon as any} size={18} color={Colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue}>{row.value ?? '—'}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))}
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        <Button label="Sign Out" variant="danger" onPress={handleSignOut} fullWidth style={{ marginTop: Spacing.sm }} />
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

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  businessNameText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.md },
  ownerName: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  statusRow: { marginTop: Spacing.sm },

  card: { marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  separator: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.xs },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
  editBtnText: { color: Colors.primary, fontWeight: FontWeight.medium, fontSize: FontSize.md },
  editActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
});
