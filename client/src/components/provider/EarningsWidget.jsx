/**
 * EarningsWidget (US27): compact earnings snapshot for the provider dashboard.
 * Shows pending payouts, this month's earnings and a 7-day chart, linking to /provider/earnings.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import BarChart from '../common/BarChart';
import '../common/features.css';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function EarningsWidget() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    axiosInstance.get('/providers/me/earnings/summary')
      .then((res) => { if (alive) setData(res.data); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  return (
    <section className="earnings-widget" data-testid="earnings-widget" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Earnings snapshot</h2>
        <Link to="/provider/earnings">View all earnings</Link>
      </div>
      {failed ? (
        <p style={{ color: '#94a3b8' }}>Earnings are unavailable right now.</p>
      ) : !data ? (
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 8 }}>
            <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>Pending payouts</div><strong>{money(data.summary.pending_balance)}</strong></div>
            <div><div style={{ color: '#64748b', fontSize: '0.85rem' }}>This month</div><strong>{money(data.summary.this_month)}</strong></div>
          </div>
          <BarChart
            height={110}
            data={data.last7Days.map((d) => ({ label: d.day.slice(5), value: d.net }))}
            valueFormatter={money}
            ariaLabel="Earnings in the last 7 days"
          />
        </>
      )}
    </section>
  );
}

export default EarningsWidget;
