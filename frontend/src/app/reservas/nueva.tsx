import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getToken,
  crearReservaApi,
  AuthExpiredError
} from '@/services/api';
import { esFechaFuturaOActual, obtenerFechaManana } from '@/lib/fechas';

export default function NuevaReservaScreen() {
  const params = useLocalSearchParams<{
    servicioId?: string;
    servicioNombre?: string;
    servicioPrecio?: string;
    servicioDuracion?: string;
  }>();
  const router = useRouter();

  const [fecha, setFecha] = useState(obtenerFechaManana());
  const [hora, setHora] = useState('10:00');
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    verificarToken();
  }, []);

  const verificarToken = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/');
    }
  };

  const handleCrearReserva = async () => {
    setMensajeError('');

    if (!params.servicioId) {
      setMensajeError('Selecciona un servicio valido para reservar');
      return;
    }

    if (!fecha.trim() || !hora.trim()) {
      setMensajeError('Por favor ingresa la fecha y la hora de tu reserva');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
      setMensajeError('La fecha debe tener el formato AAAA-MM-DD');
      return;
    }

    if (!/^\d{1,2}:\d{2}$/.test(hora.trim())) {
      setMensajeError('La hora debe tener el formato HH:MM (ej: 10:00)');
      return;
    }

    if (!esFechaFuturaOActual(fecha.trim(), hora.trim())) {
      setMensajeError('No se puede reservar en una fecha u hora pasada');
      return;
    }

    setGuardando(true);
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/');
        return;
      }

      await crearReservaApi(token, {
        servicioId: parseInt(String(params.servicioId), 10),
        fecha: fecha.trim(),
        hora: hora.trim()
      });

      router.replace('/reservas' as any);
    } catch (err: any) {
      if (err instanceof AuthExpiredError || err?.name === 'AuthExpiredError') {
        router.replace('/');
        return;
      }
      setMensajeError(err.message || 'No se pudo completar la reserva');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.topNavigation}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#1b5e48" style={styles.backIcon} />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Nueva reserva</Text>
          <Text style={styles.subtitle}>Elige la fecha y hora para agendar tu servicio</Text>

          {params.servicioNombre ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SERVICIO SELECCIONADO</Text>
              <Text style={styles.summaryTitle}>{params.servicioNombre}</Text>
              <View style={styles.summaryMeta}>
                {params.servicioDuracion ? (
                  <Text style={styles.summaryMetaText}>{params.servicioDuracion} min</Text>
                ) : null}
                {params.servicioPrecio ? (
                  <Text style={styles.summaryPriceText}>
                    ${Number(params.servicioPrecio).toFixed(2)}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {mensajeError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{mensajeError}</Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FECHA (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 2026-11-15"
                placeholderTextColor="#94a3b8"
                value={fecha}
                onChangeText={setFecha}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>HORA (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 10:00"
                placeholderTextColor="#94a3b8"
                value={hora}
                onChangeText={setHora}
              />
            </View>

            <View style={styles.quickHoursRow}>
              {['09:00', '11:00', '15:00', '17:00'].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.hourChip, hora === h && styles.hourChipActive]}
                  onPress={() => setHora(h)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.hourChipText, hora === h && styles.hourChipTextActive]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, guardando && styles.buttonDisabled]}
              onPress={handleCrearReserva}
              disabled={guardando}
              activeOpacity={0.85}
            >
              {guardando ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Confirmar reserva</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12
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
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f2942',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 18
  },
  summaryCard: {
    backgroundColor: '#162e44',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  summaryMetaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1'
  },
  summaryPriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4ade80'
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
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e8edf2',
    gap: 14
  },
  fieldGroup: {
    gap: 6
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1e293b'
  },
  quickHoursRow: {
    flexDirection: 'row',
    gap: 8
  },
  hourChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  hourChipActive: {
    borderColor: '#1b5e48',
    backgroundColor: '#eff8f4'
  },
  hourChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  hourChipTextActive: {
    color: '#1b5e48',
    fontWeight: '800'
  },
  submitButton: {
    backgroundColor: '#1b5e48',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6
  },
  buttonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  }
});
