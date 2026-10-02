// src/components/common/Timeline.jsx
// Vertical timeline component for complaint history events.

const EVENT_ICONS = {
  CREATED:             '📝',
  ASSIGNED:            '👤',
  STATUS_CHANGED:      '🔄',
  RESOLUTION_CREATED:  '📋',
  RESOLVED:            '✅',
  VERIFIED:            '☑️',
  REOPENED:            '🔁',
  CLOSED:              '🔒',
};

export const Timeline = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-muted small">No timeline events recorded.</p>;
  }

  return (
    <ul className="timeline-list">
      {history.map((event, idx) => (
        <li key={idx} className="timeline-item">
          <span className="timeline-dot" />
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span>{EVENT_ICONS[event.eventType] || '📌'}</span>
              <strong className="small">{event.description}</strong>
            </div>
            <div className="d-flex gap-3 mt-1 flex-wrap">
              <span className="timeline-time">
                🕒 {event.eventAt ? new Date(event.eventAt).toLocaleString() : '—'}
              </span>
              {event.performedByName && (
                <span className="timeline-by">By: {event.performedByName}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default Timeline;
