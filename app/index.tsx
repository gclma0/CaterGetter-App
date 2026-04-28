import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>
        
        {/* Top Section - Logo / Hero */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.title}>
            Welcome to <Text style={styles.highlight}>CaterGetter</Text>
          </Text>
          <Text style={styles.subtitle}>
            Planned an event but wondering about cater? Get the caters of your choice here!
          </Text>
        </View>

        {/* Auth Buttons */}
        <View style={styles.actionSection}>
          <Button 
            label="Sign In" 
            onPress={() => router.push('/(auth)/login')} 
            fullWidth 
            size="lg"
            style={styles.btn}
          />
          <Button 
            label="Sign Up" 
            variant="secondary"
            onPress={() => router.push('/(auth)/register')} 
            fullWidth 
            size="lg"
            style={styles.btn}
          />
        </View>

        {/* Bottom Section - Download App */}
        <View style={styles.downloadSection}>
          <Text style={styles.downloadText}>Get the best experience from the app!</Text>
          <Button 
            label="Download CaterGetter" 
            variant="ghost"
            onPress={() => {
               if (Platform.OS === 'web') {
                 try {
                   const link = document.createElement('a');
                   link.href = '/CaterGetter.apk';
                   link.download = 'CaterGetter.apk';
                   document.body.appendChild(link);
                   link.click();
                   document.body.removeChild(link);
                 } catch(e) {
                   console.log(e);
                 }
               } else {
                 alert('You are already using the best experience!');
               }
            }} 
            style={styles.downloadBtn}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  root: { 
    flex: 1, 
    padding: Spacing.xl, 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.xxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  highlight: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: Spacing.md,
  },
  actionSection: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  btn: {
    marginBottom: Spacing.sm,
  },
  downloadSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    marginBottom: Spacing.md,
  },
  downloadText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    fontWeight: FontWeight.medium,
  },
  downloadBtn: {
    minWidth: 240,
  }
});
