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
import { petsApi } from '../api/petsApi';
import AdopterHeader from '../components/AdopterHeader';
import ScheduleMeetAndGreetModal from '../components/ScheduleMeetAndGreetModal';
import '../styles/chat.css';

const FALLBACK_PET_IMG = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&auto=format&fit=crop';

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

  // 1. Load Conversations from Database
  const fetchConversations = async () => {
    try {
      const res = await adoptionsApi.getConversations();
      const list = res.conversations || [];
      setConversations(list);
      return list;
    } catch (e) {
      console.warn('Could not fetch conversations:', e);
      setConversations([]);
      return [];
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
        } else {
          try {
            const petRes = await petsApi.getById(petParamId);
            const petObj = petRes.pet || petRes;
            if (petObj && (petObj.id || petObj._id)) {
              const newThread = {
                thread_id: `inquiry_${petObj.id || petObj._id}`,
                pet_id: petObj.id || petObj._id,
                pet: petObj,
                other_party: {
                  id: petObj.shelter_id,
                  name: petObj.shelter_name || 'Shelter',
                  role: 'shelter',
                },
                application: null,
                last_message: null,
                unread_count: 0
              };
              setActiveThread(newThread);
              return;
            }
          } catch (err) {
            console.warn('Could not load pet for chat inquiry:', err);
          }
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
      setMessages(res.messages || []);
    } catch (e) {
      console.warn('Could not fetch thread messages:', e);
      setMessages([]);
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
            {filteredConversations.length === 0 ? (
              <div className="chat-empty-sidebar-state" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#6B7280' }}>
                <PawPrint size={32} color="#9CA3AF" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
                <p style={{ margin: '0 0 0.4rem 0', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>No Conversations Yet</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.4 }}>
                  When you apply for a pet or message a shelter, your chats will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => {
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
                          {conv.last_message?.text || 'No messages yet'}
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
              })
            )}
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
              {messages.length === 0 ? (
                <div className="chat-empty-thread-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', margin: 'auto' }}>
                  <MessageSquare size={38} color="#10B981" style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.8 }} />
                  <h4 style={{ margin: '0 0 0.4rem 0', color: '#14382A', fontWeight: 700, fontSize: '1rem' }}>No messages in this chat yet</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', maxWidth: '340px', lineHeight: 1.4 }}>
                    Send your first message to {activeOther.name || 'the shelter'} below to start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
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
                })
              )}
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
            <h3 className="chat-empty-title">Your Messages</h3>
            <p className="chat-empty-desc">
              {conversations.length === 0
                ? 'You have no active conversations yet. Explore pets and submit an inquiry or adoption application to connect with verified shelters.'
                : 'Choose a conversation thread from the left to view messages and chat with shelters.'}
            </p>
            {conversations.length === 0 && (
              <Link
                to="/pets"
                className="ap-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginTop: '1rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                <PawPrint size={16} /> Browse Pets for Adoption
              </Link>
            )}
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
