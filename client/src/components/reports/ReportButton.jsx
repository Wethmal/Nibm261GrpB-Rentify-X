/**
 * ReportButton: small "Report" link that opens ReportUserModal. Renders nothing for
 * anonymous visitors or when reporting yourself.
 */
import React, { useContext, useState } from 'react';
import { Flag } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext.jsx';
