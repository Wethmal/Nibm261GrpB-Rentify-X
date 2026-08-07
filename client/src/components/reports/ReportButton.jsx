/**
 * ReportButton: small "Report" link that opens ReportUserModal. Renders nothing for
 * anonymous visitors or when reporting yourself.
 */
import React, { useContext, useState } from 'react';
import { Flag } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext.jsx';
import ReportUserModal from './ReportUserModal';
import '../common/features.css';

function ReportButton({ userId, userName, bookingId, label = 'Report' }) {
  const { user, isAuthenticated } = useContext(AuthContext) || {};
  const [open, setOpen] = useState(false);
  if (!isAuthenticated || !userId || user?.id === userId || user?.role === 'admin') return null;
  return (
    <>
      <button type="button" className="fx-link-btn" onClick={() => setOpen(true)} data-testid="report-user-button">
        <Flag size={14} /> {label}
      </button>
      {open && <ReportUserModal userId={userId} userName={userName} bookingId={bookingId} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ReportButton;
