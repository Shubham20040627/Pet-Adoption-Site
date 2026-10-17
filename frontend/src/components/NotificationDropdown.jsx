import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { commonApi } from '../api/commonApi';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const NotificationDropdown = ({ placement = 'bottom' }) => {
  const { unreadCount, refreshNotifications, isAdopter } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await commonApi.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifs();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await commonApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      refreshNotifications();
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await commonApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshNotifications();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="notif-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={handleToggle}
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="icon-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div
          className="notif-menu card"
          style={
            placement === 'sidebar'
              ? {
                  position: 'absolute',
                  left: 'calc(100% + 12px)',
                  bottom: '-10px',
                  width: '320px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  zIndex: 1300,
                  padding: '0.75rem',
                  boxShadow: 'var(--shadow-xl)',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }
              : {
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '320px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  zIndex: 1100,
                  padding: '0.75rem',
                  boxShadow: 'var(--shadow-lg)',
                }
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-light)',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                className="btn-light btn-sm"
                onClick={handleMarkAllRead}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem' }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No notifications yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: n.read ? 'transparent' : 'var(--color-primary-subtle)',
                    border: '1px solid',
                    borderColor: n.read ? 'var(--border-subtle)' : 'var(--color-primary-border)',
                    fontSize: '0.82rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{n.title}</strong>
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkRead(n.id, e)}
                        title="Mark as read"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  {isAdopter && n.type === 'status_change' && (
                    <Link
                      to="/my-applications"
                      onClick={() => setIsOpen(false)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: '0.4rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-secondary)',
                      }}
                    >
                      View Application Tracker <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
