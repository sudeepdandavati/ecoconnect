import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, User, MessageSquare } from 'lucide-react';

const ChatPanel = ({ donationId, counterpartName }) => {
  const { user, authFetch, socket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch initial message history and listen to socket room
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`/donations/${donationId}/messages`);
        if (res.success) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    if (socket) {
      // Enter the socket room for this donation
      socket.emit('joinDonation', donationId);

      // Listen for incoming messages
      const handleNewMessage = (msg) => {
        // Prevent duplicate messages
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      };

      socket.on('chatMessage', handleNewMessage);

      return () => {
        socket.off('chatMessage', handleNewMessage);
      };
    }
  }, [donationId, socket]);

  // Scroll on message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageToSend = inputText.trim();
    setInputText('');

    try {
      const res = await authFetch(`/donations/${donationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: messageToSend }),
      });

      if (res.success) {
        // Append local message in case of delays, socket handles broadcasts
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '360px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--surface-border)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <MessageSquare size={16} color="var(--primary)" />
        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
          Coordinating with {counterpartName || 'Partner'}
        </span>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '20px' }}>
            Loading messaging feed...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '20px' }}>
            No messages logged yet. Send a message to coordinate pickup timing/details.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            return (
              <div 
                key={msg._id || Math.random()} 
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                }}
              >
                {/* Sender badge (only for counterpart) */}
                {!isMe && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', marginLeft: '4px' }}>
                    {msg.sender?.name || 'Partner'}
                  </span>
                )}
                
                {/* Bubble content */}
                <div style={{
                  padding: '8px 14px',
                  borderRadius: isMe ? '12px 12px 0 12px' : '0 12px 12px 12px',
                  background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                  color: isMe ? 'var(--text-dark)' : '#f3f4f6',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  boxShadow: 'var(--shadow-sm)',
                  border: isMe ? 'none' : '1px solid var(--surface-border)',
                }}>
                  {msg.text}
                </div>

                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  display: 'block',
                  textAlign: isMe ? 'right' : 'left',
                  marginTop: '2px',
                  marginRight: isMe ? '4px' : '0',
                }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSendMessage} style={{
        padding: '10px',
        borderTop: '1px solid var(--surface-border)',
        background: 'rgba(255,255,255,0.01)',
        display: 'flex',
        gap: '8px',
      }}>
        <input
          type="text"
          className="form-input"
          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          placeholder="Write coordination message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 12px' }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
