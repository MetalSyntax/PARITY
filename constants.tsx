import React from 'react';
import { ShoppingCart, Coffee, Car, Home, Zap, HeartPulse, Gamepad2, Plane } from 'lucide-react';
import { Account, Currency } from './types';

export const INITIAL_RATE = 50.50;

export const MOCK_ACCOUNTS: Account[] = [];

export const CATEGORIES = [
  { id: 'food', name: 'Food', icon: <ShoppingCart size={20} />, color: 'bg-orange-500/20 text-orange-400' },
  { id: 'transport', name: 'Transport', icon: <Car size={20} />, color: 'bg-blue-500/20 text-blue-400' },
  { id: 'coffee', name: 'Coffee', icon: <Coffee size={20} />, color: 'bg-amber-700/20 text-amber-500' },
  { id: 'home', name: 'Housing', icon: <Home size={20} />, color: 'bg-indigo-500/20 text-indigo-400' },
  { id: 'bills', name: 'Bills', icon: <Zap size={20} />, color: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'health', name: 'Health', icon: <HeartPulse size={20} />, color: 'bg-red-500/20 text-red-400' },
  { id: 'entertainment', name: 'Fun', icon: <Gamepad2 size={20} />, color: 'bg-purple-500/20 text-purple-400' },
  { id: 'travel', name: 'Travel', icon: <Plane size={20} />, color: 'bg-sky-500/20 text-sky-400' },
];

export const SMART_CATEGORIES: Record<string, string> = {
  'uber': 'transport',
  'taxi': 'transport',
  'bus': 'transport',
  'starbucks': 'coffee',
  'cafe': 'coffee',
  'latte': 'coffee',
  'netflix': 'entertainment',
  'spotify': 'entertainment',
  'gym': 'health',
  'doctor': 'health',
  'pharmacy': 'health',
  'market': 'food',
  'walmart': 'food',
  'dinner': 'food',
  'lunch': 'food',
};