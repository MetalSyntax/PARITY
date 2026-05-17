export const getCategoryIcon = (categoryId: string): any => {
  switch (categoryId) {
    case 'food': return 'cart-outline';
    case 'transport': return 'car-outline';
    case 'coffee': return 'restaurant-outline';
    case 'home': return 'home-outline';
    case 'bills': return 'receipt-outline';
    case 'internet': return 'globe-outline';
    case 'health': return 'heart-outline';
    case 'entertainment': return 'game-controller-outline';
    case 'travel': return 'airplane-outline';
    case 'shopping': return 'bag-handle-outline';
    case 'education': return 'school-outline';
    case 'gift': return 'gift-outline';
    case 'investment': return 'trending-up-outline';
    case 'savings': return 'wallet-outline';
    case 'pets': return 'paw-outline';
    case 'kids': return 'baby-outline';
    case 'insurance': return 'umbrella-outline';
    case 'taxes': return 'document-text-outline';
    case 'vacation': return 'sunny-outline';
    case 'electronics': return 'phone-portrait-outline';
    case 'subscription': return 'tv-outline';
    case 'services': return 'briefcase-outline';
    case 'commission': return 'percentage-outline';
    case 'personal': return 'person-outline';
    case 'charity': return 'heart-half-outline';
    case 'income': return 'cash-outline';
    case 'transfer': return 'swap-horizontal-outline';
    default: return 'help-circle-outline';
  }
};

export const getCategoryColor = (categoryId: string): string => {
  switch (categoryId) {
    case 'food': return '#f97316';
    case 'transport': return '#3b82f6';
    case 'home': return '#6366f1';
    case 'bills': return '#eab308';
    case 'internet': return '#0ea5e9';
    case 'health': return '#ef4444';
    case 'income': return '#10b981';
    case 'transfer': return '#818cf8';
    default: return '#94a3b8';
  }
};
