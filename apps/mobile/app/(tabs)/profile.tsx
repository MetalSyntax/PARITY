import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { Typography } from '@parity/ui';

export default function ProfileScreen() {
  const { userProfile } = useData();

  const MENU_ITEMS = [
    { id: 'SYNC', label: 'GOOGLE DRIVE SYNC', icon: 'cloud-upload-outline', color: '#6366f1' },
    { id: 'SECURITY', label: 'SECURITY & BIOMETRICS', icon: 'shield-checkmark-outline', color: '#10b981' },
    { id: 'CURRENCY', label: 'MULTI-CURRENCY SETTINGS', icon: 'cash-outline', color: '#f59e0b' },
    { id: 'DATA', label: 'DATA PORTABILITY', icon: 'download-outline', color: '#ec4899' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2" weight="black">PROFILE</Typography>
        </View>

        <View style={styles.userCard}>
           <View style={styles.avatar}>
             <Typography variant="h3" weight="black">M</Typography>
           </View>
           <View>
             <Typography variant="h4" weight="black">{userProfile?.name || 'User'}</Typography>
             <Typography variant="tiny" color="secondary" weight="bold">PARITY PRO MEMBER</Typography>
           </View>
        </View>

        <View style={styles.menu}>
           {MENU_ITEMS.map(item => (
             <TouchableOpacity key={item.id} style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Typography variant="tiny" weight="black" style={styles.menuLabel}>{item.label}</Typography>
                <Ionicons name="chevron-forward" size={16} color="#333" />
             </TouchableOpacity>
           ))}
        </View>
        
        <TouchableOpacity style={styles.logoutBtn}>
           <Typography variant="tiny" weight="black" color="error">LOGOUT FROM DEVICE</Typography>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 32, marginTop: 12 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 32,
    marginBottom: 32,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    letterSpacing: 1,
  },
  logoutBtn: {
    marginTop: 40,
    alignItems: 'center',
    padding: 20,
  }
});
