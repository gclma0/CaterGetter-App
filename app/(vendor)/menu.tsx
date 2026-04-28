import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, ScrollView, ActivityIndicator, RefreshControl,
  Image, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface Package {
  id: string; name: string; description: string | null;
  price: number; price_per_person: number | null;
  min_guests: number | null; max_guests: number | null;
  image_url: string | null; is_available: boolean;
  item_type: 'package' | 'item';
}

const EMPTY_PKG  = { name: '', description: '', price: '', pricePerPerson: '', minGuests: '', maxGuests: '' };
const EMPTY_ITEM = { name: '', description: '', price: '', minGuests: '', maxGuests: '' };

type AddMode = 'package' | 'item';

export default function VendorMenuScreen() {
  const { user } = useAuth();
  const [packages, setPackages]       = useState<Package[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [typeModal, setTypeModal]     = useState(false);      // choose package vs item
  const [formModal, setFormModal]     = useState(false);
  const [mode, setMode]               = useState<AddMode>('package');
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [pkgForm, setPkgForm]         = useState(EMPTY_PKG);
  const [itemForm, setItemForm]       = useState(EMPTY_ITEM);
  const [imageUri, setImageUri]       = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const pf = (k: keyof typeof EMPTY_PKG,  v: string) => setPkgForm(p => ({ ...p, [k]: v }));
  const itf = (k: keyof typeof EMPTY_ITEM, v: string) => setItemForm(p => ({ ...p, [k]: v }));

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPackages = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from('packages').select('*').eq('vendor_id', user.id)
      .order('item_type').order('created_at', { ascending: false });
    setPackages(data ?? []);
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPackages(); }, [fetchPackages]);

  // ── Open forms ────────────────────────────────────────────────────────────
  const openAdd = (m: AddMode) => {
    setMode(m); setEditingId(null);
    setPkgForm(EMPTY_PKG); setItemForm(EMPTY_ITEM);
    setImageUri(null); setErrors({});
    setTypeModal(false); setFormModal(true);
  };

  const openEdit = (pkg: Package) => {
    setMode(pkg.item_type === 'item' ? 'item' : 'package');
    setEditingId(pkg.id);
    setPkgForm({
      name: pkg.name, description: pkg.description ?? '',
      price: pkg.price_per_person ? '' : String(pkg.price),
      pricePerPerson: pkg.price_per_person ? String(pkg.price_per_person) : '',
      minGuests: String(pkg.min_guests ?? ''), maxGuests: String(pkg.max_guests ?? ''),
    });
    setItemForm({ 
      name: pkg.name, description: pkg.description ?? '', price: String(pkg.price),
      minGuests: String(pkg.min_guests ?? ''), maxGuests: String(pkg.max_guests ?? ''),
    });
    setImageUri(pkg.image_url ?? null);
    setErrors({}); setFormModal(true);
  };

  // ── Image picker ──────────────────────────────────────────────────────────
  const pickImage = async (source: 'gallery' | 'camera') => {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); return; }
      result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [16, 9] });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access required.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [16, 9] });
    }
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const showImagePicker = () => {
    if (Platform.OS === 'web') { pickImage('gallery'); return; }
    Alert.alert('Package Image', 'Choose source', [
      { text: 'Camera',  onPress: () => pickImage('camera') },
      { text: 'Gallery', onPress: () => pickImage('gallery') },
      { text: 'Cancel',  style: 'cancel' },
    ]);
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setImageUploading(true);
      const ext = uri.split('.').pop() ?? 'jpg';
      const res  = await fetch(uri);
      const blob = await res.blob();
      const { data, error } = await supabase.storage
        .from('package-images')
        .upload(`${user?.id}/${Date.now()}.${ext}`, blob, { contentType: `image/${ext}`, upsert: true });
      if (error) { Alert.alert('Upload Failed', error.message); return null; }
      return supabase.storage.from('package-images').getPublicUrl(data.path).data.publicUrl;
    } catch (e: any) {
      Alert.alert('Upload Error', e.message); return null;
    } finally { setImageUploading(false); }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    const name = mode === 'package' ? pkgForm.name : itemForm.name;
    if (!name.trim()) e.name = 'Name is required';
    if (mode === 'package') {
      if (!pkgForm.pricePerPerson && !pkgForm.price) e.price = 'Enter a price';
      if (pkgForm.pricePerPerson && isNaN(Number(pkgForm.pricePerPerson))) e.pricePerPerson = 'Invalid';
      if (pkgForm.price && isNaN(Number(pkgForm.price))) e.price = 'Invalid';
    } else {
      if (!itemForm.price || isNaN(Number(itemForm.price))) e.price = 'Enter a valid price';
    }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    let finalImageUrl: string | null = imageUri;
    if (imageUri && !imageUri.startsWith('http')) {
      finalImageUrl = await uploadImage(imageUri);
    }

    let payload: any;
    if (mode === 'package') {
      const perPerson = pkgForm.pricePerPerson ? parseFloat(pkgForm.pricePerPerson) : null;
      payload = {
        vendor_id: user?.id, item_type: 'package',
        name: pkgForm.name.trim(), description: pkgForm.description.trim() || null,
        price: perPerson ? 0 : parseFloat(pkgForm.price),
        price_per_person: perPerson,
        min_guests: pkgForm.minGuests ? parseInt(pkgForm.minGuests) : null,
        max_guests: pkgForm.maxGuests ? parseInt(pkgForm.maxGuests) : null,
        image_url: finalImageUrl,
      };
    } else {
      payload = {
        vendor_id: user?.id, item_type: 'item',
        name: itemForm.name.trim(), description: itemForm.description.trim() || null,
        price: parseFloat(itemForm.price), price_per_person: null,
        min_guests: itemForm.minGuests ? parseInt(itemForm.minGuests) : null, 
        max_guests: itemForm.maxGuests ? parseInt(itemForm.maxGuests) : null, 
        image_url: finalImageUrl,
      };
    }

    let error: any;
    if (editingId) ({ error } = await supabase.from('packages').update(payload).eq('id', editingId));
    else           ({ error } = await supabase.from('packages').insert(payload));
    setSaving(false);

    if (error) Alert.alert('Error', error.message);
    else { setFormModal(false); fetchPackages(); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const doDelete = async () => {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) Alert.alert('Error', error.message);
      else fetchPackages();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this item? This cannot be undone.')) doDelete();
    } else {
      Alert.alert('Delete', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const toggleAvail = async (id: string, cur: boolean) => {
    await supabase.from('packages').update({ is_available: !cur }).eq('id', id);
    fetchPackages();
  };

  // ── Render card ───────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Package }) => (
    <View style={styles.card}>
      {item.image_url && <Image source={{ uri: item.image_url }} style={styles.cardImg} resizeMode="contain" />}
      <View style={{ padding: Spacing.md }}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: item.item_type === 'package' ? Colors.primaryMuted : '#1a3a2a' }]}>
            <Text style={[styles.typeBadgeTxt, { color: item.item_type === 'package' ? Colors.primary : '#4ade80' }]}>
              {item.item_type === 'package' ? '📦 Package' : '🍽️ Item'}
            </Text>
          </View>
          <Switch value={item.is_available} onValueChange={() => toggleAvail(item.id, item.is_available)}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.primaryMuted }}
            thumbColor={item.is_available ? Colors.primary : Colors.textMuted} />
        </View>

        <Text style={styles.cardName}>{item.name}</Text>
        {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}

        <View style={styles.priceRow}>
          {item.price_per_person ? (
            <Text style={styles.cardPrice}>৳{item.price_per_person.toLocaleString()}<Text style={styles.perPerson}>/person</Text></Text>
          ) : (
            <Text style={styles.cardPrice}>৳{item.price.toLocaleString()}<Text style={styles.perPerson}> flat</Text></Text>
          )}
          {(item.min_guests || item.max_guests) && (
            <View style={styles.guestBadge}>
              <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.guestTxt}>{item.min_guests}–{item.max_guests} guests</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
            <Text style={styles.editTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={15} color={Colors.danger} />
            <Text style={styles.deleteTxt}>Delete</Text>
          </TouchableOpacity>
          <View style={[styles.availTag, { backgroundColor: item.is_available ? Colors.successMuted : Colors.dangerMuted }]}>
            <Text style={{ color: item.is_available ? Colors.success : Colors.danger, fontSize: FontSize.xs, fontWeight: FontWeight.medium }}>
              {item.is_available ? 'Active' : 'Hidden'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ── Image picker UI ───────────────────────────────────────────────────────
  const ImagePickerField = () => (
    <>
      <Text style={styles.fieldLabel}>Photo (optional)</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={showImagePicker} activeOpacity={0.8}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.imageOverlayTxt}>Change</Text>
            </View>
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.imagePlaceholderTxt}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>
      {imageUploading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginBottom: Spacing.sm }} />}
    </>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Menu & Packages</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setTypeModal(true)}>
            <Ionicons name="add" size={22} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
        ) : packages.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="fast-food-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nothing added yet</Text>
            <Button label="Add Package or Item" onPress={() => setTypeModal(true)} style={{ marginTop: Spacing.md }} />
          </View>
        ) : (
          <FlatList data={packages} keyExtractor={p => p.id} renderItem={renderItem}
            contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />} />
        )}
      </View>

      {/* ── Type chooser modal ── */}
      <Modal visible={typeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setTypeModal(false)}>
          <View style={styles.typeSheet}>
            <Text style={styles.typeTitle}>What would you like to add?</Text>
            <TouchableOpacity style={styles.typeOption} onPress={() => openAdd('package')} activeOpacity={0.8}>
              <View style={[styles.typeIcon, { backgroundColor: Colors.primaryMuted }]}>
                <Text style={{ fontSize: 24 }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeOptionTitle}>Package</Text>
                <Text style={styles.typeOptionDesc}>Full event package with per-person or flat pricing, min/max guests</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.typeDivider} />

            <TouchableOpacity style={styles.typeOption} onPress={() => openAdd('item')} activeOpacity={0.8}>
              <View style={[styles.typeIcon, { backgroundColor: '#1a3a2a' }]}>
                <Text style={{ fontSize: 24 }}>🍽️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeOptionTitle}>Single Item</Text>
                <Text style={styles.typeOptionDesc}>Individual dish or add-on with a flat price</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setTypeModal(false)}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Add/Edit form modal ── */}
      <Modal visible={formModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit' : 'Add'} {mode === 'package' ? '📦 Package' : '🍽️ Single Item'}
              </Text>
              <TouchableOpacity onPress={() => setFormModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ImagePickerField />

            {mode === 'package' ? (
              <>
                <Input label="Package Name *" placeholder="e.g. Premium Wedding Package"
                  value={pkgForm.name} onChangeText={v => pf('name', v)} error={errors.name} leftIcon="fast-food-outline" />
                <Input label="Description" placeholder="What's included..."
                  value={pkgForm.description} onChangeText={v => pf('description', v)} multiline numberOfLines={3} leftIcon="document-text-outline" />
                <View style={styles.pricingBox}>
                  <Text style={styles.pricingTitle}>💰 Pricing (choose one)</Text>
                  <View style={styles.twoCol}>
                    <View style={{ flex: 1 }}>
                      <Input label="Per Person (৳)" placeholder="e.g. 800" value={pkgForm.pricePerPerson}
                        onChangeText={v => { pf('pricePerPerson', v); if (v) pf('price', ''); }}
                        keyboardType="numeric" leftIcon="person-outline" error={errors.pricePerPerson} />
                    </View>
                    <Text style={styles.orTxt}>or</Text>
                    <View style={{ flex: 1 }}>
                      <Input label="Flat Price (৳)" placeholder="e.g. 50000" value={pkgForm.price}
                        onChangeText={v => { pf('price', v); if (v) pf('pricePerPerson', ''); }}
                        keyboardType="numeric" leftIcon="cash-outline" error={errors.price} />
                    </View>
                  </View>
                </View>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}><Input label="Min Guests" placeholder="50" value={pkgForm.minGuests} onChangeText={v => pf('minGuests', v)} keyboardType="numeric" leftIcon="people-outline" /></View>
                  <View style={{ flex: 1 }}><Input label="Max Guests" placeholder="500" value={pkgForm.maxGuests} onChangeText={v => pf('maxGuests', v)} keyboardType="numeric" leftIcon="people-outline" /></View>
                </View>
              </>
            ) : (
              <>
                <Input label="Item Name *" placeholder="e.g. Chicken Roast, Biryani"
                  value={itemForm.name} onChangeText={v => itf('name', v)} error={errors.name} leftIcon="fast-food-outline" />
                <Input label="Description" placeholder="e.g. Half chicken with rice and salad"
                  value={itemForm.description} onChangeText={v => itf('description', v)} multiline numberOfLines={3} leftIcon="document-text-outline" />
                <Input label="Price (৳) *" placeholder="e.g. 350" value={itemForm.price}
                  onChangeText={v => itf('price', v)} keyboardType="numeric" leftIcon="cash-outline" error={errors.price} />
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}><Input label="Min Guests" placeholder="e.g. 10" value={itemForm.minGuests} onChangeText={v => itf('minGuests', v)} keyboardType="numeric" leftIcon="people-outline" /></View>
                  <View style={{ flex: 1 }}><Input label="Max Guests" placeholder="e.g. 100" value={itemForm.maxGuests} onChangeText={v => itf('maxGuests', v)} keyboardType="numeric" leftIcon="people-outline" /></View>
                </View>
              </>
            )}

            <Button label={editingId ? 'Save Changes' : `Add ${mode === 'package' ? 'Package' : 'Item'}`}
              onPress={handleSave} loading={saving || imageUploading} fullWidth size="lg" style={{ marginTop: Spacing.md }} />
            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, width: 42, height: 42, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: Spacing.md, overflow: 'hidden' },
  cardImg: { width: '100%', height: 130 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  typeBadgeTxt: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  cardName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  cardPrice: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  perPerson: { fontSize: FontSize.sm, fontWeight: '400', color: Colors.textMuted },
  guestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  guestTxt: { color: Colors.textMuted, fontSize: FontSize.xs },
  actionRow: { flexDirection: 'row', gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: Spacing.sm, alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editTxt: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteTxt: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  availTag: { marginLeft: 'auto', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },

  // Type chooser
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  typeSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg },
  typeTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
  typeOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  typeIcon: { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  typeOptionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  typeOptionDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  typeDivider: { height: 1, backgroundColor: Colors.surfaceBorder },
  cancelBtn: { marginTop: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelTxt: { color: Colors.textMuted, fontSize: FontSize.md },

  // Form modal
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalContent: { padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  imagePicker: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md, height: 140, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder, borderStyle: 'dashed' },
  imagePreview: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  imageOverlayTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  imagePlaceholderTxt: { color: Colors.textMuted, fontSize: FontSize.sm },
  pricingBox: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.primary, padding: Spacing.md, marginBottom: Spacing.md },
  pricingTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing.sm },
  twoCol: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  orTxt: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 36, fontWeight: FontWeight.medium },
});
