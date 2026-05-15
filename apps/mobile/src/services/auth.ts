import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'parity_pin';

export const getStoredPin = async (): Promise<string> => {
  try {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    return pin || '0000';
  } catch (error) {
    console.error('Failed to get PIN from SecureStore', error);
    return '0000';
  }
};

export const setStoredPin = async (pin: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  } catch (error) {
    console.error('Failed to set PIN in SecureStore', error);
  }
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const storedPin = await getStoredPin();
  return pin === storedPin;
};
