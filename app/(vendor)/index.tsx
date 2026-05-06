import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import LanguageSwitch from '@/components/ui/LanguageSwitch';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface StatsData {
  total: number; pending: number; accepted: number;
  completed: number; revenue: number;
}
interface RecentBooking {
  id: string; event_date: string; guest_count: number;
  event_type: string; status: string; total_price: number;
  profiles: { full_name: string | null } | null;
  packages: { name: string } | null;
}

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: string; color: string; sub?: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

export default function VendorDashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({ total: 0, pending: 0, accepted: 0, completed: 0, revenue: 0 });
  const [newRequests, setNewRequests] = useState<RecentBooking[]>([]);
  const [upcoming, setUpcoming] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, profiles(full_name), packages(name)')
      .eq('vendor_id', user?.id)
      .order('created_at', { ascending: false });

    if (bookings) {
      const b = bookings as RecentBooking[];
      setStats({
        total: b.length,
        pending: b.filter((x) => x.status === 'pending').length,
        accepted: b.filter((x) => x.status === 'accepted').length,
        completed: b.filter((x) => x.status === 'completed').length,
        revenue: b.filter((x) => ['accepted', 'completed'].includes(x.status))
          .reduce((sum, x) => sum + (x.total_price ?? 0), 0),
      });
      setNewRequests(b.filter((x) => x.status === 'pending').slice(0, 5));
      setUpcoming(b.filter((x) => x.status === 'accepted' && x.event_date >= today)
        .sort((a, b2) => a.event_date.localeCompare(b2.event_date)).slice(0, 5));
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t.hello},</Text>
            <Text style={styles.bizName}>{profile?.full_name?.split(' ')[0] ?? t.foodie} 🍽️</Text>
          </View>
          <View style={styles.headerRight}>
            <LanguageSwitch />
            {stats.pending > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertTxt}>{stats.pending} new</Text>
              </View>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard label={t.totalBookings} value={String(stats.total)} icon="list-outline" color={Colors.info} />
              <StatCard label={t.pendingBookings} value={String(stats.pending)} icon="time-outline" color={Colors.warning} sub={stats.pending > 0 ? 'Needs action' : undefined} />
              <StatCard label={t.confirmedBookings} value={String(stats.accepted)} icon="checkmark-circle-outline" color={Colors.success} />
              <StatCard label={t.totalRevenue} value={`৳${stats.revenue.toLocaleString()}`} icon="cash-outline" color={Colors.primary} sub={`${stats.completed} completed`} />
            </View>

            {/* New Booking Requests */}
            {newRequests.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>🔔 New Requests</Text>
                  <TouchableOpacity onPress={() => router.push('/(vendor)/bookings')}>
                    <Text style={styles.seeAll}>{t.viewAll}</Text>
                  </TouchableOpacity>
                </View>
                {newRequests.map((b) => (
                  <BookingRow key={b.id} booking={b} onPress={() => router.push('/(vendor)/bookings')} />
                ))}
              </>
            )}

            {/* Upcoming Confirmed Events */}
            {upcoming.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
                </View>
                {upcoming.map((b) => (
                  <BookingRow key={b.id} booking={b} onPress={() => router.push('/(vendor)/bookings')} showCountdown today={today} />
                ))}
              </>
            )}

            {stats.total === 0 && (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={60} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>{t.noBookingsVendor}</Text>
                <Text style={styles.emptySub}>Add packages to your menu so customers can book you!</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingRow({ booking: b, onPress, showCountdown, today }: {
  booking: RecentBooking; onPress: () => void; showCountdown?: boolean; today?: string;
}) {
  const daysUntil = showCountdown && today
    ? Math.ceil((new Date(b.event_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <TouchableOpacity style={styles.bookingCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.bookingLeft}>
        <Text style={styles.bookingCustomer}>{b.profiles?.full_name ?? 'Customer'}</Text>
        <Text style={styles.bookingPkg}>{b.packages?.name}</Text>
        <View style={styles.bookingMeta}>
          <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.bookingMetaTxt}>{b.event_date}</Text>
          <Ionicons name="people-outline" size={12} color={Colors.textMuted} style={{ marginLeft: Spacing.sm }} />
          <Text style={styles.bookingMetaTxt}>{b.guest_count} guests</Text>
        </View>
      </View>
      <View style={styles.bookingRight}>
        <Text style={styles.bookingPrice}>৳{b.total_price?.toLocaleString()}</Text>
        {daysUntil !== null && (
          <Text style={styles.countdown}>{daysUntil === 0 ? 'Today!' : `${daysUntil}d`}</Text>
        )}
        {!showCountdown && <Badge label={b.status} variant={b.status as any} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  greeting: { fontSize: FontSize.sm, color: Colors.textMuted },
  bizName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  alertBadge: { backgroundColor: Colors.warning, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  alertTxt: { color: Colors.textInverse, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderLeftWidth: 3, padding: Spacing.md, gap: 4,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  statSub: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.medium },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  seeAll: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  bookingCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: Spacing.md, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  bookingLeft: { flex: 1 },
  bookingCustomer: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  bookingPkg: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  bookingMetaTxt: { fontSize: FontSize.xs, color: Colors.textMuted },
  bookingRight: { alignItems: 'flex-end', gap: Spacing.xs },
  bookingPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  countdown: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
});
