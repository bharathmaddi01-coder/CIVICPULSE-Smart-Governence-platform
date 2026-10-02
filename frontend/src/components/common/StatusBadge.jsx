// src/components/common/StatusBadge.jsx
// Standard status badge used across all complaint tables and detail views.

const STATUS_LABELS = {
  PENDING:     'Pending',
  ASSIGNED:    'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
  REOPENED:    'Reopened',
  CLOSED:      'Closed',
  REJECTED:    'Rejected',
};

export const StatusBadge = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className={`badge fw-semibold px-2 py-1 status-${status}`}
      style={{ fontSize: '0.78rem', borderRadius: '4px' }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
