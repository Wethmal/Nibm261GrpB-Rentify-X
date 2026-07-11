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

