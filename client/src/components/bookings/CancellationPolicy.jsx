/**
 * CancellationPolicy (US26): collapsible plain-language summary of a listing's refund rules.
 * Pass `listingId` to fetch, or a ready `policy` object.
 */
import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import '../common/features.css';

