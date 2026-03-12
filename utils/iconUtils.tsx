import React from 'react';
import { FaWallet, FaBuildingColumns, FaCreditCard, FaMoneyBillWave, FaBitcoin, FaPaypal, FaCcVisa, FaCcMastercard, FaMobileScreen, FaPiggyBank } from 'react-icons/fa6';

export const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  'wallet': FaWallet,
  'bank': FaBuildingColumns,
  'card': FaCreditCard,
  'visa': FaCcVisa,
  'mastercard': FaCcMastercard,
  'cash': FaMoneyBillWave,
  'crypto': FaBitcoin,
  'paypal': FaPaypal,
  'mobile': FaMobileScreen,
  'savings': FaPiggyBank
};

export const renderAccountIcon = (iconKey: string, size: number = 24) => {
  const IconComponent = ACCOUNT_ICONS[iconKey];
  if (IconComponent) return <IconComponent size={size} />;
  return <span style={{ fontSize: size }}>{iconKey}</span>; // Fallback for emojis
};
