import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getToken,
  getServicioByIdApi,
  AuthExpiredError
} from '@/services/api';
import { ServicioItem } from '@/features/servicios/types';

export default function DetalleServicioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [servicio, setServicio] = useState<ServicioItem | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const cargarDetalle = async () => {
    setCargando(true);
    setMensajeError('');
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/');
        return;
      }
      const data = await getServicioByIdApi(token, String(id));
      setServicio(data);
    } catch (err: any) {
      if (err instanceof AuthExpiredError || err?.name === 'AuthExpiredError') {
        router.replace('/');
        return;
      }
      setMensajeError(err.message || 'No se pudo cargar el servicio');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topNavigation}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1b5e48" style={styles.backIcon} />
            <Text style={styles.backButtonText}>Servicios</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.topLabel}>DETALLE DEL SERVICIO</Text>

        {mensajeError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        ) : null}

        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1b5e48" />
          </View>
        ) : servicio ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>{servicio.nombre}</Text>
              <Text style={styles.heroSubtitle}>{servicio.descripcion}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>DURACION ESTIMADA</Text>
                <View style={styles.valueRow}>
                  <Ionicons name="time-outline" size={22} color="#1b5e48" />
                  <Text style={styles.infoValue}>{servicio.duracion} minutos</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { marginTop: 18 }]}>
                <Text style={styles.infoLabel}>PRECIO DEL SERVICIO</Text>
                <Text style={styles.priceValue}>${Number(servicio.precio).toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.reservarButton}
              onPress={() =>
                router.push({
                  pathname: '/reservas/nueva',
                  params: {
                    servicioId: String(servicio.id),
                    servicioNombre: servicio.nombre,
                    servicioPrecio: String(servicio.precio),
                    servicioDuracion: String(servicio.duracion)
                  }
                } as any)
              }
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.reservarButtonText}>Reservar</Text>
            </TouchableOpacity>
          </>
        ) : null}
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
    paddingTop: 12,
    paddingBottom: 40
  },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backIcon: {
    marginRight: 6
  },
  backButtonText: {
    color: '#1b5e48',
    fontSize: 16,
    fontWeight: '800'
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 14
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
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 22,
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f2942'
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1b5e48'
  },
  reservarButton: {
    backgroundColor: '#1b5e48',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  reservarButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800'
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
