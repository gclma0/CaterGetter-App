import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import LanguageSwitch from '@/components/ui/LanguageSwitch';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';

export default function LandingScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [apkUrl, setApkUrl] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setApkUrl(`${window.location.origin}/CaterGetter.apk`);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>

        {/* Language Switch top-right */}
        <View style={styles.langRow}>
          <LanguageSwitch />
        </View>

        {/* Top Section - Logo / Hero */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.title}>
            {t.welcomeTo} <Text style={styles.highlight}>CaterGetter</Text>
          </Text>
          <Text style={styles.subtitle}>{t.appTagline}</Text>
        </View>

        {/* Auth Buttons */}
        <View style={styles.actionSection}>
          <Button
            label={t.signIn}
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            size="lg"
            style={styles.btn}
          />
          <Button
            label={t.signUp}
            variant="secondary"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
            size="lg"
            style={styles.btn}
          />
        </View>

        {/* Bottom Section - Download App */}
        <View style={styles.downloadSection}>
          <Text style={styles.downloadText}>{t.getBestExperience}</Text>
          <Button
            label={t.downloadForAndroid}
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

          {apkUrl ? (
            <View style={styles.qrContainer}>
              <Text style={styles.qrText}>{t.scanToDownload}</Text>
              <View style={styles.qrWrapper}>
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(apkUrl)}` }}
                  style={{ width: 120, height: 120 }}
                />
              </View>
            </View>
          ) : null}
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
  langRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
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
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  qrText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  qrWrapper: {
    backgroundColor: Colors.white,
    padding: Spacing.xs,
    borderRadius: Radius.sm,
  }
});
