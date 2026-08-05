/**
 * EarningsWidget (US27): compact earnings snapshot for the provider dashboard.
 * Shows pending payouts, this month's earnings and a 7-day chart, linking to /provider/earnings.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import BarChart from '../common/BarChart';
import '../common/features.css';

