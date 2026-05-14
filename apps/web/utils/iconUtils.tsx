import React from 'react';
import { FaWallet, FaBuildingColumns, FaCreditCard, FaMoneyBillWave, FaBitcoin, FaPaypal, FaCcVisa, FaCcMastercard, FaMobileScreen, FaPiggyBank, FaApplePay, FaGooglePay, FaAmazonPay, FaStripe } from 'react-icons/fa6';
import { SiBinance, SiZelle, SiVenmo, SiMercadopago, SiCashapp } from 'react-icons/si';

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
  'savings': FaPiggyBank,
  'binance': SiBinance,
  'zelle': SiZelle,
  'venmo': SiVenmo,
  'mercadopago': SiMercadopago,
  'cashapp': SiCashapp,
  'applepay': FaApplePay,
  'googlepay': FaGooglePay,
  'amazonpay': FaAmazonPay,
  'stripe': FaStripe,
};

export const renderAccountIcon = (iconKey: string, size: number = 24) => {
  const IconComponent = ACCOUNT_ICONS[iconKey];
  if (IconComponent) return <IconComponent size={size} />;
  return <span style={{ fontSize: size }}>{iconKey}</span>; // Fallback for emojis
};
