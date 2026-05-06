import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StarRating from '@/components/ui/StarRating';
import LocationPicker from '@/components/ui/LocationPicker';
import LanguageSwitch from '@/components/ui/LanguageSwitch';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import VendorMap, { MapVendor } from '@/components/ui/VendorMap';

const CATEGORIES = ['All', 'Wedding', 'Birthday', 'Corporate', 'Home Party', 'Outdoor Event'];

interface Vendor {
  id: string;
  business_name: string;
  description: string | null;
  banner_url: string | null;
  cuisine_types: string[];
  categories: string[];
  rating: number;
  total_reviews: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  min_price?: number;
  max_price?: number;
  packages?: { name: string; description: string | null }[];
}

interface FilterState {
  location: string;
  minRating: number;
  minPrice: string;
  maxPrice: string;
  sortBy: 'rating' | 'price_asc' | 'price_desc' | 'newest';
}

const DEFAULT_FILTER: FilterState = {
  location: '',
  minRating: 0,
  minPrice: '',
  maxPrice: '',
  sortBy: 'rating',
};

export default function CustomerHomeScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filtered, setFiltered] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [mapVisible, setMapVisible] = useState(false);

  const mapVendors: MapVendor[] = vendors
    .filter((v) => v.latitude != null && v.longitude != null)
    .map((v) => ({
      id: v.id,
      name: v.business_name,
      location: v.location ?? '',
      latitude: v.latitude!,
      longitude: v.longitude!,
      rating: v.rating,
    }));

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*, packages(name, description)')
      .eq('is_approved', true)
      .order('rating', { ascending: false });
    if (!error && data) {
      setVendors(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  useEffect(() => {
    let result = [...vendors];

    if (activeCategory !== 'All') {
      result = result.filter((v) => v.categories?.includes(activeCategory));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.business_name.toLowerCase().includes(q) ||
          v.cuisine_types?.some((c) => c.toLowerCase().includes(q)) ||
          v.categories?.some((cat) => cat.toLowerCase().includes(q)) ||
          v.description?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q) ||
          v.packages?.some(
            (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
          )
      );
    }
    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      result = result.filter((v) => v.location?.toLowerCase().includes(loc));
    }
    if (filters.minRating > 0) {
      result = result.filter((v) => (v.rating ?? 0) >= filters.minRating);
    }

    // Sort
    if (filters.sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (filters.sortBy === 'newest') {
      // Already ordered by DB, keep as is
    }

    setFiltered(result);
  }, [search, activeCategory, vendors, filters]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchVendors(); }, []);

  const activeFilterCount = [
    filters.location.trim(),
    filters.minRating > 0,
    filters.minPrice.trim(),
    filters.maxPrice.trim(),
    filters.sortBy !== 'rating',
  ].filter(Boolean).length;

  const applyFilters = () => {
    setFilters(pendingFilters);
    setFilterVisible(false);
  };

  const resetFilters = () => {
    setPendingFilters(DEFAULT_FILTER);
    setFilters(DEFAULT_FILTER);
    setFilterVisible(false);
  };



  const featured = vendors.filter((v) => v.rating >= 4.5).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t.hello},</Text>
            <Text style={styles.name}>{profile?.full_name?.split(' ')[0] ?? t.foodie} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <LanguageSwitch />
            <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={44} />
          </View>
        </View>

        {/* Search + Filter + Map Row */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { flex: 1 }]}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Map View button */}
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => setMapVisible(true)}
          >
            <Ionicons name="map-outline" size={20} color={Colors.textInverse} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={() => { setPendingFilters(filters); setFilterVisible(true); }}
          >
            <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? Colors.textInverse : Colors.text} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Map Modal */}
        <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
          <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <View style={styles.mapModalHeader}>
              <View>
                <Text style={styles.mapModalTitle}>Caterer Map View</Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>All vendors across Dhaka</Text>
              </View>
              <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.mapModalClose}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, margin: Spacing.md }}>
              <VendorMap
                vendors={mapVendors}
                onVendorPress={(id: string) => {
                  setMapVisible(false);
                  router.push(`/(customer)/caterer/${id}`);
                }}
              />
            </View>
            <View style={styles.mapHint}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.mapHintText}>
                {mapVendors.length} caterers shown · Tap a pin then "View Caterer"
              </Text>
            </View>
          </View>
        </Modal>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Section */}
        {featured.length > 0 && activeCategory === 'All' && !search && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.topRated}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
              {featured.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={styles.featuredCard}
                  onPress={() => router.push(`/(customer)/caterer/${v.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.featuredBanner}>
                    {v.banner_url ? (
                      <Image source={{ uri: v.banner_url }} style={styles.featuredBannerImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.featuredBannerPlaceholder}>
                        <Ionicons name="restaurant" size={28} color={Colors.primary} />
                      </View>
                    )}
                    <View style={styles.featuredRating}>
                      <Ionicons name="star" size={11} color={Colors.primary} />
                      <Text style={styles.featuredRatingText}>{v.rating?.toFixed(1)}</Text>
                    </View>
                  </View>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName} numberOfLines={1}>{v.business_name}</Text>
                    <Text style={styles.featuredCuisine} numberOfLines={1}>
                      {v.cuisine_types?.slice(0, 2).join(' · ') ?? ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* All Vendors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'All' ? t.allCaterers : activeCategory}
          </Text>
          <Text style={styles.sectionCount}>{filtered.length} {t.found}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{t.noCaterersFound}</Text>
            <Text style={styles.emptySubText}>{t.tryAdjusting}</Text>
            {activeFilterCount > 0 && (
              <Button label={t.clearFilters} variant="ghost" size="sm" onPress={resetFilters} style={{ marginTop: Spacing.md }} />
            )}
          </View>
        ) : (
          filtered.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onPress={() => router.push(`/(customer)/caterer/${vendor.id}`)}
            />
          ))
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterVisible(false)}>
        <SafeAreaView style={styles.filterModal} edges={['top']}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>{t.filterAndSort}</Text>
            <TouchableOpacity onPress={() => setFilterVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterBody} contentContainerStyle={{ padding: Spacing.lg }}>
            {/* Sort */}
            <Text style={styles.filterLabel}>{t.sortBy}</Text>
            <View style={styles.pillRow}>
              {[
                { label: t.topRatedSort, value: 'rating' },
                { label: t.newest, value: 'newest' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.filterPill, pendingFilters.sortBy === s.value && styles.filterPillActive]}
                  onPress={() => setPendingFilters({ ...pendingFilters, sortBy: s.value as any })}
                >
                  <Text style={[styles.filterPillText, pendingFilters.sortBy === s.value && styles.filterPillTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location */}
            <Text style={styles.filterLabel}>{t.location}</Text>
            <LocationPicker
              placeholder="e.g. Dhaka, Gulshan..."
              value={pendingFilters.location}
              onChange={(v) => setPendingFilters({ ...pendingFilters, location: v })}
            />

            {/* Minimum Rating */}
            <Text style={styles.filterLabel}>{t.minimumRating}</Text>
            <View style={styles.ratingRow}>
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.ratingBtn, pendingFilters.minRating === r && styles.ratingBtnActive]}
                  onPress={() => setPendingFilters({ ...pendingFilters, minRating: r })}
                >
                  <Text style={[styles.ratingBtnText, pendingFilters.minRating === r && styles.ratingBtnTextActive]}>
                    {r === 0 ? t.any : `${r}★+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <Button label={t.reset} variant="secondary" onPress={resetFilters} style={{ flex: 1 }} />
            <Button label={t.applyFilters} onPress={applyFilters} style={{ flex: 2 }} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.vendorCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.bannerContainer}>
        {vendor.banner_url ? (
          <Image source={{ uri: vendor.banner_url }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="restaurant" size={36} color={Colors.primary} />
          </View>
        )}
        <View style={styles.ratingOverlay}>
          <Ionicons name="star" size={12} color={Colors.primary} />
          <Text style={styles.ratingText}>{vendor.rating?.toFixed(1) ?? '5.0'}</Text>
          <Text style={styles.reviewCount}>({vendor.total_reviews ?? 0})</Text>
        </View>
      </View>

      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{vendor.business_name}</Text>
        <View style={styles.vendorMetaRow}>
          {vendor.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{vendor.location}</Text>
            </View>
          )}
        </View>
        <View style={styles.tagRow}>
          {vendor.cuisine_types?.slice(0, 3).map((c) => (
            <View key={c} style={styles.tag}>
              <Text style={styles.tagText}>{c}</Text>
            </View>
          ))}
          {vendor.categories?.slice(0, 2).map((c) => (
            <View key={c} style={[styles.tag, styles.catTag]}>
              <Text style={[styles.tagText, styles.catTagText]}>{c}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  greeting: { fontSize: FontSize.sm, color: Colors.textMuted },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    height: 50,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapBtn: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold },

  categoryRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.md },
  catPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  catTextActive: { color: Colors.textInverse },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  sectionCount: { color: Colors.textMuted, fontSize: FontSize.sm },

  // Featured
  featuredRow: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md },
  featuredCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  featuredBanner: { height: 110, position: 'relative' },
  featuredBannerImg: { width: '100%', height: '100%' },
  featuredBannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredRating: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  featuredRatingText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  featuredInfo: { padding: Spacing.sm },
  featuredName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  featuredCuisine: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  loader: { marginTop: Spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Vendor card
  vendorCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  bannerContainer: { position: 'relative', height: 155 },
  banner: { width: '100%', height: '100%' },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  ratingText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  reviewCount: { color: Colors.textMuted, fontSize: FontSize.xs },
  vendorInfo: { padding: Spacing.md },
  vendorName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  vendorMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: Colors.textMuted, fontSize: FontSize.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag: { backgroundColor: Colors.primaryMuted, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  tagText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  catTag: { backgroundColor: Colors.surfaceElevated },
  catTagText: { color: Colors.textSecondary },

  // Filter Modal
  filterModal: { flex: 1, backgroundColor: Colors.background },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  filterTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  filterBody: { flex: 1 },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  filterPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  filterPillText: { color: Colors.textMuted, fontSize: FontSize.sm },
  filterPillTextActive: { color: Colors.primary, fontWeight: FontWeight.medium },
  ratingRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.md },
  ratingBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  ratingBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  ratingBtnText: { color: Colors.textMuted, fontSize: FontSize.sm },
  ratingBtnTextActive: { color: Colors.primary, fontWeight: FontWeight.medium },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },

  // Map Modal
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  mapModalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  mapModalClose: {
    padding: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
  },
  mapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    justifyContent: 'center',
  },
  mapHintText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
