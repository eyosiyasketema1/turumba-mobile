import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = Colors.light;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    // For now, only allow the hardcoded email
    if (email.trim().toLowerCase() !== 'eyosiyasketema@gmail.com') {
      setError('No account found with this email address.');
      return;
    }

    setLoading(true);
    // Simulate sending code
    setTimeout(() => {
      setLoading(false);
      router.push({ pathname: '/verify-code', params: { email: email.trim().toLowerCase() } });
    }, 1200);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          automaticallyAdjustKeyboardInsets
        >
          {/* ─── Hero / Top Section ────────────────────────────────── */}
          <View style={[styles.heroContainer, { paddingTop: insets.top }]}>
            <Image
              source={require('@/assets/images/bg-gradient-1.jpeg')}
              style={styles.heroBgImage}
              resizeMode="stretch"
            />
            {/* Back button */}
            <TouchableOpacity
              style={[styles.backBtn, { top: insets.top + 12 }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
            {/* Logo centered */}
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/logo-light.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ─── Form Card ────────────────────────────────────────── */}
          <View style={styles.formCard}>
            <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter the email address associated with your account and we'll send you a verification code.
            </Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.secondary }]}>
                <Mail size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>

            {/* Send Code Button */}
            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={handleSendCode}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.sendBtnText}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>

            {/* Back to Sign In */}
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={[styles.backToLoginText, { color: colors.mutedForeground }]}>
                Back to{' '}
                <Text style={{ color: colors.primary, fontFamily: 'DMSans_600SemiBold' }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ─── Hero ─────────────────────────────────────────────────────────
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBgImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: { width: 120, height: 120 },

  // ─── Form Card ────────────────────────────────────────────────────
  formCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    marginBottom: 28,
    lineHeight: 22,
  },

  // ─── Fields ───────────────────────────────────────────────────────
  fieldGroup: { marginBottom: 24 },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    padding: 0,
  },

  // ─── Button ───────────────────────────────────────────────────────
  sendBtn: {
    backgroundColor: '#2563eb',
    height: 54,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 16,
  },
  backToLoginText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
});
