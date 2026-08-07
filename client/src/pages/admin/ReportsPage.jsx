/**
 * ReportsPage (US23/US29): admin moderation queue for user reports with filters, a detail side
 * panel (report, both profiles, other reports, moderation history) and resolve/dismiss/warn/
 * suspend/ban actions that require a note.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { REPORT_REASONS } from '../../components/reports/ReportUserModal';
import '../../components/common/features.css';
import './ReportsPage.css';

const STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed', 'all'];
const reasonLabel = (v) => REPORT_REASONS.find((r) => r.value === v)?.label || v;
const fmt = (d) => (d ? new Date(d).toLocaleString() : '-');

function ReportsPage() {
  const [status, setStatus] = useState('pending');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ reports: [], total: 0, counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/admin/reports', { params: { status, reason: reason || undefined, page, limit } });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [status, reason, page]);

  useEffect(() => { load(); }, [load]);

  const open = async (id) => {
    setSelected(id);
    setDetail(null);
    setNote('');
    setActionError('');
    try {
      const res = await axiosInstance.get(`/admin/reports/${id}`);
      setDetail(res.data);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to load report.');
    }
  };

  const act = async (action) => {
    setActionError('');
    if (action !== 'review' && note.trim().length < 5) return setActionError('Please add a resolution note (min 5 characters).');
    if (action === 'ban' && !window.confirm('Permanently ban this user?')) return;
    setBusy(true);
    try {
      await axiosInstance.put(`/admin/reports/${selected}/resolve`, { action, note: note.trim(), days: action === 'suspend' ? Number(days) : undefined });
      await open(selected);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const pages = Math.max(Math.ceil((data.total || 0) / limit), 1);
  const r = detail?.report;
  const closed = r && ['resolved', 'dismissed'].includes(r.status);

  return (
    <div className="rp-page">
      <div className="rp-head">
        <div>
          <h1>Reported Users</h1>
          <p>Review reports, take action and keep a record of every decision.</p>
        </div>
      </div>

      <div className="rp-filters">
        <div className="rp-chips">
          {STATUSES.map((s) => (
            <button key={s} className={status === s ? 'active' : ''} onClick={() => { setPage(1); setStatus(s); }}>
              {s}{s !== 'all' && data.counts?.[s] !== undefined ? ` (${data.counts[s]})` : ''}
            </button>
          ))}
        </div>
        <select value={reason} onChange={(e) => { setPage(1); setReason(e.target.value); }} aria-label="Filter by reason">
          <option value="">All reasons</option>
          {REPORT_REASONS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
        </select>
      </div>

      {error && <div className="fx-alert fx-alert--error">{error}</div>}
      {loading ? <div className="rp-empty">Loading…</div> : data.reports.length === 0 ? (
        <div className="rp-empty">No reports match this filter.</div>
      ) : (
        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead><tr><th>Reported user</th><th>Reason</th><th>Reporter</th><th>Reports vs user</th><th>Status</th><th>Filed</th></tr></thead>
            <tbody>
              {data.reports.map((x) => (
                <tr key={x.id} onClick={() => open(x.id)} className={selected === x.id ? 'selected' : ''} data-testid="report-row">
                  <td><strong>{x.reported_name || x.reported_user_id}</strong><div className="rp-sub">{x.reported_role} · {x.reported_status}</div></td>
                  <td>{reasonLabel(x.reason)}</td>
                  <td>{x.reporter_name}</td>
                  <td>{x.reports_against_user}</td>
                  <td><span className={`rp-status rp-status--${x.status}`}>{x.status}</span></td>
                  <td>{fmt(x.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="rp-pager">
        <button className="fx-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button className="fx-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {selected && (
        <aside className="rp-panel" aria-label="Report details">
          <button className="rp-close" onClick={() => { setSelected(null); setDetail(null); }} aria-label="Close panel"><X size={18} /></button>
          {!detail ? <p>Loading…</p> : (
            <>
              <h2>Report details</h2>
              <span className={`rp-status rp-status--${r.status}`}>{r.status}</span>
              <dl>
                <dt>Reason</dt><dd>{reasonLabel(r.reason)}</dd>
                <dt>Description</dt><dd className="rp-desc">{r.description}</dd>
                <dt>Filed</dt><dd>{fmt(r.created_at)}</dd>
                <dt>Reporter</dt><dd>{r.reporter_name} ({r.reporter_role}) · {r.reporter_email}</dd>
                <dt>Reported user</dt>
                <dd>{r.reported_name} ({r.reported_role}) · {r.reported_email}<br />
                  Account status: <strong>{r.reported_status}</strong>
                  {r.reported_suspended_until && ` until ${fmt(r.reported_suspended_until)}`}
                  {r.reported_status_reason && ` — ${r.reported_status_reason}`}
                  <br />Trust score: {r.reported_trust_score}</dd>
                {r.resolution_note && (<><dt>Resolution</dt><dd>{r.resolution_note} <em>({fmt(r.resolved_at)})</em></dd></>)}
              </dl>

              {detail.otherReports.length > 0 && (
                <>
                  <h3>Other reports against this user</h3>
                  <ul className="rp-list">{detail.otherReports.map((o) => <li key={o.id}>{reasonLabel(o.reason)} · {o.status} · {fmt(o.created_at)}</li>)}</ul>
                </>
              )}
              {detail.moderationHistory.length > 0 && (
                <>
                  <h3>Moderation history</h3>
                  <ul className="rp-list">{detail.moderationHistory.map((h) => <li key={h.id}>{h.action} · {fmt(h.created_at)}</li>)}</ul>
                </>
              )}

              {!closed && (
                <div className="rp-actions">
                  <h3>Take action</h3>
                  {actionError && <div className="fx-alert fx-alert--error" role="alert">{actionError}</div>}
                  <div className="fx-field">
                    <label htmlFor="rp-note">Resolution note (sent to the user where relevant)</label>
                    <textarea id="rp-note" value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                  <div className="fx-field">
                    <label htmlFor="rp-days">Suspension length (days)</label>
                    <input id="rp-days" type="number" min="1" max="3650" value={days} onChange={(e) => setDays(e.target.value)} />
                  </div>
                  <div className="rp-buttons">
                    {r.status === 'pending' && <button className="fx-btn" disabled={busy} onClick={() => act('review')}>Mark reviewing</button>}
                    <button className="fx-btn" disabled={busy} onClick={() => act('dismiss')}>Dismiss</button>
                    <button className="fx-btn" disabled={busy} onClick={() => act('warn')}>Warn user</button>
                    <button className="fx-btn fx-btn--primary" disabled={busy} onClick={() => act('resolve')}>Resolve</button>
                    <button className="fx-btn fx-btn--danger" disabled={busy} onClick={() => act('suspend')}>Suspend</button>
                    <button className="fx-btn fx-btn--danger" disabled={busy} onClick={() => act('ban')}>Ban</button>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      )}
    </div>
  );
}

export default ReportsPage;
