import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUser, getToken, removeToken } from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    const localUser = await getUser();
    if (localUser) {
      setUsuario(localUser);
    }
  };

  const handleCerrarSesion = async () => {
    await removeToken();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.topLabel}>INICIO</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            ¡Hola, {usuario?.nombre || 'Usuario'}!
          </Text>
          <Text style={styles.heroSubtitle}>
            Gestiona y reserva tus servicios de forma rapida.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CORREO ELECTRONICO</Text>
            <Text style={styles.infoValue}>
              {usuario?.email || ''}
            </Text>
          </View>

          <View style={[styles.infoRow, { marginTop: 16 }]}>
            <Text style={styles.infoLabel}>ROL DE USUARIO</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {usuario?.rol === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/servicios')}
          activeOpacity={0.85}
        >
          <View style={styles.buttonContentRow}>
            <Text style={styles.primaryButtonText}>Ir a los servicios</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" style={styles.arrowIcon} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/reservas' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.buttonContentRow}>
            <Ionicons name="calendar-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>
              {usuario?.rol === 'admin' ? 'Gestionar reservas' : 'Mis reservas'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleCerrarSesion}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutButtonText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f6f9'
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40
  },
  topLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: 1.2,
    marginBottom: 16
  },
  heroCard: {
    backgroundColor: '#162e44',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 8
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500'
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8edf2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  infoRow: {},
  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 6
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f2942',
    letterSpacing: -0.2
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#dceee6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  badgeText: {
    color: '#1b5e48',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  primaryButton: {
    backgroundColor: '#1b5e48',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  secondaryButton: {
    backgroundColor: '#0f2942',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  arrowIcon: {
    marginLeft: 8
  },
  logoutButton: {
    backgroundColor: '#dceee6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  logoutButtonText: {
    color: '#1b5e48',
    fontSize: 16,
    fontWeight: '800'
  }
});
