import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { solicitarPermisosNotificaciones } from '@/lib/notificaciones';

export default function RootLayout() {
  useEffect(() => {
    solicitarPermisosNotificaciones();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f3f6f9' }
        }}
      />
    </>
  );
}
