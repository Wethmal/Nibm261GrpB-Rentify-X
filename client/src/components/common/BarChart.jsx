/**
 * Dependency-free SVG bar chart used for earnings (6-month, 7-day) and admin booking growth.
 * data: [{ label, value }]. `showEvery` thins the x-axis labels for dense series.
 */
import React from 'react';
import './features.css';

function BarChart({ data = [], height = 160, color = '#2563eb', valueFormatter = (v) => v, showEvery = 1, ariaLabel = 'Bar chart' }) {
  const width = 420;
  const pad = { top: 14, right: 8, bottom: 22, left: 8 };
  const max = Math.max(...data.map((d) => d.value), 0);
  if (!data.length || max === 0) return <div className="fx-chart-empty">No data to show yet.</div>;

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = innerW / data.length;
  const barW = Math.max(Math.min(step * 0.7, 40), 2);

  return (
    <div className="fx-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} stroke="#e2e8f0" />
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = pad.left + i * step + (step - barW) / 2;
          const y = height - pad.bottom - h;
          return (
            <g key={`${d.label}-${i}`}>
              <rect x={x} y={y} width={barW} height={Math.max(h, d.value > 0 ? 1 : 0)} rx="2" fill={color}>
                <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
              </rect>
              {i % showEvery === 0 && (
                <text x={x + barW / 2} y={height - 7} textAnchor="middle">{d.label}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default BarChart;
