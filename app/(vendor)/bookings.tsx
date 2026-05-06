import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

interface Booking {
  id: string;
  event_date: string;
  guest_count: number;
  event_type: string;
  special_requests: string | null;
  status: BookingStatus;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  payment_method: 'cod' | 'online';
  total_price: number;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  packages: { name: string } | null;
}

const TABS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
];

export default function VendorBookingsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | BookingStatus>('all');

  const fetchBookings = async () => {
    if (!user?.id) { setLoading(false); setRefreshing(false); return; }
    const { data } = await supabase
      .from('bookings')
      .select(`*, profiles(full_name, phone), packages(name)`)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setBookings(data as Booking[]);
      applyFilter(data as Booking[], activeTab);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const applyFilter = (data: Booking[], tab: 'all' | BookingStatus) => {
    setFiltered(tab === 'all' ? data : data.filter((b) => b.status === tab));
  };

  useEffect(() => { if (user?.id) fetchBookings(); }, [user?.id]);
  useEffect(() => { applyFilter(bookings, activeTab); }, [activeTab, bookings]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchBookings(); }, [user?.id]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchBookings();
  };

  const confirmReject = (id: string, paymentMethod: string, paymentStatus: string) => {
    const msg = 'Reject this booking?' +
      (paymentMethod === 'online' && paymentStatus === 'paid'
        ? ' The digital payment will be automatically refunded.'
        : '');

    if (Platform.OS === 'web') {
      if (!window.confirm(msg)) return;
      setLoading(true);
      const updates: any = { status: 'rejected' };
      if (paymentMethod === 'online' && paymentStatus === 'paid') updates.payment_status = 'refunded';
      supabase.from('bookings').update(updates).eq('id', id).then(() => {
        fetchBookings();
        setLoading(false);
      });
    } else {
      Alert.alert(t.reject, msg, [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.reject,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const updates: any = { status: 'rejected' };
            if (paymentMethod === 'online' && paymentStatus === 'paid') updates.payment_status = 'refunded';
            const { error } = await supabase.from('bookings').update(updates).eq('id', id);
            if (!error) await fetchBookings();
            setLoading(false);
          },
        },
      ]);
    }
  };

  const confirmAccept = (id: string) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Accept this booking request?')) return;
      updateStatus(id, 'accepted');
    } else {
      Alert.alert(t.accept, 'Accept this booking request?', [
        { text: t.cancel, style: 'cancel' },
        { text: t.accept, onPress: () => updateStatus(id, 'accepted') },
      ]);
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName}>{item.profiles?.full_name ?? 'Customer'}</Text>
          <Text style={styles.pkgName}>{item.packages?.name}</Text>
        </View>
        <Badge label={item.status} variant={item.status as any} />
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
          <Text style={styles.detailText}>{item.event_date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={14} color={Colors.primary} />
          <Text style={styles.detailText}>{item.guest_count} guests</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
          <Text style={styles.detailText}>{item.event_type}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="wallet-outline" size={14} color={Colors.primary} />
          <Text style={styles.detailText}>{item.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</Text>
        </View>
        {item.profiles?.phone && (
          <View style={styles.detailItem}>
            <Ionicons name="call-outline" size={14} color={Colors.primary} />
            <Text style={styles.detailText}>{item.profiles.phone}</Text>
          </View>
        )}
      </View>

      {item.special_requests && (
        <View style={styles.specialRequests}>
          <Text style={styles.specialLabel}>Special Requests:</Text>
          <Text style={styles.specialText}>{item.special_requests}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={styles.price}>৳{item.total_price?.toLocaleString()}</Text>
          {item.payment_status === 'paid' && (
            <Badge label="Paid" variant="success" />
          )}
        </View>
        {item.status === 'pending' && (
          <View style={styles.actions}>
            <Button label={t.reject} variant="danger" size="sm" onPress={() => confirmReject(item.id, item.payment_method, item.payment_status)} />
            <Button label={t.accept} variant="primary" size="sm" onPress={() => confirmAccept(item.id)} />
          </View>
        )}
        {item.status === 'accepted' && (
          <Button label="Mark Complete" variant="secondary" size="sm" onPress={() => updateStatus(item.id, 'completed')} />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <Text style={styles.screenTitle}>{t.bookings}</Text>

        {/* Tab Filter */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, activeTab === tab.value && styles.tabActive]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>{t.noBookingsVendor}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(b) => b.id}
            renderItem={renderBooking}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { marginTop: Spacing.xxl },

  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.textInverse },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  customerName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  pkgName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '45%' },
  detailText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  specialRequests: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  specialLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2, fontWeight: FontWeight.medium },
  specialText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: Spacing.sm },
  price: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
