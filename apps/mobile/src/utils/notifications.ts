import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const setupNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'web') return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00C853',
      });
    }

    // In a real app, you'd get the token here
    // const token = (await Notifications.getExpoPushTokenAsync()).data;
    // return token;
    return 'dummy-token';
  } catch (error) {
    console.error('Failed to register for push notifications', error);
    return null;
  }
};
