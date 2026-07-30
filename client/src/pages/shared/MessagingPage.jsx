import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { 
  Send, User, Clock, MessageSquare, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReportButton from '../../components/reports/ReportButton';
import './MessagingPage.css';

function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      setLoadingConv(true);
      const response = await axiosInstance.get('/messages/conversations');
      setConversations(response.data.conversations || []);
      if (response.data.conversations?.length > 0) {
        setActiveBookingId(response.data.conversations[0].booking_id);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setConversations([]);
      } else {
        setError('Failed to fetch conversations');
      }
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (bookingId) => {
    try {
      setLoadingMsg(true);
      const response = await axiosInstance.get(`/messages/${bookingId}`);
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (err) {
      if (err.response?.status === 404) {
        setMessages([]);
      }
    } finally {
      setLoadingMsg(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Live chat over SSE (US17): append incoming messages, update read receipts
  useEffect(() => {
    const onMessage = (e) => {
      const m = e.detail;
      if (m.booking_id === activeBookingId) {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        axiosInstance.get(`/messages/${m.booking_id}`).catch(() => {}); // marks as read
        scrollToBottom();
      }
      setConversations((prev) => prev.map((c) => c.booking_id === m.booking_id
        ? { ...c, last_message: m.content, last_message_at: m.created_at, unread_count: m.booking_id === activeBookingId ? 0 : (c.unread_count || 0) + 1 }
        : c));
    };
    const onRead = (e) => {
      if (e.detail.bookingId === activeBookingId) {
        const ids = new Set(e.detail.ids);
        setMessages((prev) => prev.map((x) => (ids.has(x.id) ? { ...x, is_read: true } : x)));
      }
    };
    window.addEventListener('rentify:message', onMessage);
    window.addEventListener('rentify:message_read', onRead);
    return () => {
      window.removeEventListener('rentify:message', onMessage);
      window.removeEventListener('rentify:message_read', onRead);
    };
  }, [activeBookingId]);

  useEffect(() => {
    if (activeBookingId) {
      fetchMessages(activeBookingId);
    }
  }, [activeBookingId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeBookingId) return;

    const tempMessage = {
      id: 'temp_' + Date.now(),
      sender_id: user?.id,
      content: newMessage,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      await axiosInstance.post(`/messages/${activeBookingId}`, { content: tempMessage.content });
      // Fetch latest to get real ID
      fetchMessages(activeBookingId);
    } catch (err) {
      // Revert if failed
      setMessages(messages.filter(m => m.id !== tempMessage.id));
      alert('Failed to send message');
    }
  };

  const activeConversation = conversations.find(c => c.booking_id === activeBookingId);

  return (
    <div className="messaging-page">
      <div className="page-header">
        <div>
          <h1>Messages</h1>
          <p>Communicate with the other party in your bookings.</p>
        </div>
      </div>

      <div className="messaging-container">
        {/* Sidebar */}
        <div className="conversations-sidebar">
          {loadingConv ? (
            <div className="p-4 text-gray-500">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="empty-conversations">
              <MessageSquare size={32} className="text-gray-400 mb-2" />
              <p>No active conversations.</p>
            </div>
          ) : (
            <ul className="conversations-list">
              {conversations.map(conv => (
                <li 
                  key={conv.booking_id}
                  className={`conversation-item ${activeBookingId === conv.booking_id ? 'active' : ''}`}
                  onClick={() => setActiveBookingId(conv.booking_id)}
                >
                  <div className="conv-avatar">
                    <User size={20} />
                  </div>
                  <div className="conv-info">
                    <h4>{conv.other_party_name}</h4>
                    <span className="conv-booking">Booking #{conv.booking_id}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {activeBookingId ? (
            <>
              <div className="chat-header">
                <h3>
                  {user?.role === 'consumer' && activeConversation?.other_user_id ? (
                    <Link to={`/providers/${activeConversation.other_user_id}`}>{activeConversation.other_party_name || 'Chat'}</Link>
                  ) : (activeConversation?.other_party_name || 'Chat')}
                </h3>
                <span className="text-sm text-gray-500">Booking #{activeBookingId}</span>
                {activeConversation?.other_user_id && (
                  <ReportButton userId={activeConversation.other_user_id} userName={activeConversation.other_party_name} bookingId={activeBookingId} />
                )}
              </div>
              
              <div className="messages-container">
                {loadingMsg ? (
                  <div className="flex justify-center items-center h-full text-gray-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages yet. Send a message to start the conversation.</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`message-bubble-wrapper ${isMe ? 'me' : 'them'}`}>
                          <div className={`message-bubble ${isMe ? 'bg-primary text-white' : 'bg-surface'}`}>
                            <p>{msg.content}</p>
                            <span className="message-time">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && (
                                <span className="message-status" title={msg.is_read ? 'Read' : msg.delivered_at ? 'Delivered' : 'Sent'} style={{ marginLeft: 6 }}>
                                  {msg.is_read ? '✓✓ Read' : msg.delivered_at ? '✓✓ Delivered' : '✓ Sent'}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-form">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageSquare size={48} className="text-gray-300 mb-4" />
              <h3>Select a conversation</h3>
              <p>Choose a booking conversation from the sidebar to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagingPage;
