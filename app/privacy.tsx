import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Animated,
  LayoutAnimation,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Fingerprint,
  Smartphone,
  Trash2,
  X,
  Check,
  LogOut,
  Monitor,
  Tablet,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

const ACTIVE_SESSIONS = [
  {
    id: '1',
    device: 'iPhone 14 Pro',
    location: 'Addis Ababa, Ethiopia',
    lastActive: 'Now',
    current: true,
    icon: 'phone',
  },
  {
    id: '2',
    device: 'Chrome — MacBook Pro',
    location: 'Addis Ababa, Ethiopia',
    lastActive: '2 hours ago',
    current: false,
    icon: 'monitor',
  },
  {
    id: '3',
    device: 'iPad Air',
    location: 'Nairobi, Kenya',
    lastActive: '3 days ago',
    current: false,
    icon: 'tablet',
  },
];

export default function PrivacyScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Toggle states
  const [biometricLock, setBiometricLock] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  // Change Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Active Sessions
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState(ACTIVE_SESSIONS);

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Toast
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }

  // Password validation & submit
  function handleChangePassword() {
    setPasswordError('');
    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Include at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Include at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current');
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(false);
      setPasswordError('');
      showToast('Password changed successfully');
    }, 1200);
  }

  // Sign out session
  function handleSignOut(sessionId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    showToast('Session signed out');
  }

  // Delete account
  function handleDeleteAccount() {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    showToast('Account deletion requested');
  }

  function getDeviceIcon(type: string) {
    switch (type) {
      case 'phone': return <Smartphone size={18} color={colors.mutedForeground} />;
      case 'monitor': return <Monitor size={18} color={colors.mutedForeground} />;
      case 'tablet': return <Tablet size={18} color={colors.mutedForeground} />;
      default: return <Smartphone size={18} color={colors.mutedForeground} />;
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy & Security</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SECURITY</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            {/* Biometric Lock */}
            <View style={styles.settingRow}>
              <Fingerprint size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Biometric Lock</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Require Face ID or fingerprint to open app</Text>
              </View>
              <Switch
                value={biometricLock}
                onValueChange={setBiometricLock}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={biometricLock ? colors.primary : '#f4f3f4'}
              />
            </View>

            {/* Change Password */}
            <TouchableOpacity
              style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => setShowPasswordModal(true)}
            >
              <Lock size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Change Password</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Update your account password</Text>
              </View>
            </TouchableOpacity>

            {/* Active Sessions */}
            <TouchableOpacity
              style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
                setShowSessions(!showSessions);
              }}
            >
              <Smartphone size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Active Sessions</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Manage devices logged into your account</Text>
              </View>
              {showSessions
                ? <ChevronUp size={16} color={colors.mutedForeground} />
                : <ChevronDown size={16} color={colors.mutedForeground} />
              }
            </TouchableOpacity>

            {/* Sessions List (expandable) */}
            {showSessions && (
              <View style={[styles.sessionsContainer, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                {sessions.map((session, idx) => (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionRow,
                      idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border },
                    ]}
                  >
                    <View style={[styles.sessionIcon, { backgroundColor: colors.secondary }]}>
                      {getDeviceIcon(session.icon)}
                    </View>
                    <View style={styles.sessionInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.sessionDevice, { color: colors.foreground }]}>{session.device}</Text>
                        {session.current && (
                          <View style={[styles.currentBadge, { backgroundColor: '#22c55e18' }]}>
                            <Text style={[styles.currentBadgeText, { color: '#22c55e' }]}>This device</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>
                        {session.location} · {session.lastActive}
                      </Text>
                    </View>
                    {!session.current && (
                      <TouchableOpacity
                        onPress={() => handleSignOut(session.id)}
                        activeOpacity={0.6}
                        style={[styles.signOutBtn, { borderColor: '#ef444440' }]}
                      >
                        <LogOut size={13} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {sessions.length === 1 && (
                  <Text style={[styles.noSessions, { color: colors.mutedForeground }]}>
                    Only this device is active
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PRIVACY</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Eye size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Read Receipts</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Let seekers know when you've read their messages</Text>
              </View>
              <Switch
                value={readReceipts}
                onValueChange={setReadReceipts}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={readReceipts ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
              <Shield size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Online Status</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Show when you're active to seekers</Text>
              </View>
              <Switch
                value={onlineStatus}
                onValueChange={setOnlineStatus}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={onlineStatus ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATA</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Shield size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Analytics Sharing</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Share anonymous usage data to improve Turumba</Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={setDataSharing}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={dataSharing ? colors.primary : '#f4f3f4'}
              />
            </View>
            <TouchableOpacity
              style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} color="#ef4444" />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Delete Account</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Permanently delete your account and all data</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ====== CHANGE PASSWORD MODAL ====== */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Lock size={18} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Change Password</Text>
              <TouchableOpacity onPress={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} activeOpacity={0.7}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {passwordSuccess ? (
              <View style={styles.successContainer}>
                <View style={[styles.successCircle, { backgroundColor: '#22c55e18' }]}>
                  <Check size={32} color="#22c55e" />
                </View>
                <Text style={[styles.successText, { color: colors.foreground }]}>Password Updated</Text>
                <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>Your password has been changed successfully.</Text>
              </View>
            ) : (
              <>
                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Current Password</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    placeholder="Enter current password"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    autoCapitalize="none"
                  />
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>New Password</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    autoCapitalize="none"
                  />
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Confirm New Password</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    autoCapitalize="none"
                  />
                </View>

                {/* Password requirements */}
                <View style={styles.reqContainer}>
                  <Text style={[styles.reqItem, { color: newPassword.length >= 8 ? '#22c55e' : colors.mutedForeground }]}>
                    {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                  </Text>
                  <Text style={[styles.reqItem, { color: /[A-Z]/.test(newPassword) ? '#22c55e' : colors.mutedForeground }]}>
                    {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
                  </Text>
                  <Text style={[styles.reqItem, { color: /[0-9]/.test(newPassword) ? '#22c55e' : colors.mutedForeground }]}>
                    {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
                  </Text>
                </View>

                {/* Error */}
                {passwordError ? (
                  <View style={styles.errorRow}>
                    <AlertTriangle size={13} color="#ef4444" />
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                ) : null}

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.submitBtnText}>Update Password</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ====== DELETE ACCOUNT MODAL ====== */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={18} color="#ef4444" />
              <Text style={[styles.modalTitle, { color: '#ef4444' }]}>Delete Account</Text>
              <TouchableOpacity onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} activeOpacity={0.7}>
                <X size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.warningBox, { backgroundColor: '#ef444410', borderColor: '#ef444430' }]}>
              <Text style={[styles.warningText, { color: '#ef4444' }]}>
                This action is permanent and cannot be undone. All your data, messages, seeker records, and account information will be permanently deleted.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                Type <Text style={{ fontFamily: 'DMSans_700Bold', color: colors.foreground }}>DELETE</Text> to confirm
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type DELETE"
                placeholderTextColor={colors.mutedForeground + '80'}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteBtnConfirm,
                  { backgroundColor: deleteConfirmText === 'DELETE' ? '#ef4444' : '#ef444440' },
                ]}
                activeOpacity={deleteConfirmText === 'DELETE' ? 0.8 : 1}
                onPress={() => { if (deleteConfirmText === 'DELETE') handleDeleteAccount(); }}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                <Trash2 size={14} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====== TOAST ====== */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              bottom: insets.bottom + 24,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
              opacity: toastAnim,
            },
          ]}
        >
          <View style={styles.toast}>
            <Check size={16} color="#fff" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    flex: 1,
    textAlign: 'center',
  },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingContent: { flex: 1, gap: 2 },
  settingLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  settingDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // Sessions
  sessionsContainer: {
    paddingVertical: 4,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: { flex: 1, gap: 3 },
  sessionDevice: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  sessionMeta: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
  },
  signOutBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSessions: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 0.5,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    flex: 1,
  },

  // Password form
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reqContainer: {
    gap: 4,
    marginBottom: 12,
  },
  reqItem: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#ef444410',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#fff',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  successText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
  successDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },

  // Delete modal
  warningBox: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 18,
  },
  warningText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 19,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  deleteBtnConfirm: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  deleteBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#fff',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  toastText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
