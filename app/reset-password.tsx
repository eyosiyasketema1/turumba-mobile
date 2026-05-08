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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colors = Colors.light;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const allValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  const handleReset = () => {
    setError('');

    if (!password.trim()) {
      setError('Please enter a new password.');
      return;
    }
    if (!allValid) {
      setError('Please make sure all password requirements are met.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  const handleGoToLogin = () => {
    // Navigate back to login, clearing the stack
    router.replace('/login');
  };

  // ─── Success State ─────────────────────────────────────────────────
  if (success) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.heroContainer, { paddingTop: insets.top }]}>
          <Image
            source={require('@/assets/images/bg-gradient-1.jpeg')}
            style={styles.heroBgImage}
            resizeMode="stretch"
          />
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/logo-light.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={[styles.formCard, styles.successCard]}>
          <View style={styles.successIconWrap}>
            <CheckCircle size={64} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.foreground, textAlign: 'center' }]}>
            Password Reset!
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign: 'center' }]}>
            Your password has been successfully reset. You can now sign in with your new password.
          </Text>
          <TouchableOpacity
            style={[styles.resetBtn, { marginTop: 16, width: '100%' }]}
            onPress={handleGoToLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.resetBtnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Form State ────────────────────────────────────────────────────
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
          {/* ─── Hero ────────────────────────────────────────────── */}
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
            <Text style={[styles.title, { color: colors.foreground }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Create a strong new password for your account.
            </Text>

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>New Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.secondary }]}>
                <Lock size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Confirm Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.secondary }]}>
                <Lock size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); if (error) setError(''); }}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  {showConfirm ? (
                    <EyeOff size={18} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.reqContainer}>
              <RequirementRow label="At least 8 characters" met={hasMinLength} colors={colors} />
              <RequirementRow label="One uppercase letter" met={hasUppercase} colors={colors} />
              <RequirementRow label="One number" met={hasNumber} colors={colors} />
              <RequirementRow label="Passwords match" met={passwordsMatch} colors={colors} />
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetBtn, (!allValid || loading) && styles.resetBtnDisabled]}
              onPress={handleReset}
              activeOpacity={0.8}
              disabled={!allValid || loading}
            >
              <Text style={styles.resetBtnText}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Requirement Row Component ──────────────────────────────────────
function RequirementRow({
  label,
  met,
  colors,
}: {
  label: string;
  met: boolean;
  colors: typeof Colors.light;
}) {
  return (
    <View style={reqStyles.row}>
      <View
        style={[
          reqStyles.dot,
          { backgroundColor: met ? colors.success : colors.border },
        ]}
      />
      <Text
        style={[
          reqStyles.text,
          { color: met ? colors.success : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  text: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
});

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
    paddingTop: 36,
    paddingBottom: 40,
  },
  successCard: {
    alignItems: 'center',
  },
  successIconWrap: {
    marginBottom: 20,
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

  fieldGroup: { marginBottom: 20 },
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
  eyeBtn: {
    padding: 6,
    marginLeft: 8,
  },

  reqContainer: {
    marginBottom: 24,
    paddingLeft: 4,
  },
  errorText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 16,
  },

  resetBtn: {
    backgroundColor: '#2563eb',
    height: 54,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnDisabled: { opacity: 0.5 },
  resetBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
