import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;
const CODE_LENGTH = 6;
const CORRECT_CODE = '123456'; // Hardcoded for now

export default function VerifyCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colors = Colors.light;

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (error) setError('');

    // Auto-focus next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleVerify = () => {
    setError('');
    const enteredCode = code.join('');

    if (enteredCode.length < CODE_LENGTH) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    if (enteredCode !== CORRECT_CODE) {
      setError('Invalid verification code. Please try again.');
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push({ pathname: '/reset-password', params: { email } });
    }, 800);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
  };

  // Mask email for display
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '';

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
            <TouchableOpacity
              style={[styles.backBtn, { top: insets.top + 12 }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
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
            <View style={styles.iconRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
                <ShieldCheck size={28} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>Verify Code</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.foreground }}>
                {maskedEmail}
              </Text>
            </Text>

            {/* Code Input Row */}
            <View style={styles.codeRow}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: colors.secondary,
                      color: colors.foreground,
                      borderColor: code[i] ? colors.primary : 'transparent',
                      borderWidth: code[i] ? 2 : 0,
                    },
                  ]}
                  value={code[i]}
                  onChangeText={(text) => handleCodeChange(text, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={i === 0}
                />
              ))}
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
              onPress={handleVerify}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.verifyBtnText}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={[styles.resendLabel, { color: colors.mutedForeground }]}>
                Didn't receive the code?{' '}
              </Text>
              <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.resendLink,
                    { color: resendTimer > 0 ? colors.mutedForeground : colors.primary },
                  ]}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
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

  formCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    marginBottom: 28,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ─── Code inputs ──────────────────────────────────────────────────
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
  },

  errorText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -12,
  },

  // ─── Button ───────────────────────────────────────────────────────
  verifyBtn: {
    backgroundColor: '#2563eb',
    height: 54,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnDisabled: { opacity: 0.6 },
  verifyBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#fff',
  },

  // ─── Resend ───────────────────────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  resendLink: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
});
