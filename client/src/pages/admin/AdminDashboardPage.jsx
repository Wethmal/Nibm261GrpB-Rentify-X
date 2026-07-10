import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  Users, Activity, ShoppingBag, DollarSign, 
  CheckCircle, AlertTriangle, ArrowRight, BarChart2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BarChart from '../../components/common/BarChart';
import '../../components/common/features.css';
