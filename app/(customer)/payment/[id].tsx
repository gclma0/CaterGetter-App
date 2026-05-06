import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export default function PaymentScreen() {
  const { id, amount } = useLocalSearchParams<{ id: string; amount: string }>();
  const router = useRouter();

  const [method, setMethod] = useState<'card' | 'bkash'>('card');
  const [loading, setLoading] = useState(false);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // bKash details
  const [bkashNumber, setBkashNumber] = useState('');

  const handlePay = async () => {
    if (method === 'card') {
      if (cardNumber.length < 16) return Alert.alert('Error', 'Please enter a valid card number');
      if (!expiry || !cvv) return Alert.alert('Error', 'Please fill all card details');
    } else {
      if (bkashNumber.length < 11) return Alert.alert('Error', 'Please enter a valid bKash number');
    }

    setLoading(true);

    // Simulate network delay for realistic feel
    await new Promise((res) => setTimeout(res, 1500));

    // Update the booking status to paid
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', id);

    setLoading(false);

    if (error) {
      Alert.alert('Payment Failed', error.message);
    } else {
      if (Platform.OS === 'web') {
        window.alert('Payment Successful! Your payment has been received.');
        router.replace('/(customer)/cart');
      } else {
        Alert.alert(
          'Payment Successful!',
          'Your payment has been received and the caterer has been notified.',
          [{ text: 'Great', onPress: () => router.replace('/(customer)/cart') }]
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total to Pay</Text>
          <Text style={styles.amountValue}>৳{Number(amount).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <View style={styles.methodRow}>
          <TouchableOpacity
            style={[styles.methodBtn, method === 'card' && styles.methodBtnActive]}
            onPress={() => setMethod('card')}
          >
            <Ionicons name="card-outline" size={24} color={method === 'card' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.methodTxt, method === 'card' && styles.methodTxtActive]}>Credit Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, method === 'bkash' && styles.methodBtnActive]}
            onPress={() => setMethod('bkash')}
          >
            <Ionicons name="phone-portrait-outline" size={24} color={method === 'bkash' ? '#e2136e' : Colors.textMuted} />
            <Text style={[styles.methodTxt, method === 'bkash' && { color: '#e2136e', fontWeight: FontWeight.bold }]}>bKash</Text>
          </TouchableOpacity>
        </View>

        {method === 'card' ? (
          <View style={styles.formBox}>
            <Input
              label="Card Number"
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
              maxLength={16}
              value={cardNumber}
              onChangeText={setCardNumber}
              leftIcon="card-outline"
            />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Input
                  label="Expiry (MM/YY)"
                  placeholder="12/26"
                  maxLength={5}
                  value={expiry}
                  onChangeText={setExpiry}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="CVV"
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.formBox}>
            <Input
              label="bKash Account Number"
              placeholder="017XX XXXXXX"
              keyboardType="phone-pad"
              maxLength={11}
              value={bkashNumber}
              onChangeText={setBkashNumber}
              leftIcon="call-outline"
            />
            <Text style={styles.hint}>A verification code will be sent to your number.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            label={`Pay ৳${Number(amount).toLocaleString()}`}
            onPress={handlePay}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  content: { flex: 1, padding: Spacing.lg },
  amountBox: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  amountLabel: { fontSize: FontSize.md, color: Colors.primary, marginBottom: Spacing.xs, fontWeight: FontWeight.medium },
  amountValue: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Colors.primary },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  methodRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  methodTxt: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.medium },
  methodTxtActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  formBox: { backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
  row: { flexDirection: 'row' },
  hint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  footer: { marginTop: 'auto', paddingTop: Spacing.xl },
});
