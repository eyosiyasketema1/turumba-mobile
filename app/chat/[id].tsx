import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  LayoutAnimation,
  Modal,
  Pressable,
  Dimensions,
  Keyboard,
  Animated,
  Image as RNImage,
  Alert,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Paperclip,
  Mic,
  Check,
  CheckCheck,
  ChevronDown,
  FileText,
  List,
  Sparkles,
  BookOpen,
  ChevronRight,
  X,
  Zap,
  Reply,
  Copy,
  Trash2,
  CornerUpRight,
  Image,
  File,
  Camera,
  Square,
  Play,
  Pause,
  CheckSquare,
  Ban,
  UserPlus,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_WIDTH = Math.floor(SCREEN_WIDTH * 0.65);

// ─── Waveform Component ─────────────────────────────────────────────────────

const NUM_BARS = 28;

function RecordingWaveform({ isActive, color }: { isActive: boolean; color: string }) {
  const animatedValues = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (!isActive) {
      animatedValues.forEach((v) => v.setValue(0.3));
      return;
    }
    const animations = animatedValues.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: 200 + Math.random() * 300,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.2 + Math.random() * 0.2,
            duration: 200 + Math.random() * 300,
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [isActive]);

  return (
    <View style={waveStyles.container}>
      {animatedValues.map((val, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            {
              backgroundColor: color,
              height: 24,
              transform: [{
                scaleY: val.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 1],
                }),
              }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function VoiceMessageWaveform({
  isPlaying,
  color,
  durationMs,
  onPlaybackEnd,
}: {
  isPlaying: boolean;
  color: string;
  durationMs: number;
  onPlaybackEnd?: () => void;
}) {
  const heights = useMemo(
    () => Array.from({ length: 24 }, (_, i) => 6 + Math.sin(i * 1.2) * 8 + Math.cos(i * 0.7) * 4),
    []
  );
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: durationMs || 3000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && onPlaybackEnd) onPlaybackEnd();
      });
    } else {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  }, [isPlaying]);

  return (
    <View style={waveStyles.voiceContainer}>
      {heights.map((h, i) => {
        const barProgress = progressAnim.interpolate({
          inputRange: [i / heights.length, (i + 1) / heights.length],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              waveStyles.voiceBar,
              {
                height: h,
                backgroundColor: barProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [color + '50', color],
                }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    height: 28,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
  },
});

// ─── Swipeable Message Wrapper ───────────────────────────────────────────────

const SWIPE_THRESHOLD = 60;

function SwipeableMessage({
  children,
  onSwipeReply,
  enabled = true,
}: {
  children: React.ReactNode;
  onSwipeReply: () => void;
  enabled?: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -20, 0],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enabled && Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2) && gestureState.dx < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          onSwipeReply();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
    })
  ).current;

  return (
    <View style={{ position: 'relative', overflow: 'visible' }}>
      <Animated.View
        style={{
          position: 'absolute',
          right: 8,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          opacity: replyIconOpacity,
        }}
      >
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(37,99,235,0.12)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Reply size={16} color="#2563eb" />
        </View>
      </Animated.View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

type MessageType = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'voice' | 'photo' | 'document';
  duration?: string;
  durationSeconds?: number;
  fileName?: string;
  imageUri?: string;
  audioUri?: string;
  replyTo?: { id: string; text: string; sender: 'me' | 'them' };
  deleted?: boolean;
  deletedFor?: 'me' | 'everyone';
  forwarded?: boolean;
};

const MESSAGES: MessageType[] = [
  {
    id: '1',
    text: 'Hi Sarah! How are you doing today?',
    sender: 'me',
    time: '9:00 AM',
    status: 'read' as const,
  },
  {
    id: '2',
    text: "I'm doing great, thank you! I've been reading the devotional you shared.",
    sender: 'them',
    time: '9:05 AM',
    status: 'read' as const,
  },
  {
    id: '3',
    text: "That's wonderful to hear! What did you think about the section on prayer?",
    sender: 'me',
    time: '9:07 AM',
    status: 'read' as const,
  },
  {
    id: '4',
    text: 'It really opened my eyes. I never realized prayer could be so personal and conversational. I always thought it had to be formal.',
    sender: 'them',
    time: '9:10 AM',
    status: 'read' as const,
  },
  {
    id: '5',
    text: 'Exactly! God wants a relationship with us, not just rituals. Have you tried talking to Him in your own words?',
    sender: 'me',
    time: '9:12 AM',
    status: 'read' as const,
  },
  {
    id: '6',
    text: "Yes, I tried last night before bed. It felt really different — peaceful. I actually cried a little.",
    sender: 'them',
    time: '9:15 AM',
    status: 'read' as const,
  },
  {
    id: '7',
    text: "That's beautiful, Sarah. Those tears are often the Holy Spirit touching your heart. Keep going! 🙏",
    sender: 'me',
    time: '9:17 AM',
    status: 'delivered' as const,
  },
  {
    id: '8',
    text: "Thank you for the prayer guide! I have a question about the section on fasting — is it required?",
    sender: 'them',
    time: '9:30 AM',
    status: 'read' as const,
  },
];

// ─── Form Templates ──────────────────────────────────────────────────────────

const FORM_TEMPLATES = [
  { id: 'intake', label: 'Intake Form', desc: 'Collect basic info, spiritual background, and contact preferences', color: '#2563eb', bgColor: '#eff6ff' },
  { id: 'assessment', label: 'Faith Assessment', desc: '5-question check-in to gauge current spiritual engagement', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'prayer', label: 'Prayer Request Form', desc: 'Structured form for submitting prayer requests with follow-up option', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { id: 'feedback', label: 'Mentor Feedback', desc: 'Short survey about their experience with their assigned mentor', color: '#f59e0b', bgColor: '#fffbeb' },
];

// ─── Content Series ──────────────────────────────────────────────────────────

const CONTENT_SERIES = [
  { id: 'foundations', label: 'Foundations of Faith', lessons: 7, desc: 'Core beliefs and first steps for new believers', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { id: 'prayer_basics', label: 'Prayer Basics', lessons: 5, desc: 'Learning to build a consistent prayer life', color: '#2563eb', bgColor: '#eff6ff' },
  { id: 'bible_101', label: 'Bible 101', lessons: 10, desc: 'How to read, understand, and apply Scripture', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'community', label: 'Finding Community', lessons: 4, desc: 'Connecting with a faith community and small groups', color: '#f59e0b', bgColor: '#fffbeb' },
];

// ─── AI Suggestion Bank ──────────────────────────────────────────────────────

type AISuggestion = { id: string; text: string };

const AI_SUGGESTION_BANK: Record<string, AISuggestion[]> = {
  greeting: [
    { id: 'sg1', text: 'Hi! Thank you for reaching out. How can I help you today?' },
    { id: 'sg2', text: "Welcome! I'm glad you're here. What's on your mind?" },
    { id: 'sg3', text: 'Peace be with you! How are you doing today?' },
  ],
  question: [
    { id: 'sq1', text: "That's a great question! Let me share some thoughts..." },
    { id: 'sq2', text: "I appreciate you asking. Here's what I've found helpful..." },
    { id: 'sq3', text: 'Let me point you to a resource that covers this well.' },
  ],
  struggle: [
    { id: 'ss1', text: "Thank you for sharing that. I'm here for you and we can work through this together." },
    { id: 'ss2', text: 'I understand this is difficult. Would you like to talk more about it?' },
    { id: 'ss3', text: "You're not alone in this. Let's set up a time to discuss further." },
  ],
  encouragement: [
    { id: 'se1', text: "That's wonderful progress! I'm really encouraged by your growth." },
    { id: 'se2', text: "Keep going — you're doing amazing! God is faithful." },
    { id: 'se3', text: 'I love hearing this. Would you like to share your testimony with the group?' },
  ],
  followup: [
    { id: 'sf1', text: 'Just checking in — how are things going since we last spoke?' },
    { id: 'sf2', text: "I've been thinking about our conversation. How are you feeling?" },
    { id: 'sf3', text: 'Have you had a chance to try what we discussed?' },
  ],
  prayer: [
    { id: 'sp1', text: "I'll be praying for you. Is there anything specific you'd like me to focus on?" },
    { id: 'sp2', text: "Let's pray together. When works best for you?" },
    { id: 'sp3', text: 'Thank you for sharing that prayer request. God hears you.' },
  ],
  general: [
    { id: 'gg1', text: 'Thank you for sharing! Would you like to discuss this further?' },
    { id: 'gg2', text: 'I appreciate you reaching out. How can I support you?' },
    { id: 'gg3', text: "That's really insightful. Let me share a related resource." },
    { id: 'gg4', text: 'Would you like to schedule a time to meet and talk?' },
  ],
};

function classifyLastMessage(lastMsg: string): string {
  const lower = lastMsg.toLowerCase();
  if (/^(hi|hello|hey|good morning|good evening|salam|selam)/.test(lower)) return 'greeting';
  if (/\?$|how do|what is|can you|why do|where can|tell me/.test(lower)) return 'question';
  if (/struggl|difficult|hard|lost|confus|doubt|afraid|scared|anxious|depress|lonely/.test(lower)) return 'struggle';
  if (/thank|blessed|amazing|wonderful|great|happy|joy|excited|growth|progress/.test(lower)) return 'encouragement';
  if (/pray|prayer|lord|god.*help|intercede/.test(lower)) return 'prayer';
  if (/check.?in|follow.?up|how.*going|update/.test(lower)) return 'followup';
  return 'general';
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChatDetailScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, claimed: claimedParam, name: nameParam, initials: initialsParam, color: colorParam, maturity: maturityParam } = useLocalSearchParams();
  const [isClaimed, setIsClaimed] = useState(claimedParam !== '0');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MESSAGES);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTime = useRef<number>(0);
  const recordingRef = useRef<any>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Audio playback refs for voice messages
  const soundRef = useRef<any>(null);

  // Quick Actions state
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [activePanel, setActivePanel] = useState<'form' | 'series' | 'suggest' | null>(null);

  // AI Suggestion Pills state
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [usedSuggestionIds, setUsedSuggestionIds] = useState<Set<string>>(new Set());

  // Message context menu state
  const [selectedMessage, setSelectedMessage] = useState<(typeof MESSAGES)[0] | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const QUICK_REACTIONS = ['❤️', '👍', '🙏', '😂', '😢', '😮', '🔥'];

  const MENU_ACTIONS = [
    { id: 'reply', label: 'Reply', icon: Reply },
    { id: 'forward', label: 'Forward', icon: CornerUpRight },
    { id: 'copy', label: 'Copy', icon: Copy },
    { id: 'select', label: 'Select', icon: CheckSquare },
    { id: 'delete', label: 'Delete', icon: Trash2, destructive: true },
  ];

  // Reply state
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);

  // Forward modal
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState<MessageType[]>([]);
  const [selectedForwardIds, setSelectedForwardIds] = useState<Set<string>>(new Set());
  const [forwardSearch, setForwardSearch] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; undoAction?: () => void; id: number } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string, undoAction?: () => void) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message, undoAction, id: Date.now() });
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, 4000);
  };

  const dismissToast = () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  };

  const FORWARD_CONTACTS: { id: string; name: string; initials: string; color: string; isGroup?: boolean }[] = [
    { id: 'c1', name: 'John Doe', initials: 'JD', color: '#10b981' },
    { id: 'c2', name: 'Mary Smith', initials: 'MS', color: '#8b5cf6' },
    { id: 'c3', name: 'David Kim', initials: 'DK', color: '#f59e0b' },
    { id: 'c4', name: 'Grace Lee', initials: 'GL', color: '#ef4444' },
    { id: 'c5', name: 'Peter Brown', initials: 'PB', color: '#3b82f6' },
    { id: 'g1', name: 'Youth Ministry', initials: 'YM', color: '#0d9488', isGroup: true },
    { id: 'g2', name: 'Bible Study Group', initials: 'BS', color: '#7c3aed', isGroup: true },
    { id: 'g3', name: 'Prayer Warriors', initials: 'PW', color: '#ea580c', isGroup: true },
  ];

  const filteredForwardContacts = FORWARD_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(forwardSearch.toLowerCase())
  );

  const handleLongPress = useCallback((msg: (typeof MESSAGES)[0]) => {
    setSelectedMessage(msg);
    setMenuVisible(true);
  }, []);

  const handleReaction = useCallback((emoji: string) => {
    if (!selectedMessage) return;
    setReactions((prev) => {
      const current = prev[selectedMessage.id];
      if (current === emoji) {
        const next = { ...prev };
        delete next[selectedMessage.id];
        return next;
      }
      return { ...prev, [selectedMessage.id]: emoji };
    });
    setMenuVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleMenuAction = useCallback((actionId: string) => {
    if (!selectedMessage) return;
    switch (actionId) {
      case 'copy':
        Clipboard.setStringAsync(selectedMessage.text);
        setMenuVisible(false);
        setSelectedMessage(null);
        showToast('Message copied');
        break;
      case 'reply':
        setReplyingTo(selectedMessage);
        setMenuVisible(false);
        setSelectedMessage(null);
        break;
      case 'forward':
        setMessagesToForward([selectedMessage]);
        setMenuVisible(false);
        setSelectedMessage(null);
        setForwardModalVisible(true);
        break;
      case 'select':
        setSelectedIds(new Set([selectedMessage.id]));
        setSelectMode(true);
        setMenuVisible(false);
        setSelectedMessage(null);
        break;
      case 'delete':
        setMessageToDelete(selectedMessage);
        setMenuVisible(false);
        setSelectedMessage(null);
        setDeleteModalVisible(true);
        break;
      default:
        setMenuVisible(false);
        setSelectedMessage(null);
    }
  }, [selectedMessage]);

  const handleDelete = (side: 'me' | 'everyone') => {
    if (!messageToDelete) return;
    const originalMsg = { ...messageToDelete };
    const originalText = messageToDelete.text;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageToDelete.id) return m;
        if (side === 'me') {
          return { ...m, deleted: true, deletedFor: 'me', text: '' };
        }
        return { ...m, deleted: true, deletedFor: 'everyone', text: '' };
      })
    );
    setDeleteModalVisible(false);
    setMessageToDelete(null);
    showToast('Message deleted', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === originalMsg.id
            ? { ...m, deleted: false, deletedFor: undefined, text: originalText }
            : m
        )
      );
    });
  };

  const toggleForwardContact = (contactId: string) => {
    setSelectedForwardIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  };

  const handleForwardSend = () => {
    if (selectedForwardIds.size === 0) return;
    const contactNames = FORWARD_CONTACTS.filter((c) => selectedForwardIds.has(c.id)).map((c) => c.name);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    messagesToForward.forEach((msg, i) => {
      const newMsg: MessageType = {
        id: `msg-${Date.now()}-fwd-${i}`,
        text: msg.text,
        sender: 'me',
        time: timeStr,
        status: 'sent',
        type: msg.type,
        forwarded: true,
        imageUri: msg.imageUri,
        fileName: msg.fileName,
      };
      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }, i * 150);
    });
    setForwardModalVisible(false);
    setMessagesToForward([]);
    setSelectedForwardIds(new Set());
    setForwardSearch('');
    if (selectMode) {
      setSelectMode(false);
      setSelectedIds(new Set());
    }
    const label = contactNames.length === 1
      ? `Forwarded to ${contactNames[0]}`
      : `Forwarded to ${contactNames.length} chats`;
    showToast(label);
  };

  const toggleSelectMessage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAction = (action: 'forward' | 'copy' | 'delete') => {
    const selected = messages.filter((m) => selectedIds.has(m.id));
    if (action === 'forward') {
      setMessagesToForward(selected);
      setSelectedForwardIds(new Set());
      setForwardSearch('');
      setForwardModalVisible(true);
    } else if (action === 'copy') {
      const text = selected.map((m) => `${m.sender === 'me' ? 'You' : seekerName}: ${m.text}`).join('\n');
      Clipboard.setStringAsync(text);
      setSelectMode(false);
      setSelectedIds(new Set());
      showToast(`${selected.length} message${selected.length > 1 ? 's' : ''} copied`);
    } else if (action === 'delete') {
      const deletedIds = new Set(selectedIds);
      const originals = messages.filter((m) => deletedIds.has(m.id)).map((m) => ({ ...m }));
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages((prev) =>
        prev.map((m) =>
          deletedIds.has(m.id) ? { ...m, deleted: true, deletedFor: 'me' as const, text: '' } : m
        )
      );
      setSelectMode(false);
      setSelectedIds(new Set());
      showToast(`${originals.length} message${originals.length > 1 ? 's' : ''} deleted`, () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages((prev) =>
          prev.map((m) => {
            const orig = originals.find((o) => o.id === m.id);
            return orig ? { ...orig } : m;
          })
        );
      });
    }
  };

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setSelectedMessage(null);
  }, []);

  // Seeker info — use route params if available, fallback to defaults
  const seekerName = (nameParam as string) || 'Sarah Johnson';
  const seekerInitials = (initialsParam as string) || 'SJ';
  const seekerColor = (colorParam as string) || '#2563eb';
  const seekerMaturity = (maturityParam as string) || 'New Believer';
  const isOnline = true;
  const seekerPlatform = 'WhatsApp'; // 'WhatsApp' | 'Telegram' | 'SMS' | 'Email'

  const PLATFORM_CONFIG: Record<string, { color: string }> = {
    WhatsApp: { color: '#25D366' },
    Telegram: { color: '#0088cc' },
    SMS: { color: '#f59e0b' },
    Email: { color: '#8b5cf6' },
  };
  const platformInfo = PLATFORM_CONFIG[seekerPlatform] || { color: colors.mutedForeground };

  // Classify last inbound message for AI suggestions
  const lastInboundMessage = useMemo(() => {
    const inbound = MESSAGES.filter((m) => m.sender === 'them');
    return inbound[inbound.length - 1];
  }, []);

  const aiSuggestions = useMemo(() => {
    if (!lastInboundMessage) return AI_SUGGESTION_BANK.followup;
    const category = classifyLastMessage(lastInboundMessage.text);
    return AI_SUGGESTION_BANK[category] || AI_SUGGESTION_BANK.general;
  }, [lastInboundMessage]);

  const visibleSuggestions = aiSuggestions.filter((s) => !usedSuggestionIds.has(s.id));

  const handleSelectSuggestion = (suggestion: AISuggestion) => {
    setMessage(suggestion.text);
    setUsedSuggestionIds((prev) => new Set([...prev, suggestion.id]));
  };

  const togglePanel = (panel: typeof activePanel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleSendForm = (formId: string) => {
    const form = FORM_TEMPLATES.find((f) => f.id === formId);
    if (!form) return;
    setMessage(`📋 ${form.label}\n\n${form.desc}\n\n👉 Please fill out this form.`);
    setActivePanel(null);
  };

  const handleStartSeries = (seriesId: string) => {
    const series = CONTENT_SERIES.find((s) => s.id === seriesId);
    if (!series) return;
    setMessage(`📚 ${series.label} — ${series.lessons}-part series\n\n${series.desc}\n\nLesson 1 is on its way!`);
    setActivePanel(null);
  };

  const TOOLBAR_ACTIONS = [
    { id: 'form' as const, icon: FileText, label: 'Send Form', color: '#2563eb', bgColor: '#eff6ff' },
    { id: 'series' as const, icon: List, label: 'Content Series', color: '#8b5cf6', bgColor: '#f5f3ff' },
    { id: 'suggest' as const, icon: Sparkles, label: 'AI Suggest', color: '#f59e0b', bgColor: '#fffbeb' },
  ];

  // ─── Render Message ──────────────────────────────────────────────────────

  // Voice message playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const renderMessage = ({ item }: { item: MessageType }) => {
    const isMe = item.sender === 'me';
    const reaction = reactions[item.id];
    const isVoice = item.type === 'voice';
    const isPhoto = item.type === 'photo';
    const isDocument = item.type === 'document';
    const isPlayingThis = playingVoiceId === item.id;
    const isSelected = selectMode && selectedIds.has(item.id);

    // Deleted message
    if (item.deleted) {
      if (item.deletedFor === 'me') return null;
      return (
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          <View style={[styles.messageBubble, styles.deletedBubble, { backgroundColor: colors.secondary }]}>
            <View style={styles.deletedContent}>
              <Ban size={14} color={colors.mutedForeground} />
              <Text style={[styles.deletedText, { color: colors.mutedForeground }]}>
                {isMe ? 'You deleted this message' : 'This message was deleted'}
              </Text>
            </View>
            <Text style={[styles.messageTime, { color: colors.mutedForeground, marginTop: 4 }]}>{item.time}</Text>
          </View>
        </View>
      );
    }

    const renderContent = () => {
      if (isVoice) {
        const totalSec = item.durationSeconds || 1;
        return (
          <View style={styles.voiceMsgContent}>
            <TouchableOpacity
              style={[styles.voicePlayBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }]}
              onPress={() => playVoiceMessage(item)}
              activeOpacity={0.7}
            >
              {isPlayingThis ? (
                <Pause size={14} color={isMe ? '#fff' : colors.primary} />
              ) : (
                <Play size={14} color={isMe ? '#fff' : colors.primary} />
              )}
            </TouchableOpacity>
            <VoiceMessageWaveform
              isPlaying={isPlayingThis}
              color={isMe ? 'rgba(255,255,255,0.8)' : colors.primary}
              durationMs={totalSec * 1000}
              onPlaybackEnd={() => setPlayingVoiceId(null)}
            />
            <Text style={[styles.voiceDuration, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>
              {item.duration || '0:00'}
            </Text>
          </View>
        );
      }
      if (isPhoto && item.imageUri) {
        return (
          <RNImage
            source={{ uri: item.imageUri }}
            style={{ width: PHOTO_WIDTH, height: PHOTO_WIDTH * 0.75, borderRadius: 0 }}
            resizeMode="cover"
          />
        );
      }
      if (isPhoto) {
        return (
          <View style={styles.attachMsgContent}>
            <Image size={16} color={isMe ? 'rgba(255,255,255,0.8)' : colors.primary} />
            <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.foreground }]}>
              {item.fileName || 'Photo'}
            </Text>
          </View>
        );
      }
      if (isDocument) {
        return (
          <View style={styles.attachMsgContent}>
            <File size={16} color={isMe ? 'rgba(255,255,255,0.8)' : colors.primary} />
            <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.foreground }]} numberOfLines={1}>
              {item.fileName || 'Document'}
            </Text>
          </View>
        );
      }
      return (
        <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.foreground }]}>
          {item.text}
        </Text>
      );
    };

    const hasImage = isPhoto && item.imageUri;

    const handlePress = () => {
      if (selectMode) {
        toggleSelectMessage(item.id);
      }
    };

    return (
      <SwipeableMessage
        onSwipeReply={() => { setReplyingTo(item); }}
        enabled={!selectMode && !item.deleted}
      >
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {selectMode && (
          <TouchableOpacity onPress={() => toggleSelectMessage(item.id)} style={styles.selectCheckbox}>
            <View style={[styles.checkbox, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {isSelected && <Check size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        )}
        <Pressable
          onLongPress={() => { if (!selectMode) handleLongPress(item); }}
          onPress={handlePress}
          delayLongPress={300}
          style={[
            hasImage
              ? styles.photoBubble
              : [
                  styles.messageBubble,
                  isMe
                    ? [styles.messageBubbleMe, { backgroundColor: colors.primary }]
                    : [styles.messageBubbleThem, { backgroundColor: colors.secondary }],
                ],
          ]}
        >
          {/* Reply preview */}
          {item.replyTo && (
            <View style={[styles.replyPreviewInBubble, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : colors.background, borderLeftColor: isMe ? '#fff' : colors.primary }]}>
              <Text style={[styles.replyPreviewName, { color: isMe ? 'rgba(255,255,255,0.9)' : colors.primary }]}>
                {item.replyTo.sender === 'me' ? 'You' : seekerName}
              </Text>
              <Text style={[styles.replyPreviewText, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]} numberOfLines={1}>
                {item.replyTo.text}
              </Text>
            </View>
          )}
          {/* Forwarded label */}
          {item.forwarded && (
            <View style={styles.forwardedLabel}>
              <CornerUpRight size={11} color={isMe ? 'rgba(255,255,255,0.6)' : colors.mutedForeground} />
              <Text style={[styles.forwardedText, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.mutedForeground }]}>Forwarded</Text>
            </View>
          )}
          {renderContent()}
          <View style={[styles.messageFooter, hasImage && styles.photoFooter]}>
            <Text
              style={[
                styles.messageTime,
                { color: hasImage ? '#fff' : isMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground },
              ]}
            >
              {item.time}
            </Text>
            {isMe &&
              (item.status === 'read' ? (
                <CheckCheck size={14} color={hasImage ? '#fff' : 'rgba(255,255,255,0.7)'} />
              ) : (
                <Check size={14} color={hasImage ? '#fff' : 'rgba(255,255,255,0.7)'} />
              ))}
          </View>
        </Pressable>
        {reaction && (
          <View style={[styles.reactionBubble, isMe ? styles.reactionBubbleMe : styles.reactionBubbleThem]}>
            <Text style={styles.reactionEmoji}>{reaction}</Text>
          </View>
        )}
      </View>
      </SwipeableMessage>
    );
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newMsg: MessageType = {
      id: `msg-${Date.now()}`,
      text: message.trim(),
      sender: 'me' as const,
      time: timeStr,
      status: 'sent' as const,
      ...(replyingTo ? { replyTo: { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.sender } } : {}),
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
    setReplyingTo(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate delivery after 1s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m)
      );
    }, 1000);

    // Simulate read after 2s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'read' as const } : m)
      );
    }, 2500);
  };

  const sendAttachmentMessage = (msgType: 'photo' | 'document', fileName: string, imageUri?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newMsg: MessageType = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: fileName,
      sender: 'me',
      time: timeStr,
      status: 'sent',
      type: msgType,
      fileName,
      imageUri,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, status: 'read' } : m));
    }, 2000);
  };

  const handleSendAttachment = async (type: string) => {
    setShowAttachMenu(false);

    if (type === 'photo') {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsMultipleSelection: true,
          selectionLimit: 10,
          quality: 0.8,
          orderedSelection: true,
        });
        if (result.canceled || !result.assets.length) return;
        result.assets.forEach((asset, index) => {
          setTimeout(() => {
            sendAttachmentMessage('photo', asset.fileName || `Photo ${index + 1}`, asset.uri);
          }, index * 100);
        });
      } catch (e) {
        console.log('Image picker error:', e);
      }
    } else if (type === 'document') {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (result.canceled) return;
        const file = result.assets[0];
        sendAttachmentMessage('document', file.name || 'Document');
      } catch (e) {
        console.log('Document picker error:', e);
      }
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets?.HIGH_QUALITY ?? {
          android: { extension: '.m4a', outputFormat: 2, audioEncoder: 3, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 },
          ios: { extension: '.m4a', outputFormat: 'aac', audioQuality: 127, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
          web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
        }
      );
      recordingRef.current = recording;

      // Start timer only after recording successfully started
      setIsRecording(true);
      setRecordingDuration(0);
      recordingStartTime.current = Date.now();
      recordingInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime.current) / 1000);
        setRecordingDuration(elapsed);
      }, 500);
    } catch (e) {
      console.log('Recording start error:', e);
    }
  };

  const stopAndSendRecording = async () => {
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    const duration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
    setIsRecording(false);
    setRecordingDuration(0);

    let audioUri: string | undefined;
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        audioUri = recordingRef.current.getURI() || undefined;
        recordingRef.current = null;
      } catch (e) {
        console.log('Recording stop error:', e);
      }
    }

    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newMsg: MessageType = {
      id: `msg-${Date.now()}`,
      text: 'Voice message',
      sender: 'me',
      time: timeStr,
      status: 'sent',
      type: 'voice',
      duration: durationStr,
      durationSeconds: duration || 1,
      audioUri,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'read' } : m)
      );
    }, 2000);
  };

  const cancelRecording = async () => {
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      } catch {}
    }
  };

  const playVoiceMessage = async (item: MessageType) => {
    const isPlaying = playingVoiceId === item.id;
    if (isPlaying) {
      // Stop playback
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any existing playback first
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }

    if (item.audioUri) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: item.audioUri },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setPlayingVoiceId(item.id);

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setPlayingVoiceId(null);
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
      } catch (e) {
        console.log('Playback error:', e);
        setPlayingVoiceId(item.id);
        setTimeout(() => setPlayingVoiceId(null), (item.durationSeconds || 3) * 1000);
      }
    } else {
      // No audio file — just animate the waveform for the duration
      setPlayingVoiceId(item.id);
      setTimeout(() => setPlayingVoiceId(null), (item.durationSeconds || 3) * 1000);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          activeOpacity={0.6}
          onPress={() => router.push(`/seeker/${id}`)}
        >
          <View style={[styles.headerAvatar, { backgroundColor: seekerColor }]}>
            <Text style={styles.headerAvatarText}>{seekerInitials}</Text>
            {isOnline && <View style={styles.headerOnlineDot} />}
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
              {seekerName}
            </Text>
            <View style={styles.headerMetaRow}>
              <Text style={[styles.headerStatus, { color: colors.mutedForeground }]}>
                {isOnline ? 'Online' : 'Offline'} · {seekerMaturity}
              </Text>
            </View>
            <View style={styles.headerPlatformRow}>
              <MessageCircle size={12} color={platformInfo.color} />
              <Text style={[styles.headerPlatformText, { color: platformInfo.color }]}>
                {seekerPlatform}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

      </View>

      {/* Unclaimed conversation banner */}
      {!isClaimed && (
        <View style={[styles.claimBanner, { backgroundColor: '#fef3c718', borderBottomColor: colors.border }]}>
          <View style={[styles.claimIconCircle, { backgroundColor: '#f59e0b18' }]}>
            <UserPlus size={18} color="#f59e0b" />
          </View>
          <View style={styles.claimBannerInfo}>
            <Text style={[styles.claimBannerTitle, { color: colors.foreground }]}>New Conversation</Text>
            <Text style={[styles.claimBannerDesc, { color: colors.mutedForeground }]}>
              {seekerName.split(' ')[0]} is waiting to hear from you. Claim to start chatting!
            </Text>
          </View>
        </View>
      )}

      {/* Messages + Bottom Area wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        />
        {/* ─── Quick Actions ─────────────────────────────────────── */}
        <View style={[styles.toolbarContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {/* Tappable label header — toggles chips visibility */}
          <TouchableOpacity
            style={styles.toolbarHeader}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setQuickActionsVisible((v) => !v);
              if (quickActionsVisible) setActivePanel(null);
            }}
            activeOpacity={0.7}
          >
            <Zap size={12} color="#f59e0b" />
            <Text style={[styles.toolbarHeaderText, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
            <ChevronDown
              size={12}
              color={colors.mutedForeground}
              style={{ transform: [{ rotate: quickActionsVisible ? '0deg' : '-90deg' }] }}
            />
          </TouchableOpacity>

          {/* Chip labels */}
          {quickActionsVisible && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.toolbarChipsScroll}
              contentContainerStyle={styles.toolbarChipsContent}
            >
              {TOOLBAR_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = activePanel === action.id;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.toolbarChip,
                      {
                        backgroundColor: isActive ? '#000022' : colors.secondary,
                      },
                    ]}
                    onPress={() => togglePanel(action.id)}
                    activeOpacity={0.7}
                  >
                    <Icon size={13} color={isActive ? '#fff' : action.color} />
                    <Text style={[styles.toolbarChipText, { color: isActive ? '#fff' : colors.foreground }]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Panel Content */}
          {activePanel === 'form' && (
            <View style={[styles.panelContainer, { borderTopColor: colors.border }]}>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>
                  Send a form to {seekerName.split(' ')[0]}
                </Text>
                <TouchableOpacity onPress={() => setActivePanel(null)} style={styles.panelClose} activeOpacity={0.7}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              {FORM_TEMPLATES.map((form) => (
                <TouchableOpacity
                  key={form.id}
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => handleSendForm(form.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: form.bgColor }]}>
                    <FileText size={16} color={form.color} />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>{form.label}</Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {form.desc}
                    </Text>
                  </View>
                  <Send size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activePanel === 'series' && (
            <View style={[styles.panelContainer, { borderTopColor: colors.border }]}>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Start a content series</Text>
                <TouchableOpacity onPress={() => setActivePanel(null)} style={styles.panelClose} activeOpacity={0.7}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              {CONTENT_SERIES.map((series) => (
                <TouchableOpacity
                  key={series.id}
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => handleStartSeries(series.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: series.bgColor }]}>
                    <BookOpen size={16} color={series.color} />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>
                      {series.label}{' '}
                      <Text style={[styles.panelItemLessonCount, { color: colors.mutedForeground }]}>
                        · {series.lessons} lessons
                      </Text>
                    </Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {series.desc}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activePanel === 'suggest' && (
            <View style={[styles.panelContainer, { borderTopColor: colors.border }]}>
              <View style={styles.panelHeader}>
                <View style={styles.panelSuggestHeader}>
                  <Sparkles size={14} color="#f59e0b" />
                  <Text style={[styles.panelTitle, { color: colors.foreground }]}>
                    AI picks for {seekerName.split(' ')[0]}
                  </Text>
                  <View style={[styles.maturityBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.maturityBadgeText, { color: colors.mutedForeground }]}>{seekerMaturity}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setActivePanel(null)} style={styles.panelClose} activeOpacity={0.7}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View style={styles.suggestPanelItems}>
                <TouchableOpacity
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setMessage("📖 Foundations of Faith — Lesson 1: What is Faith?\n\nFaith is trusting God even when you can't see the full picture...");
                    setActivePanel(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: '#fffbeb' }]}>
                    <BookOpen size={16} color="#f59e0b" />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>Understanding Prayer</Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      A guide to building a personal prayer life
                    </Text>
                    <View style={styles.panelItemMeta}>
                      <View style={[styles.panelItemTag, { backgroundColor: colors.background }]}>
                        <Text style={[styles.panelItemTagText, { color: colors.mutedForeground }]}>Article</Text>
                      </View>
                      <Text style={[styles.panelItemMetaText, { color: colors.mutedForeground }]}>5 min read</Text>
                    </View>
                  </View>
                  <Send size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setMessage("📖 What Does the Bible Say About Fasting?\n\nFasting is a spiritual discipline, not a requirement...");
                    setActivePanel(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: '#fffbeb' }]}>
                    <BookOpen size={16} color="#f59e0b" />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>Biblical Fasting Guide</Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      Overview of fasting in Scripture and practical tips
                    </Text>
                    <View style={styles.panelItemMeta}>
                      <View style={[styles.panelItemTag, { backgroundColor: colors.background }]}>
                        <Text style={[styles.panelItemTagText, { color: colors.mutedForeground }]}>Guide</Text>
                      </View>
                      <Text style={[styles.panelItemMetaText, { color: colors.mutedForeground }]}>8 min read</Text>
                    </View>
                  </View>
                  <Send size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ─── AI Reply Suggestion Pills ─────────────────────────── */}
        {visibleSuggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={styles.suggestionsHeader}
              onPress={() => setSuggestionsVisible((v) => !v)}
              activeOpacity={0.7}
            >
              <Sparkles size={12} color="#f59e0b" />
              <Text style={[styles.suggestionsLabel, { color: colors.mutedForeground }]}>AI SUGGESTIONS</Text>
              <ChevronDown
                size={12}
                color={colors.mutedForeground}
                style={{ transform: [{ rotate: suggestionsVisible ? '0deg' : '-90deg' }] }}
              />
            </TouchableOpacity>
            {suggestionsVisible && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsPills}
              >
                {visibleSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={[styles.suggestionPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionPillText, { color: colors.foreground }]} numberOfLines={1}>
                      {suggestion.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ─── Claim Conversation Button (unclaimed) ──────────── */}
        {!isClaimed ? (
          <View style={[styles.claimContainer, { paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 16) + 8, backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.claimBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsClaimed(true);
                showToast(`You claimed the conversation with ${seekerName}`);
              }}
            >
              <UserPlus size={18} color="#fff" />
              <Text style={styles.claimBtnText}>Claim Conversation</Text>
            </TouchableOpacity>
            <Text style={[styles.claimHint, { color: colors.mutedForeground }]}>
              Once claimed, you can begin your conversation right away
            </Text>
          </View>
        ) :

        /* ─── Select Mode Toolbar ─────────────────────────────── */
        selectMode ? (
          <View style={[styles.selectToolbar, { paddingBottom: keyboardVisible ? 8 : 24, backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setSelectMode(false); setSelectedIds(new Set()); }} activeOpacity={0.7} style={styles.selectToolbarBtn}>
              <X size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.selectCount, { color: colors.foreground }]}>{selectedIds.size} selected</Text>
            <View style={styles.selectActions}>
              <TouchableOpacity onPress={() => handleSelectAction('forward')} activeOpacity={0.7} style={styles.selectActionBtn} disabled={selectedIds.size === 0}>
                <CornerUpRight size={20} color={selectedIds.size > 0 ? colors.foreground : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectAction('copy')} activeOpacity={0.7} style={styles.selectActionBtn} disabled={selectedIds.size === 0}>
                <Copy size={20} color={selectedIds.size > 0 ? colors.foreground : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSelectAction('delete')} activeOpacity={0.7} style={styles.selectActionBtn} disabled={selectedIds.size === 0}>
                <Trash2 size={20} color={selectedIds.size > 0 ? '#ef4444' : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* ─── Reply Preview Bar ────────────────────────────────── */}
            {replyingTo && (
              <View style={[styles.replyBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <View style={[styles.replyBarContent, { borderLeftColor: colors.primary }]}>
                  <Text style={[styles.replyBarName, { color: colors.primary }]}>
                    {replyingTo.sender === 'me' ? 'You' : seekerName}
                  </Text>
                  <Text style={[styles.replyBarText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {replyingTo.text}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingTo(null)} activeOpacity={0.7} style={{ padding: 4 }}>
                  <X size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Compose Bar ───────────────────────────────────────── */}
            <View style={[styles.composeBar, { paddingBottom: keyboardVisible ? 8 : 24, backgroundColor: colors.background }]}>
              {isRecording ? (
                <View style={styles.recordingBar}>
                  <View style={[styles.recordingDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={[styles.recordingTime, { color: colors.foreground }]}>
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </Text>
                  <RecordingWaveform isActive={isRecording} color="#ef4444" />
                  <TouchableOpacity
                    style={[styles.recordCancelBtn, { backgroundColor: colors.secondary }]}
                    onPress={cancelRecording}
                    activeOpacity={0.7}
                  >
                    <X size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: '#ef4444' }]}
                    onPress={stopAndSendRecording}
                    activeOpacity={0.7}
                  >
                    <Send size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity activeOpacity={0.7} style={styles.attachBtn} onPress={() => setShowAttachMenu(true)}>
                    <Paperclip size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <View style={[styles.composeInput, { backgroundColor: colors.secondary }]}>
                    <TextInput
                      style={[styles.composeTextInput, { color: colors.foreground }]}
                      placeholder="Type a message..."
                      placeholderTextColor={colors.mutedForeground}
                      value={message}
                      onChangeText={setMessage}
                      multiline
                      maxLength={2000}
                    />
                  </View>
                  {message.trim() ? (
                    <TouchableOpacity
                      style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSend}
                      activeOpacity={0.7}
                    >
                      <Send size={18} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.sendBtn, { backgroundColor: colors.secondary }]}
                      onPress={startRecording}
                      activeOpacity={0.7}
                    >
                      <Mic size={20} color={colors.foreground} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* ─── Message Context Menu Modal ──────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View style={styles.menuContainer}>
            {/* Selected message preview */}
            {selectedMessage && (
              <View
                style={[
                  styles.menuPreview,
                  {
                    backgroundColor: selectedMessage.sender === 'me' ? colors.primary : colors.secondary,
                    alignSelf: selectedMessage.sender === 'me' ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.menuPreviewText,
                    { color: selectedMessage.sender === 'me' ? '#fff' : colors.foreground },
                  ]}
                  numberOfLines={2}
                >
                  {selectedMessage.text}
                </Text>
              </View>
            )}

            {/* Quick Reactions Row */}
            <View style={[styles.reactionsRow, { backgroundColor: colors.card }]}>
              {QUICK_REACTIONS.map((emoji) => {
                const isSelected = selectedMessage && reactions[selectedMessage.id] === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.reactionBtn,
                      isSelected && { backgroundColor: colors.secondary },
                    ]}
                    onPress={() => handleReaction(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reactionBtnEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Menu */}
            <View style={[styles.menuActions, { backgroundColor: colors.card }]}>
              {MENU_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                const isDestructive = (action as any).destructive;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.menuActionItem,
                      idx < MENU_ACTIONS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleMenuAction(action.id)}
                    activeOpacity={0.7}
                  >
                    <Icon size={18} color={isDestructive ? '#ef4444' : colors.foreground} />
                    <Text
                      style={[
                        styles.menuActionLabel,
                        { color: isDestructive ? '#ef4444' : colors.foreground },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ─── Attachment Menu Modal ──────────────────────────────── */}
      <Modal visible={showAttachMenu} transparent animationType="fade" onRequestClose={() => setShowAttachMenu(false)}>
        <Pressable style={styles.attachOverlay} onPress={() => setShowAttachMenu(false)}>
          <View style={[styles.attachMenu, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={[styles.attachMenuItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => handleSendAttachment('photo')}
            >
              <View style={[styles.attachMenuIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Image size={18} color="#2563eb" />
              </View>
              <Text style={[styles.attachMenuLabel, { color: colors.foreground }]}>Photo & Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attachMenuItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => handleSendAttachment('document')}
            >
              <View style={[styles.attachMenuIconWrap, { backgroundColor: '#f5f3ff' }]}>
                <File size={18} color="#8b5cf6" />
              </View>
              <Text style={[styles.attachMenuLabel, { color: colors.foreground }]}>Document</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ─── Delete Confirmation Modal ──────────────────────────── */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setDeleteModalVisible(false)}>
          <View style={[styles.deleteModal, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            {messageToDelete && (
              <View style={[styles.deletePreview, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.deletePreviewText, { color: colors.foreground }]} numberOfLines={2}>
                  {messageToDelete.text || (messageToDelete.type === 'voice' ? 'Voice message' : messageToDelete.type === 'photo' ? 'Photo' : 'Document')}
                </Text>
              </View>
            )}
            <Text style={[styles.deleteTitle, { color: colors.foreground }]}>Delete message?</Text>
            {messageToDelete?.sender === 'me' && (
              <TouchableOpacity
                style={[styles.deleteOption, { borderBottomColor: colors.border }]}
                onPress={() => handleDelete('everyone')}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={[styles.deleteOptionText, { color: '#ef4444' }]}>Delete for everyone</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.deleteOption, { borderBottomColor: colors.border }]}
              onPress={() => handleDelete('me')}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={colors.foreground} />
              <Text style={[styles.deleteOptionText, { color: colors.foreground }]}>Delete for me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteOption}
              onPress={() => setDeleteModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.deleteOptionText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ─── Forward Modal ──────────────────────────────────────── */}
      <Modal visible={forwardModalVisible} transparent animationType="slide" onRequestClose={() => { setForwardModalVisible(false); setSelectedForwardIds(new Set()); setForwardSearch(''); }}>
        <View style={[styles.forwardModal, { backgroundColor: colors.background }]}>
          <View style={[styles.forwardHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setForwardModalVisible(false); setMessagesToForward([]); setSelectedForwardIds(new Set()); setForwardSearch(''); }} activeOpacity={0.7}>
              <X size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.forwardTitle, { color: colors.foreground }]}>Forward to</Text>
            <View style={{ width: 22 }} />
          </View>
          {/* Search */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            <View style={[styles.forwardSearchWrap, { backgroundColor: colors.secondary }]}>
              <TextInput
                style={[styles.forwardSearchInput, { color: colors.foreground }]}
                placeholder="Search people or groups..."
                placeholderTextColor={colors.mutedForeground}
                value={forwardSearch}
                onChangeText={setForwardSearch}
                autoCorrect={false}
              />
            </View>
          </View>
          {/* Selected chips */}
          {selectedForwardIds.size > 0 && (
            <View style={styles.forwardChipsRow}>
              {FORWARD_CONTACTS.filter((c) => selectedForwardIds.has(c.id)).map((c) => (
                <TouchableOpacity key={c.id} style={[styles.forwardChip, { backgroundColor: colors.primary + '15' }]} onPress={() => toggleForwardContact(c.id)} activeOpacity={0.7}>
                  <Text style={[styles.forwardChipText, { color: colors.primary }]}>{c.name}</Text>
                  <X size={12} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
            {/* Groups section */}
            {filteredForwardContacts.some((c) => c.isGroup) && (
              <>
                <Text style={[styles.forwardSectionTitle, { color: colors.mutedForeground }]}>Groups</Text>
                {filteredForwardContacts.filter((c) => c.isGroup).map((contact) => {
                  const isChecked = selectedForwardIds.has(contact.id);
                  return (
                    <TouchableOpacity
                      key={contact.id}
                      style={[styles.forwardContactItem, { borderBottomColor: colors.border }]}
                      onPress={() => toggleForwardContact(contact.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.forwardAvatar, { backgroundColor: contact.color }]}>
                        <Text style={styles.forwardAvatarText}>{contact.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.forwardContactName, { color: colors.foreground }]}>{contact.name}</Text>
                        <Text style={[styles.forwardContactSub, { color: colors.mutedForeground }]}>Group</Text>
                      </View>
                      <View style={[styles.forwardCheck, isChecked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                        {isChecked && <Check size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            {/* People section */}
            {filteredForwardContacts.some((c) => !c.isGroup) && (
              <>
                <Text style={[styles.forwardSectionTitle, { color: colors.mutedForeground }]}>People</Text>
                {filteredForwardContacts.filter((c) => !c.isGroup).map((contact) => {
                  const isChecked = selectedForwardIds.has(contact.id);
                  return (
                    <TouchableOpacity
                      key={contact.id}
                      style={[styles.forwardContactItem, { borderBottomColor: colors.border }]}
                      onPress={() => toggleForwardContact(contact.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.forwardAvatar, { backgroundColor: contact.color }]}>
                        <Text style={styles.forwardAvatarText}>{contact.initials}</Text>
                      </View>
                      <Text style={[styles.forwardContactName, { color: colors.foreground, flex: 1 }]}>{contact.name}</Text>
                      <View style={[styles.forwardCheck, isChecked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                        {isChecked && <Check size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
          {/* Send button */}
          {selectedForwardIds.size > 0 && (
            <View style={[styles.forwardSendBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.forwardSendBtn, { backgroundColor: colors.primary }]} onPress={handleForwardSend} activeOpacity={0.8}>
                <Send size={18} color="#fff" />
                <Text style={styles.forwardSendText}>Send to {selectedForwardIds.size} chat{selectedForwardIds.size > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ─── Toast Notification ───────────────────────────────────── */}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast.message}</Text>
            {toast.undoAction && (
              <TouchableOpacity
                onPress={() => {
                  toast.undoAction?.();
                  dismissToast();
                }}
                activeOpacity={0.7}
                style={styles.toastUndoBtn}
              >
                <Text style={styles.toastUndoText}>UNDO</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerAvatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  headerStatus: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  headerPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerPlatformText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages
  messagesList: {
    padding: 16,
    gap: 8,
  },
  messageRow: {
    marginBottom: 4,
  },
  messageRowMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageBubbleMe: {
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  messageBubbleThem: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    lineHeight: 21,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },

  // Reaction bubble on message
  reactionBubble: {
    marginTop: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  reactionBubbleMe: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  reactionBubbleThem: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  reactionEmoji: {
    fontSize: 16,
  },

  // ─── Context Menu Modal ─────────────────────────────────────────────────

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 10,
  },
  menuPreview: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '85%',
  },
  menuPreviewText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  reactionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBtnEmoji: {
    fontSize: 22,
  },
  menuActions: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuActionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },

  // ─── Quick Actions Toolbar ──────────────────────────────────────────────

  toolbarContainer: {
    borderTopWidth: 0.5,
  },
  toolbarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  toolbarHeaderText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    flex: 1,
  },
  toolbarChipsScroll: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  toolbarChipsContent: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  toolbarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  toolbarChipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },

  // Panel
  panelContainer: {
    borderTopWidth: 0.5,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 230,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  panelTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  panelClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelSuggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  maturityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  maturityBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
  },
  suggestPanelItems: {
    gap: 6,
  },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  panelItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelItemContent: {
    flex: 1,
  },
  panelItemLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  panelItemLessonCount: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  panelItemDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  panelItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  panelItemTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  panelItemTagText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
  },
  panelItemMetaText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
  },

  // ─── AI Suggestion Pills ────────────────────────────────────────────────

  suggestionsContainer: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionsLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    flex: 1,
  },
  suggestionsPills: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  suggestionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    maxWidth: 260,
  },
  suggestionPillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // ─── Compose ────────────────────────────────────────────────────────────

  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 10,
  },
  attachBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    minHeight: 44,
  },
  composeTextInput: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    maxHeight: 100,
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Recording bar
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingHorizontal: 16,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingTime: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  recordingLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  recordCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  // Photo bubble
  photoBubble: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoFooter: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  // Voice message
  voiceMsgContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceDuration: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    marginLeft: 4,
  },

  // Attachment message content
  attachMsgContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Attachment menu
  attachOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  attachMenu: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  attachMenuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachMenuLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },

  // ─── Reply Preview Bar ──────────────────────────────────────────────────
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  replyBarContent: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  replyBarName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    marginBottom: 2,
  },
  replyBarText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },

  // ─── Reply Preview In Bubble ──────────────────────────────────────────
  replyPreviewInBubble: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  replyPreviewName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    marginBottom: 1,
  },
  replyPreviewText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },

  // ─── Forwarded Label ──────────────────────────────────────────────────
  forwardedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  forwardedText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    fontStyle: 'italic',
  },

  // ─── Deleted Message ──────────────────────────────────────────────────
  deletedBubble: {
    opacity: 0.7,
  },
  deletedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deletedText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    fontStyle: 'italic',
  },

  // ─── Select Mode ──────────────────────────────────────────────────────
  selectCheckbox: {
    justifyContent: 'center',
    paddingRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  selectToolbarBtn: {
    padding: 4,
  },
  selectCount: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    flex: 1,
    marginLeft: 12,
  },
  selectActions: {
    flexDirection: 'row',
    gap: 16,
  },
  selectActionBtn: {
    padding: 6,
  },

  // ─── Delete Modal ──────────────────────────────────────────────────────
  deleteModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  deletePreview: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  deletePreviewText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  deleteTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    marginBottom: 16,
    textAlign: 'center',
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    justifyContent: 'center',
  },
  deleteOptionText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },

  // ─── Forward Modal ─────────────────────────────────────────────────────
  forwardModal: {
    flex: 1,
    marginTop: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  forwardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  forwardTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
  forwardContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  forwardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forwardAvatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  forwardContactName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  forwardContactSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 1,
  },
  forwardSearchWrap: {
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    justifyContent: 'center',
  },
  forwardSearchInput: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    padding: 0,
  },
  forwardChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  forwardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  forwardChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  forwardSectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  forwardCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forwardSendBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 0.5,
  },
  forwardSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
  },
  forwardSendText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#fff',
  },

  // ─── Toast ──────────────────────────────────────────────────────────
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  toastUndoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toastUndoText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#3b82f6',
  },

  // Claim conversation
  claimBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  claimIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBannerInfo: {
    flex: 1,
    gap: 2,
  },
  claimBannerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  claimBannerDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  claimContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
    alignItems: 'center',
    gap: 10,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
  },
  claimBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  claimHint: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    textAlign: 'center',
  },
});
