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

