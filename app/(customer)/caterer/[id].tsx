import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/hooks/useCart';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface Package {
  id: string; name: string; description: string | null;
  price: number; price_per_person: number | null;
  min_guests: number | null; max_guests: number | null;
  image_url: string | null; is_available: boolean;
}
interface Vendor {
  id: string; business_name: string; description: string | null;
  banner_url: string | null; photo_urls: string[];
  cuisine_types: string[]; categories: string[];
  rating: number; total_reviews: number; location: string | null;
}
interface Review {
  id: string; rating: number; comment: string | null; created_at: string;
  profiles: { full_name: string | null } | null;
}

export default function CatererDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setItem } = useCartStore();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [{ data: v }, { data: p }, { data: r }] = await Promise.all([
        supabase.from('vendors').select('*').eq('id', id).single(),
        supabase.from('packages').select('*').eq('vendor_id', id).eq('is_available', true).order('price'),
        supabase.from('reviews').select('*, profiles(full_name)').eq('vendor_id', id)
          .order('created_at', { ascending: false }).limit(20),
      ]);
      if (v) setVendor(v);
      if (p) setPackages(p);
      if (r) setReviews(r as Review[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleBook = (pkg: Package) => {
    if (!vendor) return;
    setItem({
      packageId: pkg.id, packageName: pkg.name, packageDescription: pkg.description,
      vendorId: vendor.id, vendorName: vendor.business_name,
      price: pkg.price, pricePerPerson: pkg.price_per_person ?? null,
      minGuests: pkg.min_guests ?? 1, maxGuests: pkg.max_guests ?? 1000,
    });
    router.push('/(customer)/checkout');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!vendor) return <View style={styles.center}><Text style={styles.errText}>Not found</Text></View>;

  const allPhotos = [...(vendor.banner_url ? [vendor.banner_url] : []), ...(vendor.photo_urls ?? [])];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <View style={{ height: 240, position: 'relative' }}>
          {allPhotos.length > 0 ? (
            <>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) =>
                  setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))
                }>
                {allPhotos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={{ width: 390, height: 240 }} resizeMode="cover" />
                ))}
              </ScrollView>
              {allPhotos.length > 1 && (
                <View style={styles.dotRow}>
                  {allPhotos.map((_, i) => (
                    <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.bannerPlaceholder, { height: 240 }]}>
              <Ionicons name="restaurant" size={64} color={Colors.primary} />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: Spacing.lg }}>
          {/* Vendor info */}
          <Text style={styles.biz}>{vendor.business_name}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={vendor.rating ?? 0} size={16} />
            <Text style={styles.ratingVal}>{vendor.rating?.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({vendor.total_reviews} reviews)</Text>
          </View>
          {vendor.location && (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.meta}>{vendor.location}</Text>
            </View>
          )}
          {vendor.description && <Text style={styles.desc}>{vendor.description}</Text>}
          <View style={styles.tagRow}>
            {vendor.cuisine_types?.map((c) => (
              <View key={c} style={styles.tag}><Text style={styles.tagTxt}>{c}</Text></View>
            ))}
            {vendor.categories?.map((c) => (
              <View key={c} style={styles.catTag}><Text style={styles.catTxt}>{c}</Text></View>
            ))}
          </View>

          {/* Packages */}
          <Text style={styles.section}>Menu & Packages</Text>
          {packages.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="fast-food-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTxt}>No packages listed yet</Text>
            </View>
          ) : packages.map((pkg) => (
            <View key={pkg.id} style={styles.pkgCard}>
              {pkg.image_url && <Image source={{ uri: pkg.image_url }} style={styles.pkgImg} resizeMode="cover" />}
              <View style={{ padding: Spacing.md }}>
                <Text style={styles.pkgName}>{pkg.name}</Text>
                {pkg.description && <Text style={styles.pkgDesc}>{pkg.description}</Text>}
                <View style={styles.row}>
                  {pkg.min_guests && pkg.max_guests && (
                    <>
                      <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
                      <Text style={styles.metaSm}>{pkg.min_guests}–{pkg.max_guests} guests</Text>
                    </>
                  )}
                </View>
                <View style={styles.pkgFooter}>
                  <View>
                    <Text style={styles.pkgPrice}>
                      {pkg.price_per_person
                        ? `৳${pkg.price_per_person.toLocaleString()}/person`
                        : `৳${pkg.price.toLocaleString()} flat`}
                    </Text>
                    {pkg.price_per_person && pkg.min_guests && (
                      <Text style={styles.pkgNote}>Min. ৳{(pkg.price_per_person * pkg.min_guests).toLocaleString()}</Text>
                    )}
                  </View>
                  <Button label="Book Now" onPress={() => handleBook(pkg)} size="sm" />
                </View>
              </View>
            </View>
          ))}

          {/* Reviews */}
          <Text style={styles.section}>Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}</Text>
          {reviews.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTxt}>No reviews yet — be the first!</Text>
            </View>
          ) : reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{(r.profiles?.full_name?.[0] ?? '?').toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewer}>{r.profiles?.full_name ?? 'Customer'}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <StarRating rating={r.rating} size={13} />
              </View>
              {r.comment && <Text style={styles.reviewTxt}>{r.comment}</Text>}
            </View>
          ))}

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  errText: { color: Colors.textMuted, fontSize: FontSize.lg },
  bannerPlaceholder: { backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  dotRow: { position: 'absolute', bottom: Spacing.sm, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.primary, width: 16 },
  backBtn: { position: 'absolute', top: Spacing.md, left: Spacing.md, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.full, padding: Spacing.sm },
  biz: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  ratingVal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  ratingCount: { fontSize: FontSize.sm, color: Colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs },
  meta: { color: Colors.textSecondary, fontSize: FontSize.sm },
  metaSm: { color: Colors.textMuted, fontSize: FontSize.xs },
  desc: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22, marginVertical: Spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  tag: { backgroundColor: Colors.primaryMuted, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  tagTxt: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  catTag: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  catTxt: { color: Colors.textSecondary, fontSize: FontSize.xs },
  section: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyTxt: { color: Colors.textMuted, fontSize: FontSize.md },
  pkgCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: Spacing.md, overflow: 'hidden' },
  pkgImg: { width: '100%', height: 130 },
  pkgName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 4 },
  pkgDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  pkgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  pkgPrice: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  pkgNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  reviewer: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  reviewDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  reviewTxt: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
