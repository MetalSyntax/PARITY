import React from 'react';
import { ShoppingCart, Coffee, Car, Home, Zap, HeartPulse, Gamepad2, Plane, ShoppingBag, GraduationCap, Gift, TrendingUp, PawPrint, Baby, Umbrella, FileText, Palmtree, Smartphone, Globe, Briefcase, User, Search, Smile, Music, Film, Tv, Monitor, DollarSign, MoreHorizontal, Percent, HandCoins, ArrowRightLeft } from 'lucide-react';
import { Account, Currency } from './types';

export const INITIAL_RATE = 350.50;
export const INITIAL_USD_RATE_PARALLEL = 450.50;
export const INITIAL_EURO_RATE = 400.00;
export const INITIAL_EURO_RATE_PARALLEL = 500.00;

export const MOCK_ACCOUNTS: Account[] = [];

export const CATEGORIES = [
  { id: 'transfer', name: 'cat_transfer', icon: <ArrowRightLeft size={20} />, color: 'bg-indigo-500/20 text-indigo-400' },
  { id: 'food', name: 'cat_food', icon: <ShoppingCart size={20} />, color: 'bg-orange-500/20 text-orange-400' },
  { id: 'transport', name: 'cat_transport', icon: <Car size={20} />, color: 'bg-blue-500/20 text-blue-400' },
  { id: 'coffee', name: 'cat_coffee', icon: <Coffee size={20} />, color: 'bg-amber-700/20 text-amber-500' },
  { id: 'home', name: 'cat_home', icon: <Home size={20} />, color: 'bg-indigo-500/20 text-indigo-400' },
  { id: 'bills', name: 'cat_bills', icon: <Zap size={20} />, color: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'internet', name: 'cat_internet', icon: <Globe size={20} />, color: 'bg-sky-600/20 text-sky-400' },
  { id: 'health', name: 'cat_health', icon: <HeartPulse size={20} />, color: 'bg-red-500/20 text-red-400' },
  { id: 'entertainment', name: 'cat_entertainment', icon: <Gamepad2 size={20} />, color: 'bg-purple-500/20 text-purple-400' },
  { id: 'travel', name: 'cat_travel', icon: <Plane size={20} />, color: 'bg-sky-500/20 text-sky-400' },
  { id: 'shopping', name: 'cat_shopping', icon: <ShoppingBag size={20} />, color: 'bg-pink-500/20 text-pink-400' },
  { id: 'education', name: 'cat_education', icon: <GraduationCap size={20} />, color: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'gift', name: 'cat_gift', icon: <Gift size={20} />, color: 'bg-rose-500/20 text-rose-400' },
  { id: 'investment', name: 'cat_investment', icon: <TrendingUp size={20} />, color: 'bg-green-500/20 text-green-400' },
  { id: 'pets', name: 'cat_pets', icon: <PawPrint size={20} />, color: 'bg-amber-500/20 text-amber-400' },
  { id: 'kids', name: 'cat_kids', icon: <Baby size={20} />, color: 'bg-blue-300/20 text-blue-300' },
  { id: 'insurance', name: 'cat_insurance', icon: <Umbrella size={20} />, color: 'bg-indigo-700/20 text-indigo-400' },
  { id: 'taxes', name: 'cat_taxes', icon: <FileText size={20} />, color: 'bg-gray-500/20 text-gray-400' },
  { id: 'vacation', name: 'cat_vacation', icon: <Palmtree size={20} />, color: 'bg-cyan-500/20 text-cyan-400' },
  { id: 'electronics', name: 'cat_electronics', icon: <Smartphone size={20} />, color: 'bg-zinc-500/20 text-zinc-300' },
  { id: 'subscription', name: 'cat_subscription', icon: <Monitor size={20} />, color: 'bg-violet-500/20 text-violet-400' },
  { id: 'services', name: 'cat_services', icon: <Briefcase size={20} />, color: 'bg-slate-500/20 text-slate-400' },
  { id: 'commission', name: 'cat_commission', icon: <Percent size={20} />, color: 'bg-red-600/20 text-red-300' },
  { id: 'personal', name: 'cat_personal', icon: <User size={20} />, color: 'bg-teal-500/20 text-teal-400' },
  { id: 'charity', name: 'cat_charity', icon: <HeartPulse size={20} />, color: 'bg-rose-300/20 text-rose-300' },
  { id: 'income', name: 'cat_income', icon: <DollarSign size={20} />, color: 'bg-emerald-600/20 text-emerald-400' },
  { id: 'work', name: 'cat_work', icon: <Briefcase size={20} />, color: 'bg-slate-600/20 text-slate-300' },
  { id: 'freelance', name: 'cat_freelance', icon: <Globe size={20} />, color: 'bg-indigo-400/20 text-indigo-300' },
  { id: 'business', name: 'cat_business', icon: <Briefcase size={20} />, color: 'bg-blue-600/20 text-blue-400' },
  { id: 'interest', name: 'cat_interest', icon: <TrendingUp size={20} />, color: 'bg-indigo-600/20 text-indigo-400' },
  { id: 'loans', name: 'cat_loans', icon: <HandCoins size={20} />, color: 'bg-emerald-700/20 text-emerald-500' },
  { id: 'other', name: 'cat_other', icon: <MoreHorizontal size={20} />, color: 'bg-gray-600/20 text-gray-300' },
];

const SHARED_CATEGORIES: Record<string, string> = {
  'streaming': 'subscription',
  'software-service': 'subscription',
  'membership': 'subscription',
  'rideshare': 'transport',
  'ride': 'transport',
  'delivery': 'food',
  'marketplace': 'shopping',
  'online-store': 'shopping',
  'cloud-storage': 'internet',
  'hosting': 'internet',
  'domain': 'internet',
  'e-learning': 'education',
  'games-store': 'entertainment',
  'rent-payment': 'home',
  'bank-fee': 'commission',
  'withdrawal-fee': 'commission',
};

export const SMART_CATEGORIES_EN: Record<string, string> = {
  ...SHARED_CATEGORIES,
  // TRANSPORT (15+)
  'fuel': 'transport', 'gas': 'transport', 'parking': 'transport', 'toll': 'transport', 'metro': 'transport',
  'subway': 'transport', 'bus': 'transport', 'train': 'transport', 'tire': 'transport', 'maint': 'transport',
  'towing': 'transport', 'carwash': 'transport', 'garage': 'transport', 'parts': 'transport', 'brake': 'transport',
  'uber': 'transport', 'lyft': 'transport', 'taxi': 'transport', 'ride': 'transport', 'automotive': 'transport',
  // FOOD (15+)
  'market': 'food', 'supermarket': 'food', 'grocery': 'food', 'restaurant': 'food', 'dinner': 'food',
  'lunch': 'food', 'breakfast': 'food', 'bakery': 'food', 'pizza': 'food', 'burger': 'food',
  'sushi': 'food', 'steak': 'food', 'pasta': 'food', 'dessert': 'food', 'takeout': 'food',
  'delivery': 'food', 'snack': 'food', 'drinks': 'food', 'bistro': 'food', 'diner': 'food',
  // INTERNET (15+)
  'internet': 'internet', 'wifi': 'internet', 'broadband': 'internet', 'fiber': 'internet', 'router': 'internet',
  'data-plan': 'internet', 'modem': 'internet', 'connectivity': 'internet', 'web-access': 'internet', 'bandwidth': 'internet',
  'isp': 'internet', 'hotspot': 'internet', 'lan': 'internet', 'hosting': 'internet', 'domain': 'internet',
  // BILLS (15+)
  'electric': 'bills', 'water': 'bills', 'telephone': 'bills', 'utilities': 'bills', 'sewer': 'bills',
  'garbage': 'bills', 'waste': 'bills', 'heating': 'bills', 'cooling': 'bills', 'maintenance': 'bills',
  'condo': 'bills', 'property-bill': 'bills', 'security': 'bills', 'solar': 'bills', 'energy': 'bills',
  // HOME (15+)
  'rent': 'home', 'mortgage': 'home', 'lease': 'home', 'apartment': 'home', 'house': 'home',
  'condo-fee': 'home', 'realtor': 'home', 'furniture': 'home', 'bedding': 'home', 'kitchen': 'home',
  'garden': 'home', 'renovation': 'home', 'decor': 'home', 'improvement': 'home', 'appliance': 'home',
  // HEALTH (15+)
  'doctor': 'health', 'hospital': 'health', 'pharmacy': 'health', 'medication': 'health', 'clinic': 'health',
  'dentist': 'health', 'vision': 'health', 'optometry': 'health', 'therapy': 'health', 'gym': 'health',
  'fitness': 'health', 'supplement': 'health', 'medical': 'health', 'wellness': 'health', 'lab': 'health',
  // ENTERTAINMENT (15+)
  'cinema': 'entertainment', 'game': 'entertainment', 'concert': 'entertainment', 'museum': 'entertainment', 'park': 'entertainment',
  'bar': 'entertainment', 'club': 'entertainment', 'theater': 'entertainment', 'sports': 'entertainment', 'event': 'entertainment',
  'streaming': 'entertainment', 'music': 'entertainment', 'hobby': 'entertainment', 'festival': 'entertainment', 'pub': 'entertainment',
  // TRAVEL (15+)
  'flight': 'travel', 'airline': 'travel', 'hotel': 'travel', 'resort': 'travel', 'booking': 'travel',
  'vacation': 'travel', 'luggage': 'travel', 'airbnb': 'travel', 'cruise': 'travel', 'tour': 'travel',
  'airport': 'travel', 'souvenir': 'travel', 'passport': 'travel', 'ticket': 'travel', 'itinerary': 'travel',
  // SHOPPING (15+)
  'clothing': 'shopping', 'shoes': 'shopping', 'accessories': 'shopping', 'jewelry': 'shopping', 'cosmetics': 'shopping',
  'beauty': 'shopping', 'fragrance': 'shopping', 'watch': 'shopping', 'mall': 'shopping', 'boutique': 'shopping',
  'outlet': 'shopping', 'retail': 'shopping', 'shipping': 'shopping', 'discount': 'shopping', 'store': 'shopping',
  // EDUCATION (15+)
  'tuition': 'education', 'school': 'education', 'college': 'education', 'university': 'education', 'course': 'education',
  'training': 'education', 'workshop': 'education', 'seminar': 'education', 'degree': 'education', 'exam': 'education',
  'book': 'education', 'library': 'education', 'scholarship': 'education', 'tutor': 'education', 'certification': 'education',
  // COMMISSION (15+)
  'commission': 'commission', 'fee': 'commission', 'charge': 'commission', 'penalty': 'commission', 'surcharge': 'commission',
  'handling': 'commission', 'processing': 'commission', 'brokerage': 'commission', 'banking-fee': 'commission', 'usage-fee': 'commission',
  'late-fee': 'commission', 'overdraft': 'commission', 'markup': 'commission', 'interest-charge': 'commission', 'service-charge': 'commission',
  // INVESTMENT (15+)
  'stock': 'investment', 'crypto': 'investment', 'bitcoin': 'investment', 'dividend': 'investment', 'equity': 'investment',
  'bond': 'investment', 'fund': 'investment', 'trading': 'investment', 'portfolio': 'investment', 'asset': 'investment',
  'wealth': 'investment', 'retirement': 'investment', 'savings': 'investment', 'gold': 'investment', 'capital': 'investment',
  // PETS (15+)
  'vet': 'pets', 'dog': 'pets', 'cat': 'pets', 'puppy': 'pets', 'kitten': 'pets',
  'pet-food': 'pets', 'grooming': 'pets', 'kennel': 'pets', 'animal': 'pets', 'leash': 'pets',
  'vaccine-pet': 'pets', 'aquarium': 'pets', 'bird': 'pets', 'hamster': 'pets', 'pet-shop': 'pets',
  // KIDS (15+)
  'baby': 'kids', 'diaper': 'kids', 'toys': 'kids', 'daycare': 'kids', 'nanny': 'kids',
  'babysitter': 'kids', 'stroller': 'kids', 'kindergarten': 'kids', 'preschool': 'kids', 'pediatrician': 'kids',
  'infant': 'kids', 'toddler': 'kids', 'clothing-kid': 'kids', 'playpen': 'kids', 'formula': 'kids',
  // INSURANCE (15+)
  'health-insurance': 'insurance', 'car-insurance': 'insurance', 'life-insurance': 'insurance', 'home-insurance': 'insurance', 'premium-ins': 'insurance',
  'policy': 'insurance', 'coverage': 'insurance', 'deductible': 'insurance', 'claim': 'insurance', 'provider': 'insurance',
  'broker': 'insurance', 'annuity': 'insurance', 'liability': 'insurance', 'travel-insurance': 'insurance', 'protection': 'insurance',
  // TAXES (15+)
  'tax': 'taxes', 'irs': 'taxes', 'revenue-service': 'taxes', 'audit': 'taxes', 'property-tax': 'taxes',
  'income-tax': 'taxes', 'vat': 'taxes', 'gst': 'taxes', 'tax-return': 'taxes', 'filer': 'taxes',
  'withholding': 'taxes', 'compliance': 'taxes', 'levy': 'taxes', 'assessment': 'taxes', 'exemption': 'taxes',
  // VACATION (15+)
  'beach': 'vacation', 'vacation-stay': 'vacation', 'resort-stay': 'vacation', 'leisure': 'vacation', 'getaway': 'vacation',
  'sightseeing': 'vacation', 'tourism': 'vacation', 'tourist': 'vacation', 'holiday': 'vacation', 'cruise-ship': 'vacation',
  'tropical': 'vacation', 'summer': 'vacation', 'winter-break': 'vacation', 'travel-deal': 'vacation', 'amusement': 'vacation',
  // ELECTRONICS (15+)
  'laptop': 'electronics', 'phone': 'electronics', 'computer': 'electronics', 'tablet': 'electronics', 'camera': 'electronics',
  'headphone': 'electronics', 'charger': 'electronics', 'hardware': 'electronics', 'console': 'electronics', 'monitor': 'electronics',
  'gadget': 'electronics', 'peripheral': 'electronics', 'storage-device': 'electronics', 'smart-watch': 'electronics', 'printer': 'electronics',
  // SERVICES (15+)
  'cleaning-service': 'services', 'repair-service': 'services', 'handyman': 'services', 'plumber': 'services', 'electrician': 'services',
  'mechanic': 'services', 'pest-control': 'services', 'locksmith': 'services', 'laundry-mat': 'services', 'dry-clean': 'services',
  'tailor': 'services', 'landscaping': 'services', 'moving-service': 'services', 'towing-service': 'services', 'legal-service': 'services',
  // PERSONAL (15+)
  'haircut': 'personal', 'barber': 'personal', 'salon': 'personal', 'spa': 'personal', 'massage': 'personal',
  'cosmetic': 'personal', 'skincare': 'personal', 'makeup': 'personal', 'shampoo': 'personal', 'toothpaste': 'personal',
  'soap': 'personal', 'manicure': 'personal', 'perfume-personal': 'personal', 'grooming-kit': 'personal', 'shaving': 'personal',
  // CHARITY (15+)
  'donation': 'charity', 'charitable': 'charity', 'ngo': 'charity', 'non-profit': 'charity', 'church': 'charity',
  'foundation': 'charity', 'relief': 'charity', 'volunteer': 'charity', 'orphanage': 'charity', 'red-cross': 'charity',
  'alms': 'charity', 'fundraising': 'charity', 'tithe': 'charity', 'aid-relief': 'charity', 'philanthropy': 'charity',
  // INCOME (15+)
  'salary': 'income', 'paycheck': 'income', 'bonus': 'income', 'dividend-income': 'income', 'interest-income': 'income',
  'refund-income': 'income', 'rental-income': 'income', 'commission-income': 'income', 'proceeds': 'income', 'wages': 'income',
  'stipend': 'income', 'grant-income': 'income', 'royalties': 'income', 'earnings': 'income', 'gain': 'income',
  // PROFESSIONAL (Work, Freelance, Business)
  'office-supply': 'work', 'corporate': 'work', 'work-expense': 'work', 'business-trip': 'business', 'startup': 'business',
  'freelance-project': 'freelance', 'client-pay': 'freelance', 'gig-work': 'freelance', 'advertising': 'business', 'marketing': 'business',
  'consulting': 'business', 'interest-gain': 'interest', 'savings-interest': 'interest', 'gift-receive': 'gift', 'birthday-gift': 'gift',
  // COFFEE (15+)
  'coffee': 'coffee', 'cafe': 'coffee', 'espresso': 'coffee', 'latte': 'coffee', 'cappuccino': 'coffee',
  'macchiato': 'coffee', 'mocha': 'coffee', 'americano': 'coffee', 'flat-white': 'coffee', 'cold-brew': 'coffee',
  'frappuccino': 'coffee', 'brewed-coffee': 'coffee', 'roaster': 'coffee', 'barista': 'coffee', 'coffee-shop': 'coffee',
  // OTHER (15+)
  'misc': 'other', 'general': 'other', 'miscellaneous': 'other', 'unknown': 'other', 'uncategorized': 'other',
  'random': 'other', 'other-expense': 'other',  'atm-withdrawal': 'other', 'cash-out': 'other', 'transfer-out': 'transfer', 'transfer': 'transfer', 'wire': 'transfer',
  // LOANS (15+)
  'loan': 'loans', 'credit': 'loans', 'debt': 'loans', 'financing': 'loans', 'repayment': 'loans',
  'lending': 'loans', 'borrowing': 'loans', 'mortgage-pay': 'loans', 'credit-card-pay': 'loans', 'loan-interest': 'loans',
  'installment': 'loans', 'payday': 'loans', 'creditor': 'loans', 'overdraft-pay': 'loans', 'principal': 'loans',
  'payment-other': 'other', 'etc': 'other', 'various': 'other', 'stuff': 'other', 'unspecified': 'other',
  'send': 'transfer', 'receive-transfer': 'transfer',
};

export const SMART_CATEGORIES_ES: Record<string, string> = {
  ...SHARED_CATEGORIES,
  // TRANSPORTE (15+)
  'gasolina': 'transport', 'combustible': 'transport', 'peaje': 'transport', 'estacionamiento': 'transport', 'metro': 'transport',
  'colectivo': 'transport', 'autobus': 'transport', 'tren': 'transport', 'parada': 'transport', 'uber': 'transport',
  'taxi': 'transport', 'repuesto': 'transport', 'mecanico': 'transport', 'taller': 'transport', 'lavado': 'transport',
  'caucho': 'transport', 'limpiaparabrisas': 'transport', 'bateria': 'transport', 'freno': 'transport', 'aceite': 'transport',
  // COMIDA (15+)
  'mercado': 'food', 'supermercado': 'food', 'market': 'food', 'bodega': 'food', 'abasto': 'food',
  'cena': 'food', 'almuerzo': 'food', 'desayuno': 'food', 'restaurante': 'food', 'comida': 'food',
  'hamburguesa': 'food', 'pizza': 'food', 'sushi': 'food', 'panaderia': 'food', 'merienda': 'food',
  'chuches': 'food', 'bebidas': 'food', 'refresco': 'food', 'bistro': 'food', 'alimento': 'food',
  // INTERNET (15+)
  'internet': 'internet', 'wifi': 'internet', 'banda ancha': 'internet', 'fibra': 'internet', 'router': 'internet',
  'plan de datos': 'internet', 'modem': 'internet', 'conectividad': 'internet', 'navegacion': 'internet', 'megas': 'internet',
  'datos': 'internet', 'megabytes': 'internet', 'recarga': 'internet', 'hosting': 'internet', 'dominio': 'internet',
  // FACTURAS (15+)
  'electricidad': 'bills', 'luz': 'bills', 'agua': 'bills', 'telefono': 'bills', 'aseo': 'bills',
  'gas': 'bills', 'condominio': 'bills', 'mantenimiento': 'bills', 'impuesto-municipal': 'bills', 'cuota': 'bills',
  'factura': 'bills', 'pago': 'bills', 'servicio': 'bills', 'vigilancia': 'bills', 'calefaccion': 'bills',
  // HOGAR (15+)
  'alquiler': 'home', 'arriendo': 'home', 'hipoteca': 'home', 'casa': 'home', 'departamento': 'home',
  'muebles': 'home', 'decoracion': 'home', 'reparacion': 'home', 'limpieza': 'home', 'jardin': 'home',
  'ferreteria': 'home', 'pintura': 'home', 'mudanza': 'home', 'cortinas': 'home', 'sabanas': 'home',
  // SALUD (15+)
  'medico': 'health', 'hospital': 'health', 'farmacia': 'health', 'medicamento': 'health', 'salud': 'health',
  'consulta': 'health', 'dentista': 'health', 'lentes': 'health', 'clinica': 'health', 'psicologo': 'health',
  'gimnasio': 'health', 'entrenamiento': 'health', 'vitamina': 'health', 'laboratorio': 'health', 'optica': 'health',
  // ENTRETENIMIENTO (15+)
  'cine': 'entertainment', 'juego': 'entertainment', 'videojuego': 'entertainment', 'concierto': 'entertainment', 'pelicula': 'entertainment',
  'entradas': 'entertainment', 'museo': 'entertainment', 'parque': 'entertainment', 'discoteca': 'entertainment', 'teatro': 'entertainment',
  'bar': 'entertainment', 'evento': 'treatment', 'fiesta': 'entertainment', 'hobby': 'entertainment',
  // VIAJES (15+)
  'vuelo': 'travel', 'boleto': 'travel', 'viaje': 'travel', 'hotel': 'travel', 'resort': 'travel',
  'reserva': 'travel', 'maleta': 'travel', 'airbnb': 'travel', 'crucero': 'travel', 'tour': 'travel',
  'aeropuerto': 'travel', 'souvenir': 'travel', 'pasaporte': 'travel', 'itinerario': 'travel', 'excursion': 'travel',
  // COMPRAS (15+)
  'ropa': 'shopping', 'zapatos': 'shopping', 'accesorios': 'shopping', 'joyeria': 'shopping', 'cosmeticos': 'shopping',
  'maquillaje': 'shopping', 'perfume': 'shopping', 'reloj': 'shopping', 'centro comercial': 'shopping', 'tienda': 'shopping',
  'boutique': 'shopping', 'rebajas': 'shopping', 'despacho': 'shopping', 'descuento': 'shopping', 'cartera': 'shopping',
  // EDUCACION (15+)
  'seminario': 'education',
  'grado': 'education', 'examen': 'education', 'libro': 'education',
  'biblioteca': 'education', 'beca': 'education', 'clase': 'education', 'idioma': 'education', 'estudio': 'education',
  // COMISION (15+)
  'comision': 'commission', 'tarifa': 'commission', 'cargo': 'commission', 'multa': 'commission', 'recargo': 'commission',
  'procesamiento': 'commission', 'corretaje': 'commission', 'manejo': 'commission', 'banco': 'commission', 'sobregiro': 'commission',
  'itf': 'commission', 'iva': 'commission', 'retencion': 'commission', 'fee': 'commission', 'intereses-mora': 'commission',
  // INVERSION (15+)
  'acciones': 'investment', 'bolsa': 'investment', 'dividendos': 'investment', 'capital': 'investment', 'fondo': 'investment',
  'patrimonio': 'investment',
  'ahorros': 'investment', 'cripto': 'investment', 'oro': 'investment',
  'plazo-fijo': 'investment', 'bonos': 'investment', 'trading': 'investment', 'criptomoneda': 'investment', 'ganancia-cap': 'investment',
  // MASCOTAS (15+)
  'veterinario': 'pets', 'perro': 'pets', 'gato': 'pets', 'cachorro': 'pets', 'mascota': 'pets',
  'comida-mascota': 'pets', 'peluqueria-canina': 'pets', 'correa': 'pets', 'vacuna-mascota': 'pets', 'acuario': 'pets',
  'pájaro': 'pets', 'hámster': 'pets', 'juguete-mascota': 'pets', 'adopcion': 'pets', 'refugio-animal': 'pets',
  // NIÑOS (15+)
  'bebe': 'kids', 'pañales': 'kids', 'juguetes': 'kids', 'guarderia': 'kids', 'niñera': 'kids',
  'cochecito': 'kids', 'preescolar': 'kids', 'pediatra': 'kids', 'infante': 'kids', 'ropa-niño': 'kids',
  'biberon': 'kids', 'formula-infantil': 'kids', 'parque-infantil': 'kids', 'colegio-niños': 'kids', 'mochila-escolar': 'kids',
  // SEGUROS (15+)
  'seguro-medico': 'insurance', 'seguro-carro': 'insurance', 'seguro-vida': 'insurance', 'aseguradora': 'insurance', 'cobertura': 'insurance',
  'siniestro': 'insurance', 'prima-seguro': 'insurance', 'corredor-seguros': 'insurance', 'seguro-hogar': 'insurance', 'asistencia': 'insurance',
  // ELECTRONICA (15+)
  'laptop': 'electronics', 'computadora': 'electronics',
  'tablet': 'electronics', 'camara': 'electronics',
  'audifonos': 'electronics', 'cargador': 'electronics', 'software': 'electronics', 'consola': 'electronics', 'mouse': 'electronics',
  // VACACIONES (15+)
  'playa': 'vacation', 'descanso': 'vacation', 'turismo': 'vacation', 'resort-vac': 'vacation', 'crucero-vac': 'vacation',
  'escapada': 'vacation', 'verano': 'vacation', 'invierno-vac': 'vacation', 'tour-vac': 'vacation', 'viaje-placer': 'vacation',
  'hospedaje': 'vacation', 'camping-vac': 'vacation', 'senderismo': 'vacation', 'parque-atracciones': 'vacation', 'recreacion': 'vacation',
  // TRABAJO (Freelance, Business, Work)
  'oficina': 'work', 'negocio': 'business', 'empresa': 'business', 'emprendimiento': 'business', 'cliente': 'freelance',
  'proyecto': 'freelance', 'honorarios-prof': 'freelance', 'marketing-bus': 'business', 'publicidad': 'business', 'insumos': 'work',
  'intereses-ganados': 'interest', 'regalo-recibido': 'gift', 'detallazo': 'gift', 'obsequio': 'gift', 'presente': 'gift',
  // IMPUESTOS (15+)
  'isrl': 'taxes', 'impuestos': 'taxes', 'seniat': 'taxes', 'declaracion': 'taxes',
  'tasa-aduana': 'taxes', 'igp': 'taxes', 'retencion-iva': 'taxes', 'contribuyente': 'taxes',
  'fiscal': 'taxes', 'catastro': 'taxes', 'arancel': 'taxes', 'timbre-fiscal': 'taxes', 'derecho-frente': 'taxes',
  // SERVICIOS (15+)
  'plomero': 'services', 'electricista': 'services', 'limpeza-serv': 'services', 'mantenimiento-serv': 'services',
  'reparacion-serv': 'services', 'fumigacion': 'services', 'cerrajero': 'services', 'lavanderia': 'services', 'taller-mec': 'services',
  'albañil': 'services', 'pintor': 'services', 'tecnico': 'services', 'jardineria': 'services',
  // PERSONAL (15+)
  'corte-pelo': 'personal', 'peluqueria': 'personal', 'barberia': 'personal', 'spa': 'personal', 'masaje': 'personal',
  'skincare': 'personal', 'manicura': 'personal', 'shampoo': 'personal', 'jabon': 'personal',
  'desodorante': 'personal', 'perfumeria': 'personal', 'cremas': 'personal', 'barbero': 'personal', 'estetica': 'personal',
  // CARIDAD (15+)
  'donacion': 'charity', 'diezmo': 'charity', 'iglesia': 'charity', 'fundacion': 'charity', 'ong': 'charity',
  'ayuda': 'charity', 'voluntariado': 'charity', 'caridad': 'charity', 'ofrenda': 'charity', 'colecta': 'charity',
  'apoyo-social': 'charity', 'asilo': 'charity', 'comedor-popular': 'charity', 'socorro': 'charity', 'beneficencia': 'charity',
  // INGRESOS (15+)
  'nomina': 'income', 'sueldo': 'income', 'salario': 'income', 'honorarios': 'income', 'pago-nomina': 'income',
  'bono-vacacional': 'income', 'utilidades-inc': 'income', 'aguinaldo': 'income', 'reembolso-inc': 'income', 'transferencia-recibida': 'income',
  'deposito-inc': 'income', 'cobro': 'income', 'venta-inc': 'income', 'remesa': 'income', 'pension': 'income',
  // CAFE (15+)
  'cafeteria': 'coffee', 'cafe': 'coffee', 'espresso': 'coffee', 'marron': 'coffee', 'guayoyo': 'coffee',
  'con-leche': 'coffee', 'capuchino': 'coffee', 'te': 'coffee', 'teteria': 'coffee', 'infusion': 'coffee',
  'muffin': 'coffee', 'pasteleria': 'coffee', 'donas': 'coffee', 'panaderia-tip': 'coffee', 'barista-tip': 'coffee',
  // OTROS (15+)
  'varios': 'other', 'misc': 'other', 'otros-gastos': 'other', 'efectivo': 'other', 'retiro-cajero': 'other',
  'desconocido': 'other', 'sin-categoria': 'other', 'pago-movil': 'transfer', 'transferencia-enviada': 'transfer', 'ajuste': 'other',
  // PRESTAMOS (15+)
  'prestamo': 'loans', 'credito': 'loans', 'deuda': 'loans', 'financiamiento': 'loans', 'abono': 'loans',
  'cuota-pago': 'loans', 'pagare': 'loans', 'hipoteca-pago': 'loans', 'tarjeta-credito': 'loans', 'interes-prestamo': 'loans',
  'reembolso-loan': 'loans', 'acreedor': 'loans', 'linea-credito': 'loans', 'amortizacion': 'loans', 'fianza': 'loans',
  'comision-bancaria-other': 'other', 'genericos': 'other', 'bolsa-otros': 'other', 'random-es': 'other', 'extra': 'other',
  'transferencia': 'transfer', 'traspaso': 'transfer', 'envio': 'transfer', 'p2p': 'transfer', 'zelle': 'transfer', 'pago móvil': 'transfer',
};

export const SMART_CATEGORIES_PT: Record<string, string> = {
  ...SHARED_CATEGORIES,
  // TRANSPORTE (15+)
  'gasolina': 'transport', 'combustivel': 'transport', 'pedagio': 'transport', 'estacionamento': 'transport', 'metro': 'transport',
  'onibus': 'transport', 'trem': 'transport', 'uber': 'transport', 'taxi': 'transport', 'oficina': 'transport',
  'mecanico': 'transport', 'lavagem': 'transport', 'pneu': 'transport', 'pecas': 'transport', 'carro': 'transport',
  'freios': 'transport', 'oleo': 'transport', 'bateria': 'transport', 'combustíveis': 'transport', 'transporte': 'transport',
  // COMIDA (15+)
  'mercado': 'food', 'supermercado': 'food', 'jantar': 'food', 'almoco': 'food', 'cafe da manha': 'food',
  'restaurante': 'food', 'comida': 'food', 'hamburguer': 'food', 'pizza': 'food', 'sushi': 'food',
  'carne': 'food', 'frango': 'food', 'padaria': 'food', 'lanche': 'food', 'sobremesa': 'food',
  'bebidas': 'food', 'refrigerante': 'food', 'feira': 'food', 'quitanda': 'food', 'compras-food': 'food',
  // INTERNET (15+)
  'internet': 'internet', 'wifi': 'internet', 'banda larga': 'internet', 'fibra': 'internet', 'roteador': 'internet',
  'plano de dados': 'internet', 'modem': 'internet', 'conectividade': 'internet', 'navegacao': 'internet', 'isp': 'internet',
  'megas': 'internet', 'dados': 'internet', 'conexao': 'internet', 'web': 'internet', 'hotspot': 'internet',
  // CONTAS (15+)
  'eletricidade': 'bills', 'luz': 'bills', 'agua': 'bills', 'telefone': 'bills', 'lixo': 'bills',
  'gas': 'bills', 'condominio': 'bills', 'manutencao': 'bills', 'seguranca': 'bills', 'contas': 'bills',
  'fatura': 'bills', 'pagamento': 'bills', 'servico': 'bills', 'iptu': 'bills', 'energia': 'bills',
  // CASA (15+)
  'aluguel': 'home', 'hipoteca': 'home', 'casa': 'home', 'apartamento': 'home', 'imóvel': 'home',
  'moveis': 'home', 'decoracao': 'home', 'reforma': 'home', 'limpeza': 'home', 'jardim': 'home',
  'ferragem': 'home', 'pintura': 'home', 'mudanca': 'home', 'sofa': 'home', 'quarto': 'home',
  // SAUDE (15+)
  'medico': 'health', 'hospital': 'health', 'farmacia': 'health', 'remedio': 'health', 'saude': 'health',
  'consulta': 'health', 'dentista': 'health', 'oculos': 'health', 'clinica': 'health', 'psicologo': 'health',
  'academia': 'health', 'exame': 'health', 'vitamina': 'health', 'laboratorio': 'health', 'optico': 'health',
  // ENTRETENIMENTO (15+)
  'cinema': 'entertainment', 'jogo': 'entertainment', 'video-game': 'entertainment', 'show': 'entertainment', 'filme': 'entertainment',
  'ingressos': 'entertainment', 'museu': 'entertainment', 'parque': 'entertainment', 'balada': 'entertainment', 'teatro': 'entertainment',
  'evento': 'treatment', 'festa': 'entertainment', 'lazer': 'entertainment', 'diversao': 'entertainment',
  // VIAGEM (15+)
  'voo': 'travel', 'passagem': 'travel', 'viagem': 'travel', 'hotel': 'travel', 'resort': 'travel',
  'reserva': 'travel', 'mala': 'travel', 'airbnb': 'travel', 'cruzeiro': 'travel', 'passeio': 'travel',
  'aeroporto': 'travel', 'brinde': 'travel', 'passaporte': 'travel', 'itinerario': 'travel', 'excursao': 'travel',
  // COMPRAS (15+)
  'roupas': 'shopping', 'sapatos': 'shopping', 'acessorios': 'shopping', 'joias': 'shopping', 'cosmeticos': 'shopping',
  'maquiagem': 'shopping', 'perfume': 'shopping', 'relogio': 'shopping', 'shopping-mall': 'shopping', 'loja': 'shopping',
  'boutique': 'shopping', 'liquidacao': 'shopping', 'entrega': 'shopping', 'desconto': 'shopping', 'bolsa': 'shopping',
  // EDUCACAO (15+)
  'matricula': 'education', 'escola': 'education', 'universidade': 'education', 'curso': 'education', 'treinamento': 'education',
  'workshop': 'education', 'seminario': 'education', 'graduacao': 'education', 'livro': 'education',
  'biblioteca': 'education', 'bolsa-estudo': 'education', 'aula': 'education', 'idioma': 'education', 'estudo': 'education',
  // COMISSAO (15+)
  'comissao': 'commission', 'taxa': 'commission', 'tarifa': 'commission', 'multa': 'commission', 'encargo': 'commission',
  'processamento': 'commission', 'corretagem': 'commission', 'manuseio': 'commission', 'banco': 'commission', 'cheque-especial': 'commission',
  'iof': 'commission', 'irrf': 'commission', 'anuidade': 'commission', 'boleto': 'commission', 'taxa-servico': 'commission',
  // INVESTIMENTO (15+)
  'acoes': 'investment', 'bolsa-valores': 'investment', 'dividendos': 'investment', 'capital': 'investment', 'fundo': 'investment',
  'carteira': 'investment', 'patrimonio': 'investment', 'poupanca': 'investment', 'cripto': 'investment', 'ouro': 'investment',
  'cdi': 'investment', 'selic': 'investment', 'tesouro': 'investment', 'rendimento': 'investment', 'ativos': 'investment',
  // PETS (15+)
  'veterinario': 'pets', 'cachorro': 'pets', 'gato': 'pets', 'filhote': 'pets', 'pet': 'pets',
  'racao': 'pets', 'banho-tosa': 'pets', 'coleira': 'pets', 'vacina-pet': 'pets', 'aquario': 'pets',
  'passaro': 'pets', 'brinquedo-pet': 'pets', 'adocao': 'pets', 'abrigo-animal': 'pets', 'adestramento': 'pets',
  // CRIANÇAS (15+)
  'bebe': 'kids', 'fraldas': 'kids', 'brinquedos': 'kids', 'creche': 'kids', 'baba': 'kids',
  'carrinho-bebe': 'kids', 'pre-escola': 'kids', 'pediatra': 'kids', 'infantil': 'kids', 'roupa-crianca': 'kids',
  'mamadeira': 'kids', 'formula-infantil': 'kids', 'parquinho': 'kids', 'escola-infantil': 'kids',
  // ELETRONICOS (15+)
  'fones': 'electronics', 'carregador': 'electronics', 'teclado': 'electronics', 'mouse': 'electronics', 'tela': 'electronics',
  // IMPOSTOS (15+)
  'receita-federal': 'taxes', 'irpf': 'taxes', 'ipva': 'taxes', 'iss': 'taxes',
  'icms': 'taxes', 'declaracao-ir': 'taxes', 'auditoria-fiscal': 'taxes', 'contribuinte-pt': 'taxes', 'bitributacao': 'taxes',
  'taxa-municipal': 'taxes', 'isencao': 'taxes', 'multa-fiscal-pt': 'taxes', 'aliquota': 'taxes', 'imposto-pt': 'taxes',
  // SERVIÇOS (15+)
  'chaveiro': 'services', 'jardinagem': 'services', 'pedreiro': 'services', 'tecnico-servaci': 'services', 'manutencao-ar': 'services',
  'pintura-serv': 'services', 'limpeza-serv': 'services', 'reparo-serv': 'services', 'mudanca-serv': 'services', 'frete': 'services',
  'advogado': 'services', 'contador': 'services', 'consultoria': 'services', 'design': 'services', 'lavanderia-serv': 'services',
  // PESSOAL (15+)
  'corte-cabelo': 'personal', 'cabeleireiro': 'personal', 'barbearia': 'personal', 'salao': 'personal', 'spa': 'personal',
  'massagem': 'personal', 'skincare': 'personal', 'manicure': 'personal', 'shampoo': 'personal', 'sabonete': 'personal',
  'desodorante': 'personal', 'perfume-pt': 'personal', 'lâmina': 'personal', 'estetica-pt': 'personal', 'higiente': 'personal',
  // CARIDADE (15+)
  'doacao': 'charity', 'ong': 'charity', 'fundacao': 'charity', 'igreja': 'charity', 'dizimo': 'charity',
  'voluntariado': 'charity', 'ajuda-humanitaria': 'charity', 'caridade': 'charity', 'filantropia': 'charity', 'subvencao': 'charity',
  'abrigo': 'charity', 'asilo': 'charity', 'sopao': 'charity', 'vaquinha': 'charity', 'oferta': 'charity',
  // RENDA (15+)
  'salario-pt': 'income', 'pagamento-inc': 'income', 'recebimento': 'income', 'pro-labore': 'income', 'honorarios-pt': 'income',
  'bonus-pt': 'income', 'decimo-terceiro': 'income', 'ferias-inc': 'income', 'comissao-venda': 'income', 'venda-pt': 'income',
  'dividendo-inc': 'income', 'reembolso-pt': 'income', 'presente-dinheiro': 'income', 'pix-recebido': 'income', 'deposito-inc-pt': 'income',
  // CAFE (15+)
  'cafeteria-pt': 'coffee', 'cafe-pt': 'coffee', 'espresso-pt': 'coffee', 'pingado': 'coffee', 'cappuccino-pt': 'coffee',
  'cha': 'coffee', 'infusao': 'coffee', 'padoca': 'coffee', 'expresso': 'coffee', 'moído': 'coffee',
  'pao-de-queijo': 'coffee', 'confeiteira': 'coffee', 'donuts-pt': 'coffee', 'doceria': 'coffee', 'barista-tip-pt': 'coffee',
  // OUTROS (15+)
  'escritorio': 'work', 'negocio': 'business', 'empresa': 'business', 'freelance-pt': 'freelance', 'projeto-pt': 'freelance',
  'cliente-pt': 'freelance', 'venda-business': 'business', 'lucro': 'business', 'juros-ganhos': 'interest', 'presente-pt': 'gift',
  'outros': 'other', 'varios-pt': 'other', 'misc-pt': 'other', 'dinheiro': 'other', 'saque': 'other',
  'caixa': 'other', 'desconhecido-pt': 'other', 'ajuste-pt': 'other', 'transferência-enviada': 'transfer', 'pix-enviado': 'transfer',
  // EMPRESTIMOS (15+)
  'emprestimo': 'loans', 'credito': 'loans', 'divida': 'loans', 'financiamento': 'loans', 'parcela': 'loans',
  'amortizacao': 'loans', 'hipoteca-pgto': 'loans', 'cartao-credito': 'loans', 'juros-emprestimo': 'loans', 'prestacao': 'loans',
  'quitacao': 'loans', 'credor': 'loans', 'linea-credito-pt': 'loans', 'fiador': 'loans',
  'transferencia': 'transfer', 'pix': 'transfer', 'transf': 'transfer',
};

export const getSmartCategories = (lang: string) => {
  if (lang === 'es') return SMART_CATEGORIES_ES;
  if (lang === 'pt') return SMART_CATEGORIES_PT;
  return SMART_CATEGORIES_EN;
};