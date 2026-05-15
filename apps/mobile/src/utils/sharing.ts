import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const shareFile = async (uri: string, filename: string, mimeType?: string) => {
  if (Platform.OS === 'web') {
    console.warn('Sharing via OS sheet not supported on web. Use blob download.');
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: `Share ${filename}`,
      UTI: mimeType, // iOS specific
    });
  } else {
    console.warn('Sharing not available');
  }
};

export const shareJson = async (data: any, filename: string) => {
  if (Platform.OS === 'web') return;

  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const fileUri = `${FileSystem.cacheDirectory}${filename}.json`;
    
    await FileSystem.writeAsStringAsync(fileUri, jsonStr);
    await shareFile(fileUri, filename, 'application/json');
  } catch (error) {
    console.error('Failed to share JSON', error);
  }
};
