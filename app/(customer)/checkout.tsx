import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/hooks/useCart';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Home Party', 'Outdoor Event', 'Other'];

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { item, clearItem } = useCartStore();
  const router = useRouter();

  const [eventDate, setEventDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  const [guestCount, setGuestCount] = useState('');
  const [eventType, setEventType] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic total price calculation
  const guests = parseInt(guestCount) || 0;
  const totalPrice = item
    ? item.pricePerPerson
      ? item.pricePerPerson * Math.max(guests, item.minGuests)
      : item.price
    : 0;

  const isPerPerson = !!item?.pricePerPerson;

  if (!item) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={60} color={Colors.textMuted} />
          <Text style={styles.emptyTxt}>No package selected</Text>
          <Button label="Browse Caterers" onPress={() => router.replace('/(customer)')} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!eventDate.trim()) e.eventDate = 'Event date is required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) e.eventDate = 'Use format YYYY-MM-DD';
    else {
      const d = new Date(eventDate);
      if (d <= new Date()) e.eventDate = 'Date must be in the future';
    }
    if (!guestCount || isNaN(parseInt(guestCount))) e.guestCount = 'Enter number of guests';
    else {
      const g = parseInt(guestCount);
      if (g < item.minGuests) e.guestCount = `Minimum ${item.minGuests} guests required`;
      if (item.maxGuests && g > item.maxGuests) e.guestCount = `Maximum ${item.maxGuests} guests`;
    }
    if (!eventType) e.eventType = 'Select an event type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateObj;
    setShowDatePicker(Platform.OS === 'ios');
    setDateObj(currentDate);
    
    // Format to YYYY-MM-DD
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    setEventDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleConfirm = async () => {
    if (!validate() || !user) return;
    setLoading(true);
    const { data, error } = await supabase.from('bookings').insert({
      customer_id: user.id,
      vendor_id: item.vendorId,
      package_id: item.packageId,
      event_date: eventDate,
      guest_count: parseInt(guestCount),
      event_type: eventType,
      special_requests: specialRequests.trim() || null,
      total_price: totalPrice,
      payment_method: paymentMethod,
      status: 'pending',
    }).select('id').single();

    setLoading(false);
    if (error) {
      Alert.alert('Booking Failed', error.message);
    } else if (data) {
      clearItem();
      if (paymentMethod === 'online') {
        // Navigate directly to payment screen for prepaid
        router.replace(`/(customer)/payment/${data.id}?amount=${totalPrice}` as any);
      } else {
        // COD goes straight to cart
        if (Platform.OS === 'web') {
          window.alert('Booking Confirmed! You can pay in cash upon delivery.');
          router.replace('/(customer)/cart');
        } else {
          Alert.alert(
            '🎉 Booking Sent!',
            'Your booking has been placed. You can pay in cash upon delivery.',
            [{ text: 'View My Bookings', onPress: () => router.replace('/(customer)/cart') }]
          );
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Booking</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Package Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>📦 Package Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package</Text>
              <Text style={styles.summaryVal}>{item.packageName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Caterer</Text>
              <Text style={styles.summaryVal}>{item.vendorName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pricing</Text>
              <Text style={styles.summaryVal}>
                {isPerPerson
                  ? `৳${item.pricePerPerson?.toLocaleString()} / person`
                  : `৳${item.price.toLocaleString()} flat`}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Guests range</Text>
              <Text style={styles.summaryVal}>{item.minGuests}–{item.maxGuests}</Text>
            </View>
            {item.packageDescription && (
              <>
                <View style={styles.divider} />
                <Text style={styles.pkgDesc}>{item.packageDescription}</Text>
              </>
            )}
          </View>

          {/* Event Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Event Details</Text>

            {Platform.OS === 'web' ? (
              <Input
                label="Event Date"
                placeholder="YYYY-MM-DD"
                value={eventDate}
                onChangeText={setEventDate}
                leftIcon="calendar-outline"
                error={errors.eventDate}
                isDate
              />
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                  <View pointerEvents="none">
                    <Input
                      label="Event Date"
                      placeholder="Select Date"
                      value={eventDate}
                      onChangeText={setEventDate}
                      leftIcon="calendar-outline"
                      error={errors.eventDate}
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={dateObj}
                    mode="date"
                    is24Hour={true}
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </>
            )}

            <Input
              label={isPerPerson ? `Number of Guests (min ${item.minGuests})` : 'Number of Guests'}
              placeholder={`${item.minGuests}–${item.maxGuests}`}
              value={guestCount}
              onChangeText={setGuestCount}
              keyboardType="numeric"
              leftIcon="people-outline"
              error={errors.guestCount}
            />

            {/* Event Type */}
            <Text style={styles.fieldLabel}>Event Type</Text>
            {errors.eventType && <Text style={styles.fieldError}>{errors.eventType}</Text>}
            <View style={styles.pillRow}>
              {EVENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, eventType === t && styles.pillActive]}
                  onPress={() => setEventType(t)}
                >
                  <Text style={[styles.pillTxt, eventType === t && styles.pillTxtActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Special Requests (optional)"
              placeholder="Dietary needs, table setup, décor preferences..."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={4}
              leftIcon="chatbubble-outline"
            />

            {/* Payment Method */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.sm }]}>Payment Method</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[styles.paymentBtn, paymentMethod === 'cod' && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod('cod')}
              >
                <Ionicons name="cash-outline" size={20} color={paymentMethod === 'cod' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.paymentBtnTxt, paymentMethod === 'cod' && styles.paymentBtnTxtActive]}>Cash on Delivery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentBtn, paymentMethod === 'online' && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod('online')}
              >
                <Ionicons name="card-outline" size={20} color={paymentMethod === 'online' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.paymentBtnTxt, paymentMethod === 'online' && styles.paymentBtnTxtActive]}>Pay Online</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.paymentHint}>
              {paymentMethod === 'cod' 
                ? 'Pay the caterer directly in cash on the day of the event.' 
                : 'Prepay securely online. If the caterer rejects, you will be automatically refunded.'}
            </Text>
          </View>

          {/* Live Price Calculation */}
          <View style={styles.totalCard}>
            <Text style={styles.totalHeading}>💰 Total Cost</Text>
            {isPerPerson && guests > 0 ? (
              <View style={styles.calcRow}>
                <Text style={styles.calcStep}>
                  ৳{item.pricePerPerson?.toLocaleString()} × {Math.max(guests, item.minGuests)} guests
                </Text>
                <Text style={styles.totalAmt}>= ৳{totalPrice.toLocaleString()}</Text>
              </View>
            ) : isPerPerson ? (
              <Text style={styles.totalHint}>Enter guest count to calculate total</Text>
            ) : (
              <Text style={styles.totalAmt}>৳{totalPrice.toLocaleString()}</Text>
            )}
            <Text style={styles.totalNote}>* Payment terms discussed with caterer</Text>
          </View>

          <Button
            label={`Confirm Booking${totalPrice > 0 ? ` — ৳${totalPrice.toLocaleString()}` : ''}`}
            onPress={handleConfirm}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.confirmBtn}
          />

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyTxt: { color: Colors.textMuted, fontSize: FontSize.lg, marginTop: Spacing.md, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  summaryHeading: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing.xs },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
  summaryVal: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text, flex: 2, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.xs },
  pkgDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: Spacing.xs },
  form: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  formTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  fieldError: { color: Colors.danger, fontSize: FontSize.xs, marginBottom: Spacing.xs },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  pill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  pillTxt: { color: Colors.textMuted, fontSize: FontSize.sm },
  pillTxtActive: { color: Colors.primary, fontWeight: FontWeight.medium },
  methodRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs },
  paymentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  paymentBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  paymentBtnTxt: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  paymentBtnTxtActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  paymentHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs, fontStyle: 'italic' },
  totalCard: {
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.primary,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  totalHeading: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing.sm },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcStep: { fontSize: FontSize.md, color: Colors.textSecondary },
  totalAmt: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  totalHint: { fontSize: FontSize.md, color: Colors.textMuted, fontStyle: 'italic' },
  totalNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  confirmBtn: { marginBottom: Spacing.sm },
});
