/**
 * LocationSearch (US10): "Use My Location" button plus a manual city / postal-code fallback.
 * Calls onLocation({ lat, lng, label }) or onClear(). Handles permission denial gracefully.
 */
import React, { useState } from 'react';
import { MapPin, LocateFixed, X } from 'lucide-react';
import { geocodeSriLanka, getCurrentPosition } from '../../utils/geo';
import '../common/features.css';

const RADII = [5, 10, 25, 50, 100];

