import { useQuery } from '@tanstack/react-query';
import { Currency } from '@parity/core';
import { DolarApiResponseSchema } from '@parity/core';

export interface ExchangeRatesResult {
  exchangeRate: number | null;
  usdRateParallel: number | null;
  euroRate: number | null;
  euroRateParallel: number | null;
  rateEntries: Array<{ date: string; rate: number; currency: Currency }>;
}

async function fetchRates(): Promise<ExchangeRatesResult> {
  const today = new Date().toISOString().split('T')[0];

  const [usdRes, eurRes] = await Promise.all([
    fetch('https://ve.dolarapi.com/v1/dolares'),
    fetch('https://ve.dolarapi.com/v1/euros'),
  ]);

  let exchangeRate: number | null = null;
  let usdRateParallel: number | null = null;
  let euroRate: number | null = null;
  let euroRateParallel: number | null = null;
  const rateEntries: ExchangeRatesResult['rateEntries'] = [];

  if (usdRes.ok) {
    const raw = await usdRes.json();
    const parsed = DolarApiResponseSchema.safeParse(raw);
    const data = parsed.success ? parsed.data : (Array.isArray(raw) ? raw : []);
    const official = data.find((r: any) => r.fuente === 'oficial');
    const parallel = data.find((r: any) => r.fuente === 'paralelo');
    if (official) {
      exchangeRate = Number(official.promedio);
      rateEntries.push({ date: today, rate: exchangeRate, currency: Currency.USD });
      localStorage.setItem('last_bcv_update', Date.now().toString());
    }
    if (parallel) usdRateParallel = Number(parallel.promedio);
  }

  if (eurRes.ok) {
    const raw = await eurRes.json();
    const parsed = DolarApiResponseSchema.safeParse(raw);
    const data = parsed.success ? parsed.data : (Array.isArray(raw) ? raw : []);
    const official = data.find((r: any) => r.fuente === 'oficial');
    const parallel = data.find((r: any) => r.fuente === 'paralelo');
    if (official) {
      euroRate = Number(official.promedio);
      rateEntries.push({ date: today, rate: euroRate, currency: Currency.EUR });
    }
    if (parallel) euroRateParallel = Number(parallel.promedio);
  }

  return { exchangeRate, usdRateParallel, euroRate, euroRateParallel, rateEntries };
}

export function useExchangeRates(enabled: boolean) {
  return useQuery({
    queryKey: ['exchangeRates'],
    queryFn: fetchRates,
    enabled,
    staleTime: 1000 * 60 * 5,    // 5 minutes
    gcTime: 1000 * 60 * 30,       // 30 minutes in cache
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    networkMode: 'offlineFirst',
  });
}
