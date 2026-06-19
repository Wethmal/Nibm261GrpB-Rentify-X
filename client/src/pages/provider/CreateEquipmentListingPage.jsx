import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosInstance from '../../api/axiosInstance';
import './CreateListingPage.css';

// Step Components
import EquipmentStep1Details from '../../components/listings/Steps/EquipmentStep1Details';
import EquipmentStep2Pricing from '../../components/listings/Steps/EquipmentStep2Pricing';
import Step3Photos from '../../components/listings/Steps/Step3Photos';
import EquipmentStep4Preview from '../../components/listings/Steps/EquipmentStep4Preview';

// Zod schema for the equipment form
