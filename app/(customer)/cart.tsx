import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Modal,
  ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
type TabKey = 'upcoming' | 'past' | 'all';

interface Booking {
  id: string;
  event_date: string;
  guest_count: number;
  event_type: string;
  special_requests: string | null;
  status: BookingStatus;
  total_price: number;
  created_at: string;
  vendors: { business_name: string; id: string } | null;
  packages: { name: string } | null;
  has_review?: boolean;
}

const TABS: { label: string; key: TabKey }[] = [
  { label: 'Upcoming', key: 'upcoming' },
  { label: 'Past', key: 'past' },
  { label: 'All', key: 'all' },
];

export default function CartScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  // Review modal state
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBookings = async () => {
    const { data: bData } = await supabase
      .from('bookings')
      .select('*, vendors(business_name, id), packages(name)')
      .eq('customer_id', user?.id)
      .order('event_date', { ascending: true });

    const { data: rData } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('customer_id', user?.id);

    const reviewed = new Set((rData ?? []).map((r: any) => r.booking_id));
    setReviewedIds(reviewed);
    if (bData) setBookings(bData as Booking[]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchBookings(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchBookings(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const tabData = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    const isUpcoming = b.event_date >= today && ['pending', 'accepted'].includes(b.status);
    return activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
  });

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Booking', 'Cancel this booking request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
          fetchBookings();
        },
      },
    ]);
  };

  const openReview = (booking: Booking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewBooking || !user) return;
    setReviewLoading(true);
    const { error } = await supabase.from('reviews').insert({
      booking_id: reviewBooking.id,
      customer_id: user.id,
      vendor_id: reviewBooking.vendors?.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });
    setReviewLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setReviewModal(false);
      fetchBookings();
      Alert.alert('✅ Review Submitted', 'Thank you for your feedback!');
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const isUpcoming = item.event_date >= today && ['pending', 'accepted'].includes(item.status);
    const canReview = item.status === 'completed' && !reviewedIds.has(item.id);
    const daysUntil = isUpcoming
      ? Math.ceil((new Date(item.event_date).getTime() - Date.now()) / 86400000)
      : null;

    return (
      <View style={styles.card}>
        {/* Status bar accent */}
        <View style={[styles.cardAccent, {
          backgroundColor:
            item.status === 'accepted' ? Colors.success :
            item.status === 'pending' ? Colors.warning :
            item.status === 'completed' ? Colors.info :
            Colors.danger
        }]} />

        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{item.vendors?.business_name ?? '—'}</Text>
              <Text style={styles.pkgName}>{item.packages?.name ?? '—'}</Text>
            </View>
            <Badge label={item.status} variant={item.status as any} />
          </View>

          {/* Countdown for upcoming */}
          {daysUntil !== null && (
            <View style={styles.countdownBadge}>
              <Ionicons name="time-outline" size={13} color={Colors.primary} />
              <Text style={styles.countdownTxt}>
                {daysUntil === 0 ? 'Today!' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`}
              </Text>
            </View>
          )}

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={13} color={Colors.primary} />
              <Text style={styles.detailTxt}>{item.event_date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={13} color={Colors.primary} />
              <Text style={styles.detailTxt}>{item.guest_count} guests</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={13} color={Colors.primary} />
              <Text style={styles.detailTxt}>{item.event_type}</Text>
            </View>
          </View>

          {item.special_requests && (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Note:</Text>
              <Text style={styles.noteTxt}>{item.special_requests}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.price}>৳{item.total_price?.toLocaleString()}</Text>
            <View style={styles.actions}>
              {item.status === 'pending' && (
                <Button label="Cancel" variant="danger" size="sm" onPress={() => handleCancel(item.id)} />
              )}
              {canReview && (
                <Button label="Leave Review" variant="ghost" size="sm" onPress={() => openReview(item)} />
              )}
              {reviewedIds.has(item.id) && (
                <View style={styles.reviewedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.reviewedTxt}>Reviewed</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <Text style={styles.screenTitle}>My Bookings</Text>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabTxt, activeTab === tab.key && styles.tabTxtActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
        ) : tabData.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No bookings here</Text>
            <Text style={styles.emptySub}>
              {activeTab === 'upcoming' ? 'Book a caterer to get started!' : 'Your past bookings will appear here.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={tabData}
            keyExtractor={(b) => b.id}
            renderItem={renderBooking}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          />
        )}
      </View>

      {/* Leave Review Modal */}
      <Modal visible={reviewModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReviewModal(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Leave a Review</Text>
            <TouchableOpacity onPress={() => setReviewModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalVendor}>{reviewBooking?.vendors?.business_name}</Text>
            <Text style={styles.modalPkg}>{reviewBooking?.packages?.name} · {reviewBooking?.event_date}</Text>

            <Text style={styles.ratingLabel}>Your Rating</Text>
            <View style={styles.starRow}>
              <StarRating rating={reviewRating} size={40} interactive onRate={setReviewRating} />
            </View>
            <Text style={styles.ratingWord}>
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][reviewRating]}
            </Text>

            <Text style={styles.commentLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience with this caterer..."
              placeholderTextColor={Colors.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Button
              label="Submit Review"
              onPress={submitReview}
              loading={reviewLoading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />
            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { flex: 1, backgroundColor: Colors.background },
  screenTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, marginBottom: Spacing.md },
  tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTxtActive: { color: Colors.textInverse },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },

  card: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: Spacing.md, overflow: 'hidden' },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  vendorName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  pkgName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  countdownBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryMuted, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  countdownTxt: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailTxt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  noteBox: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, padding: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.primary },
  noteLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium, marginBottom: 2 },
  noteTxt: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: Spacing.sm },
  price: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  actions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  reviewedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewedTxt: { color: Colors.success, fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  // Review Modal
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  modalBody: { padding: Spacing.lg },
  modalVendor: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  modalPkg: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  ratingLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.md },
  starRow: { alignItems: 'center', marginBottom: Spacing.sm },
  ratingWord: { textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing.lg },
  commentLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  commentInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, minHeight: 120 },
});
