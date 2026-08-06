/**
 * ProviderEarningsPage (US27): summary cards, 6-month bar chart and payout history table.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Clock, TrendingUp, Percent, Download } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import BarChart from '../../components/common/BarChart';
import '../../components/common/features.css';
import './ProviderEarningsPage.css';

export const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleString('en', { month: 'short' });

function ProviderEarningsPage() {
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, p] = await Promise.all([
        axiosInstance.get('/providers/me/earnings/summary'),
        axiosInstance.get('/providers/me/payouts', { params: { page, limit, status: status || undefined } }),
      ]);
      setSummary(s.data);
      setPayouts(p.data.payouts || []);
      setTotal(p.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const res = await axiosInstance.get('/providers/me/earnings/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rentify-payouts.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('CSV export failed.');
    }
  };

  const pages = Math.max(Math.ceil(total / limit), 1);
  const s = summary?.summary;

  return (
    <div className="earnings-page">
      <div className="earnings-header">
        <div>
          <h1>Earnings &amp; Payouts</h1>
          <p>Track your income, pending balance and payout history. A 10% platform fee applies to each completed booking.</p>
        </div>
        <div className="earnings-header__actions">
          <Link to="/provider/dashboard" className="fx-btn">Back to dashboard</Link>
          <button className="fx-btn fx-btn--primary" onClick={exportCsv}><Download size={14} /> Export CSV</button>
        </div>
      </div>

      {error && <div className="fx-alert fx-alert--error" role="alert">{error}</div>}

      {loading && !summary ? (
        <div className="earnings-loading">Loading earnings…</div>
      ) : (
        <>
          <div className="earnings-cards">
            <div className="earnings-card"><Wallet size={20} /><span>Total paid out</span><strong data-testid="card-total-paid">{money(s?.total_paid)}</strong></div>
            <div className="earnings-card"><Clock size={20} /><span>Pending balance</span><strong data-testid="card-pending">{money(s?.pending_balance)}</strong></div>
            <div className="earnings-card"><TrendingUp size={20} /><span>This month</span><strong>{money(s?.this_month)}</strong></div>
            <div className="earnings-card"><Percent size={20} /><span>Platform fees</span><strong>{money(s?.total_fees)}</strong></div>
          </div>

          <section className="earnings-panel">
            <h2>Last 6 months</h2>
            <BarChart
              data={(summary?.monthly || []).map((m) => ({ label: monthLabel(m.month), value: m.net }))}
              valueFormatter={money}
              ariaLabel="Net earnings per month"
            />
          </section>

          <section className="earnings-panel">
            <div className="earnings-panel__head">
              <h2>Payout history</h2>
              <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Filter by status">
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            {payouts.length === 0 ? (
              <div className="fx-chart-empty">No payouts yet. They appear when a booking is marked completed.</div>
            ) : (
              <div className="earnings-table-wrap">
                <table className="earnings-table">
                  <thead>
                    <tr><th>Date</th><th>Listing</th><th>Gross</th><th>Fee</th><th>Net</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.scheduled_date ? String(p.scheduled_date).slice(0, 10) : '-'}</td>
                        <td>{p.listing_title}</td>
                        <td>{money(p.gross_amount)}</td>
                        <td>{money(p.platform_fee)}</td>
                        <td><strong>{money(p.net_amount)}</strong></td>
                        <td><span className={`payout-status payout-status--${p.status}`}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="earnings-pager">
              <button className="fx-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {pages}</span>
              <button className="fx-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ProviderEarningsPage;
