import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Calendar, 
  CheckCheck, 
  Check, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  PawPrint,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adoptionsApi } from '../api/adoptionsApi';
import AdopterHeader from '../components/AdopterHeader';
import ScheduleMeetAndGreetModal from '../components/ScheduleMeetAndGreetModal';
import '../styles/chat.css';

const FALLBACK_PET_IMG = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&auto=format&fit=crop';

// Sample fallback conversations for initial demo
const DEMO_CONVERSATIONS = [
  {
    thread_id: 'luna_thread',
    pet_id: 'demo-luna',
    adopter_id: 'demo-adopter',
    shelter_id: 'demo-shelter',
    pet: {
      id: 'demo-luna',
      name: 'Luna',
      breed: 'Border Collie Mix',
      species: 'Dog',
      image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop',
    },
    other_party: {
      id: 'demo-shelter',
      name: 'Hope & Paws Animal Sanctuary',
      role: 'shelter',
    },
    application: {
      status: 'approved',
      created_at: '2026-10-16T09:15:00Z',
    },
    last_message: {
      text: "Saturday between 10:00 AM and 1:00 PM works perfectly! We'll have her go-home packet ready.",
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      sender_name: 'Hope & Paws Animal Sanctuary',
      sender_role: 'shelter',
    },
    unread_count: 0,
  },
  {
    thread_id: 'oliver_thread',
    pet_id: 'demo-oliver',
    adopter_id: 'demo-adopter',
    shelter_id: 'demo-shelter',
    pet: {
      id: 'demo-oliver',
      name: 'Oliver',
      breed: 'Russian Blue Mix',
      species: 'Cat',
      image_url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&auto=format&fit=crop',
    },
    other_party: {
      id: 'demo-shelter',
      name: 'Sunny Paws Community Rescue',
      role: 'shelter',
    },
    application: {
      status: 'submitted',
      created_at: '2026-10-16T10:30:00Z',
    },
    last_message: {
      text: 'Hello DEF! Oliver thrives in calm, quiet spaces with cozy sunny spots. Reviewing your application today!',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      sender_name: 'Sunny Paws Community Rescue',
      sender_role: 'shelter',
    },
    unread_count: 1,
  },
  {
    thread_id: 'max_thread',
    pet_id: 'demo-max',
    adopter_id: 'demo-adopter',
    shelter_id: 'demo-shelter',
    pet: {
      id: 'demo-max',
      name: 'Max',
      breed: 'Golden Retriever Mix',
      species: 'Dog',
      image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop',
    },
    other_party: {
      id: 'demo-shelter',
      name: 'Hope & Paws Animal Sanctuary',
      role: 'shelter',
    },
    application: {
      status: 'approved',
      created_at: '2026-10-14T14:20:00Z',
    },
    last_message: {
      text: 'Max is doing fantastic! Long morning walks and already learned sit and paw!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      sender_name: 'DEF',
      sender_role: 'adopter',
    },
    unread_count: 0,
  }
];

const DEMO_LUNA_MESSAGES = [
  {
    id: 'm1',
    sender_id: 'demo-adopter',
    sender_name: 'DEF',
    sender_role: 'adopter',
    message: "Hello Hope & Paws team! We are so thrilled that Luna's adoption was approved. We are preparing our home for her this week!",
    created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: 'm2',
    sender_id: 'demo-shelter',
    sender_name: 'Hope & Paws Animal Sanctuary',
    sender_role: 'shelter',
    message: "Hi DEF! Congratulations again! Luna is in wonderful spirits. Her vaccinations and digital care certificate are complete and ready for you.",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'm3',
    sender_id: 'demo-adopter',
    sender_name: 'DEF',
    sender_role: 'adopter',
    message: "Awesome! We've got her bed and harness ready. What time is best for her pickup on Saturday?",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'm4',
    sender_id: 'demo-shelter',
    sender_name: 'Hope & Paws Animal Sanctuary',
    sender_role: 'shelter',
    message: "Saturday between 10:00 AM and 1:00 PM works perfectly! We'll have her go-home packet and adoption agreement copy printed out for you.",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  }
];

const QUICK_PROMPTS = [
  "When can we schedule a Meet & Greet?",
  "How is the pet with other pets?",
  "Are vaccinations up to date?",
  "What is the daily feeding schedule?",
  "Can I see more photos of the pet?"
];

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const petParamId = searchParams.get('pet_id');

  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load Conversations
  const fetchConversations = async () => {
    try {
      const res = await adoptionsApi.getConversations();
      const list = res.conversations || [];
      if (list.length > 0) {
        setConversations(list);
        return list;
      } else {
        setConversations(DEMO_CONVERSATIONS);
        return DEMO_CONVERSATIONS;
      }
    } catch (e) {
      console.warn('Could not fetch conversations, using fallback:', e);
      setConversations(DEMO_CONVERSATIONS);
      return DEMO_CONVERSATIONS;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const list = await fetchConversations();
      // Set active thread based on URL param or first item
      if (petParamId) {
        const found = list.find(c => String(c.pet_id) === String(petParamId));
        if (found) {
          setActiveThread(found);
          return;
        }
      }
      if (list.length > 0 && !activeThread) {
        setActiveThread(list[0]);
      }
    })();
  }, [petParamId]);

  // 2. Fetch thread messages when activeThread changes
  const fetchMessages = async (thread) => {
    if (!thread) return;
    try {
      const res = await adoptionsApi.getThreadMessages(thread.pet_id, thread.other_party?.id);
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else if (thread.thread_id === 'luna_thread' || thread.pet?.name === 'Luna') {
        setMessages(DEMO_LUNA_MESSAGES);
      } else {
        setMessages([]);
      }
    } catch (e) {
      if (thread.thread_id === 'luna_thread' || thread.pet?.name === 'Luna') {
        setMessages(DEMO_LUNA_MESSAGES);
      } else {
        setMessages([]);
      }
    }
  };

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread);
    }
  }, [activeThread]);

  // Scroll on message change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Real-Time Polling every 3.5 seconds
  useEffect(() => {
    if (!activeThread) return;
    const interval = setInterval(() => {
      fetchMessages(activeThread);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeThread]);

  // 4. Send message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic UI addition
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user?.id || 'temp',
      sender_name: user?.name || 'Me',
      sender_role: user?.role || 'adopter',
      message: text,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await adoptionsApi.sendMessage({
        pet_id: activeThread.pet_id,
        recipient_id: activeThread.other_party?.id,
        application_id: activeThread.application?.id || activeThread.application?._id,
        message: text,
      });
      // Refresh messages from backend
      fetchMessages(activeThread);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Quick chip click
  const handleQuickChip = (prompt) => {
    setInputText(prompt);
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const petName = c.pet?.name?.toLowerCase() || '';
    const otherName = c.other_party?.name?.toLowerCase() || '';
    const breed = c.pet?.breed?.toLowerCase() || '';
    return petName.includes(q) || otherName.includes(q) || breed.includes(q);
  });

  const activePet = activeThread?.pet || {};
  const activeOther = activeThread?.other_party || {};
  const activeApp = activeThread?.application;
  const statusStr = (activeApp?.status || 'Active Inquiry').replace('_', ' ');

  return (
    <div className="ap-page">
      <AdopterHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />

      <div className="chat-page-container">
        {/* ================================================================
            LEFT COLUMN: CONVERSATION THREADS
            ================================================================ */}
        <div className="chat-sidebar-pane">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-title-row">
              <h2 className="chat-sidebar-title">
                <MessageSquare size={22} color="#14382A" strokeWidth={2.2} /> Messages
              </h2>
              <span className="chat-sidebar-count-badge">
                {conversations.length} Active
              </span>
            </div>

            <div className="chat-search-input-wrap">
              <Search size={15} />
              <input
                className="chat-search-input"
                placeholder="Search pet or shelter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-threads-scroll">
            {filteredConversations.map(conv => {
              const isSelected = activeThread?.thread_id === conv.thread_id || activeThread?.pet_id === conv.pet_id;
              const pet = conv.pet || {};
              const other = conv.other_party || {};
              const timeStr = conv.last_message?.created_at
                ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={conv.thread_id || conv.pet_id}
                  className={`chat-thread-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveThread(conv)}
                >
                  <div className="chat-thread-avatar-wrap">
                    <img
                      src={pet.image_url || pet.photo_url || FALLBACK_PET_IMG}
                      alt={pet.name}
                      className="chat-thread-pet-thumb"
                      onError={e => { e.target.src = FALLBACK_PET_IMG; }}
                    />
                    <div className="chat-thread-online-indicator" />
                  </div>

                  <div className="chat-thread-body">
                    <div className="chat-thread-top-row">
                      <span className="chat-thread-pet-name">{pet.name || 'Pet'}</span>
                      <span className="chat-thread-time">{timeStr}</span>
                    </div>

                    <div className="chat-thread-party-name">
                      {other.name || 'Shelter'}
                    </div>

                    <div className="chat-thread-preview-row">
                      <p className="chat-thread-last-msg">
                        {conv.last_message?.text || 'Tap to start conversation...'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="chat-thread-unread-pill">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================
            RIGHT COLUMN: ACTIVE CHAT CONVERSATION
            ================================================================ */}
        {activeThread ? (
          <div className="chat-main-pane">
            {/* Chat Top Header */}
            <div className="chat-main-header">
              <div className="chat-header-left">
                <img
                  src={activePet.image_url || activePet.photo_url || FALLBACK_PET_IMG}
                  alt={activePet.name}
                  className="chat-header-pet-img"
                  onError={e => { e.target.src = FALLBACK_PET_IMG; }}
                />
                <div className="chat-header-info">
                  <div className="chat-header-title-wrap">
                    <h3 className="chat-header-pet-name">{activePet.name}</h3>
                    <span className={`chat-header-status-pill ${activeApp?.status || 'inquiry'}`}>
                      {statusStr}
                    </span>
                  </div>
                  <div className="chat-header-subtext">
                    <span>{activeOther.name}</span>
                    <span>•</span>
                    <span>{activePet.breed || 'Rescue Pet'}</span>
                  </div>
                </div>
              </div>

              {/* Action Shortcuts */}
              <div className="chat-header-actions">
                <button
                  type="button"
                  className="chat-header-action-btn primary"
                  onClick={() => setScheduleModalOpen(true)}
                  title="Schedule a physical or virtual visit"
                >
                  <Calendar size={14} /> Schedule Visit
                </button>

                {activePet.id && (
                  <Link
                    to={`/pets/${activePet.id || activePet._id}`}
                    className="chat-header-action-btn"
                    title="View Full Pet Profile"
                  >
                    <ExternalLink size={14} /> Profile
                  </Link>
                )}
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="chat-messages-viewport">
              {/* Context Summary Banner */}
              <div className="chat-system-card">
                <div className="chat-system-card-title">
                  <ShieldCheck size={16} color="#059669" />
                  <span>Adoption Communication Channel</span>
                </div>
                <p className="chat-system-card-desc">
                  This direct channel connects you with <strong>{activeOther.name}</strong> regarding <strong>{activePet.name}</strong>. Keep discussions friendly, timely, and focused on pet readiness.
                </p>
              </div>

              <div className="chat-date-separator">Today</div>

              {/* Message List */}
              {messages.map((m, idx) => {
                const isMe = String(m.sender_id) === String(user?.id) || m.sender_role === user?.role || m.pending;
                const timeStr = m.created_at
                  ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={m.id || m._id || idx}
                    className={`chat-message-row ${isMe ? 'outgoing' : 'incoming'}`}
                  >
                    {!isMe && (
                      <span className="chat-sender-label">
                        {m.sender_name || activeOther.name}
                      </span>
                    )}

                    <div className="chat-bubble">
                      {m.message}
                    </div>

                    <div className="chat-meta-row">
                      <span>{timeStr}</span>
                      {isMe && (
                        m.pending ? <Clock size={11} /> : <CheckCheck size={12} color="#10B981" />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="chat-quick-prompts-bar">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  className="chat-quick-chip"
                  onClick={() => handleQuickChip(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Bottom Composer */}
            <div className="chat-composer-wrap">
              <form className="chat-composer-form" onSubmit={handleSendMessage}>
                <input
                  className="chat-composer-input"
                  placeholder={`Type a message to ${activeOther.name || 'Shelter'}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!inputText.trim() || sending}
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="chat-main-pane chat-empty-state">
            <div className="chat-empty-icon-wrap">
              <MessageSquare size={36} />
            </div>
            <h3 className="chat-empty-title">Select a Conversation</h3>
            <p className="chat-empty-desc">
              Choose an application or pet inquiry from the left to start communicating directly with verified shelters.
            </p>
          </div>
        )}
      </div>

      {/* Schedule Visit Modal Integration */}
      {scheduleModalOpen && activePet && (
        <ScheduleMeetAndGreetModal
          isOpen={scheduleModalOpen}
          pet={activePet}
          applicationId={activeApp?.id || activeApp?._id}
          onClose={() => setScheduleModalOpen(false)}
          onSuccess={() => {
            setScheduleModalOpen(false);
            fetchConversations();
          }}
        />
      )}
    </div>
  );
};

export default MessagesPage;
