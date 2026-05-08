import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  LayoutAnimation,
  Modal,
  Animated,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  BookOpen,
  Mail,
  ExternalLink,
  ChevronRight,
  FileText,
  Video,
  HelpCircle,
  X,
  Send,
  Check,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

const FAQ_ITEMS = [
  {
    question: 'How do I assign a journey to a seeker?',
    answer: 'Go to the seeker\'s profile, tap the Journey tab, and select "Assign Journey" to choose from available content paths.',
  },
  {
    question: 'How are seekers matched with mentors?',
    answer: 'Turumba uses AI classification based on language, location, and spiritual background to suggest optimal mentor-seeker pairings.',
  },
  {
    question: 'What do the engagement scores mean?',
    answer: 'Engagement scores (0–100%) reflect how actively a seeker responds to messages, completes lessons, and participates in conversations.',
  },
  {
    question: 'How can I request a seeker reassignment?',
    answer: 'Open the seeker\'s profile, scroll to the Mentor section, and tap "Request Reassignment" with a brief reason.',
  },
  {
    question: 'How do notifications work?',
    answer: 'You receive push notifications for new messages, seeker milestones, assignments, and prayer requests. Configure these in Profile → Settings.',
  },
];

const SUPPORT_REPLIES = [
  'Hi! Thanks for reaching out to Turumba Support. How can I help you today?',
  'I understand. Let me look into that for you.',
  'Could you provide a bit more detail so I can assist you better?',
  'I\'ve noted your concern. Our team will follow up within 24 hours.',
  'Is there anything else I can help you with?',
];

const TERMS_SECTIONS = [
  {
    title: '1. Terms of Use',
    content: 'By accessing and using Turumba, you agree to comply with and be bound by these terms. The platform is provided for digital mentoring purposes, connecting mentors with seekers for spiritual guidance and support.',
  },
  {
    title: '2. User Accounts',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. Mentor accounts are assigned by organizational administrators. You must not share your login credentials with others.',
  },
  {
    title: '3. Privacy Policy',
    content: 'We collect and process personal data as necessary for the mentoring platform. Seeker information is confidential and must only be used for mentoring purposes. We implement appropriate security measures to protect all user data.',
  },
  {
    title: '4. Acceptable Use',
    content: 'Users must engage respectfully and constructively. Harassment, discrimination, and inappropriate content are strictly prohibited. All interactions should align with the organization\'s mission and values.',
  },
  {
    title: '5. Data Retention',
    content: 'We retain your data for as long as your account is active. Upon account deletion, personal data is removed within 30 days, except where retention is required by law or organizational policy.',
  },
  {
    title: '6. Disclaimer',
    content: 'Turumba is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access to the platform. Spiritual guidance provided through the platform does not constitute professional counseling.',
  },
];

export default function HelpScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Support Chat
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; fromUser: boolean; time: string }>>([
    { text: 'Hi! Thanks for reaching out to Turumba Support. How can I help you today?', fromUser: false, time: '9:00 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const replyIndex = useRef(1);
  const chatScrollRef = useRef<ScrollView>(null);

  // Terms Modal
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

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

  function handleSendChat() {
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessages = [
      ...chatMessages,
      { text: chatInput.trim(), fromUser: true, time: timeStr },
    ];
    setChatMessages(newMessages);
    setChatInput('');

    // Simulate auto-reply
    setTimeout(() => {
      const reply = SUPPORT_REPLIES[replyIndex.current % SUPPORT_REPLIES.length];
      replyIndex.current++;
      const replyTime = new Date();
      setChatMessages(prev => [
        ...prev,
        { text: reply, fromUser: false, time: replyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);

    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleEmailSupport() {
    Linking.openURL('mailto:support@turumba.app?subject=Support%20Request%20—%20Turumba%20App');
  }

  function handleMentorGuide() {
    showToast('Opening Mentor Guide...');
    Linking.openURL('https://turumba.app/mentor-guide');
  }

  function handleVideoTutorials() {
    showToast('Opening Video Tutorials...');
    Linking.openURL('https://turumba.app/tutorials');
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GET HELP</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.6}
              onPress={() => setShowChatModal(true)}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <MessageCircle size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Chat with Support</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Get help from the Turumba team</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
              activeOpacity={0.6}
              onPress={handleEmailSupport}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <Mail size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Email Support</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>support@turumba.app</Text>
              </View>
              <ExternalLink size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RESOURCES</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.6}
              onPress={handleMentorGuide}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <BookOpen size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Mentor Guide</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Best practices for digital mentoring</Text>
              </View>
              <ExternalLink size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
              activeOpacity={0.6}
              onPress={handleVideoTutorials}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <Video size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Video Tutorials</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Step-by-step walkthroughs</Text>
              </View>
              <ExternalLink size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => setShowTermsModal(true)}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <FileText size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Terms & Conditions</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Legal information</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FAQ</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            {FAQ_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.faqRow, idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}
                activeOpacity={0.6}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
                  setExpanded(expanded === item.question ? null : item.question);
                }}
              >
                <View style={styles.faqHeader}>
                  <HelpCircle size={14} color={colors.primary} />
                  <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{item.question}</Text>
                  {expanded === item.question
                    ? <ChevronDown size={14} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
                    : <ChevronDown size={14} color={colors.mutedForeground} />
                  }
                </View>
                {expanded === item.question && (
                  <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Turumba v1.0.0</Text>
        </View>
      </ScrollView>

      {/* ====== SUPPORT CHAT MODAL ====== */}
      <Modal visible={showChatModal} animationType="slide" onRequestClose={() => setShowChatModal(false)}>
        <View style={[styles.chatScreen, { backgroundColor: colors.background }]}>
          {/* Chat Header */}
          <View style={[styles.chatHeader, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowChatModal(false)} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowLeft size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <View style={[styles.supportAvatar, { backgroundColor: colors.primary }]}>
                <MessageCircle size={16} color="#fff" />
              </View>
              <View>
                <Text style={[styles.chatHeaderName, { color: colors.foreground }]}>Turumba Support</Text>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={[styles.onlineText, { color: colors.mutedForeground }]}>Online</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 30 }} />
          </View>

          {/* Messages */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatBody}
            contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {chatMessages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.chatBubbleRow,
                  msg.fromUser ? styles.chatBubbleRowRight : styles.chatBubbleRowLeft,
                ]}
              >
                <View
                  style={[
                    styles.chatBubble,
                    msg.fromUser
                      ? [styles.chatBubbleUser, { backgroundColor: colors.primary }]
                      : [styles.chatBubbleSupport, { backgroundColor: colors.secondary, borderColor: colors.border }],
                  ]}
                >
                  <Text style={[
                    styles.chatBubbleText,
                    { color: msg.fromUser ? '#fff' : colors.foreground },
                  ]}>
                    {msg.text}
                  </Text>
                </View>
                <Text style={[styles.chatTime, { color: colors.mutedForeground }]}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Chat Input */}
          <View style={[styles.chatInputBar, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.chatInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.mutedForeground + '80'}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: chatInput.trim() ? colors.primary : colors.border }]}
              activeOpacity={0.7}
              onPress={handleSendChat}
              disabled={!chatInput.trim()}
            >
              <Send size={16} color={chatInput.trim() ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====== TERMS & CONDITIONS MODAL ====== */}
      <Modal visible={showTermsModal} animationType="slide" onRequestClose={() => setShowTermsModal(false)}>
        <View style={[styles.termsScreen, { backgroundColor: colors.background }]}>
          <View style={[styles.chatHeader, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowTermsModal(false)} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowLeft size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms & Conditions</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.termsIntro, { color: colors.mutedForeground }]}>
              Last updated: April 1, 2026
            </Text>

            {TERMS_SECTIONS.map((section, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.termSection, { borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
                  setExpandedTerm(expandedTerm === section.title ? null : section.title);
                }}
              >
                <View style={styles.termHeader}>
                  <Text style={[styles.termTitle, { color: colors.foreground }]}>{section.title}</Text>
                  <ChevronDown
                    size={16}
                    color={colors.mutedForeground}
                    style={expandedTerm === section.title ? { transform: [{ rotate: '180deg' }] } : undefined}
                  />
                </View>
                {expandedTerm === section.title && (
                  <Text style={[styles.termContent, { color: colors.mutedForeground }]}>{section.content}</Text>
                )}
              </TouchableOpacity>
            ))}

            <View style={[styles.termsFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.termsFooterText, { color: colors.mutedForeground }]}>
                For questions about these terms, contact support@turumba.app
              </Text>
            </View>
          </ScrollView>
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: { flex: 1, gap: 2 },
  menuLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  menuDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  faqRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  faqQuestion: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  faqAnswer: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingLeft: 24,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  versionText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // Support Chat
  chatScreen: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 10,
  },
  supportAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  chatBody: { flex: 1 },
  chatBubbleRow: {
    marginBottom: 12,
  },
  chatBubbleRowLeft: {
    alignItems: 'flex-start',
  },
  chatBubbleRowRight: {
    alignItems: 'flex-end',
  },
  chatBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chatBubbleUser: {
    borderBottomRightRadius: 4,
  },
  chatBubbleSupport: {
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
  },
  chatBubbleText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  chatTime: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 0.5,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },

  // Terms
  termsScreen: { flex: 1 },
  termsIntro: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    marginBottom: 20,
  },
  termSection: {
    borderWidth: 0.5,
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    flex: 1,
  },
  termContent: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  termsFooter: {
    borderTopWidth: 0.5,
    paddingTop: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  termsFooterText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    textAlign: 'center',
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
