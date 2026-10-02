// src/pages/shared/Notifications.jsx
// Shared notification inbox — all roles.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0">
            Notifications
            {unread > 0 && (
              <span className="badge bg-danger ms-2" style={{ fontSize: '0.75rem' }}>{unread} unread</span>
            )}
          </h4>
          <small className="text-muted">Status updates and important alerts about your complaints</small>
        </div>
        {unread > 0 && (
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={markAllRead}
            disabled={markingAll}
          >
            {markingAll ? 'Marking…' : '✅ Mark All Read'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger small py-2">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success spinner-border-sm" role="status" />
          <span className="ms-2 text-muted small">Loading…</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="section-card">
          <div className="text-center py-5 text-muted">
            <span className="fs-2 d-block mb-2">🔔</span>
            <p className="mb-0">No notifications yet. You'll be alerted when your complaints are updated.</p>
          </div>
        </div>
      ) : (
        <div className="section-card">
          <div className="section-card-header">🔔 Inbox ({notifications.length})</div>
          <div>
            {notifications.map((n, idx) => (
              <div
                key={n._id}
                className={`p-3 d-flex align-items-start gap-3 ${idx > 0 ? 'border-top' : ''} ${!n.read ? 'bg-light' : ''}`}
                style={{ cursor: n.read ? 'default' : 'pointer' }}
                onClick={() => !n.read && markOneRead(n._id)}
              >
                <span
                  className="mt-1"
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: n.read ? '#dee2e6' : '#dc3545',
                    flexShrink: 0,
                    marginTop: '5px',
                  }}
                />
                <div className="flex-grow-1">
                  <p className={`mb-1 small ${!n.read ? 'fw-semibold' : ''}`}>{n.message}</p>
                  <div className="d-flex gap-3 flex-wrap">
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {n.complaint && (
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Ref: <code className="text-success">{n.complaint.reference}</code> — {n.complaint.title}
                      </span>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <span className="badge bg-danger" style={{ fontSize: '0.65rem', flexShrink: 0 }}>New</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
