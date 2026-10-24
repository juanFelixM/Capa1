import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getToken,
  getUser,
  getMisReservasApi,
  getTodasReservasApi,
  cambiarEstadoReservaApi,
  cancelarReservaApi,
  AuthExpiredError
} from '@/services/api';
import { ReservaItem } from '@/features/reservas/types';

export default function ReservasIndexScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [usuarioActualId, setUsuarioActualId] = useState<number | null>(null);
  const [reservas, setReservas] = useState<ReservaItem[]>([]);

  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [reservaACancelar, setReservaACancelar] = useState<ReservaItem | null>(null);
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    inicializar();
  }, []);

  const manejarError = (err: any, fallback: string) => {
    if (err instanceof AuthExpiredError || err?.name === 'AuthExpiredError') {
      router.replace('/');
      return;
    }
    setMensajeError(err.message || fallback);
  };

  const inicializar = async () => {
    setCargando(true);
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        router.replace('/');
        return;
      }
      setToken(storedToken);
      const user = await getUser();
      const adminFlag = user?.rol === 'admin';
      setEsAdmin(adminFlag);
      setUsuarioActualId(user?.id ?? null);

      const data = adminFlag
        ? await getTodasReservasApi(storedToken)
        : await getMisReservasApi(storedToken);
      setReservas(data);
    } catch (err: any) {
      manejarError(err, 'Error al cargar las reservas');
    } finally {
      setCargando(false);
    }
  };

  const handleCompletar = async (reserva: ReservaItem) => {
    if (!token) return;
    setProcesandoId(reserva.id);
    setMensajeError('');
    try {
      const actualizada = await cambiarEstadoReservaApi(token, reserva.id, 'completada');
      setReservas((prev) =>
        prev.map((r) => (r.id === reserva.id ? actualizada : r))
      );
    } catch (err: any) {
      manejarError(err, 'No se pudo completar la reserva');
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarCancelar = async () => {
    if (!token || !reservaACancelar) return;
    const id = reservaACancelar.id;
    setProcesandoId(id);
    setMensajeError('');
    try {
      const actualizada = await cancelarReservaApi(token, id);
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? actualizada : r))
      );
      setReservaACancelar(null);
    } catch (err: any) {
      setReservaACancelar(null);
      manejarError(err, 'No se pudo cancelar la reserva');
    } finally {
      setProcesandoId(null);
    }
  };

  const getBadgeStyle = (estado: ReservaItem['estado']) => {
    if (estado === 'completada') {
      return { bg: '#dcfce7', text: '#15803d', label: 'COMPLETADA' };
    }
    if (estado === 'cancelada') {
      return { bg: '#fee2e2', text: '#b91c1c', label: 'CANCELADA' };
    }
    return { bg: '#fef3c7', text: '#b45309', label: 'PENDIENTE' };
  };

  const renderItem = ({ item }: { item: ReservaItem }) => {
    const badge = getBadgeStyle(item.estado);
    const puedeCancelar =
      item.estado === 'pendiente' &&
      (!esAdmin || item.usuarioId === usuarioActualId);

    return (
      <View style={styles.reservaCard}>
        <View style={styles.topCardRow}>
          <Text style={styles.serviceName}>
            {item.servicio?.nombre || `Servicio #${item.servicioId}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        {esAdmin && item.usuario ? (
          <Text style={styles.clientText}>
            Cliente: {item.usuario.nombre} ({item.usuario.email})
          </Text>
        ) : null}

        <View style={styles.dateRow}>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={14} color="#0f2942" />
            <Text style={styles.dateChipText}>{item.fecha}</Text>
          </View>

          <View style={styles.dateChip}>
            <Ionicons name="time-outline" size={14} color="#0f2942" />
            <Text style={styles.dateChipText}>{item.hora}</Text>
          </View>

          {item.servicio?.precio !== undefined ? (
            <View style={styles.priceChip}>
              <Text style={styles.priceChipText}>
                ${Number(item.servicio.precio).toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>

        {item.estado === 'pendiente' ? (
          <View style={styles.actionsRow}>
            {esAdmin ? (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleCompletar(item)}
                disabled={procesandoId === item.id}
                activeOpacity={0.8}
              >
                {procesandoId === item.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                    <Text style={styles.completeButtonText}>Marcar completada</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            {puedeCancelar ? (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setReservaACancelar(item)}
                disabled={procesandoId === item.id}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topNavigation}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/home')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1b5e48" style={styles.backIcon} />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviciosLinkButton}
            onPress={() => router.push('/servicios')}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={16} color="#1b5e48" />
            <Text style={styles.serviciosLinkText}>Nueva reserva</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            {esAdmin ? 'Todas las reservas' : 'Mis reservas'}
          </Text>
          <Text style={styles.subtitle}>
            {esAdmin
              ? 'Gestiona el estado de las reservas del sistema'
              : 'Consulta tus servicios agendados y su estado'}
          </Text>
        </View>

        {mensajeError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        ) : null}

        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1b5e48" />
          </View>
        ) : (
          <FlatList
            data={reservas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay reservas registradas</Text>
              </View>
            }
          />
        )}

        <Modal
          visible={reservaACancelar !== null}
          transparent
          animationType="fade"
          onRequestClose={() => !procesandoId && setReservaACancelar(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Cancelar reserva</Text>
              <Text style={styles.modalMessage}>
                Estas seguro de que deseas cancelar esta reserva pendiente?
              </Text>
              {reservaACancelar?.servicio?.nombre ? (
                <Text style={styles.modalPreview}>
                  "{reservaACancelar.servicio.nombre}" ({reservaACancelar.fecha} · {reservaACancelar.hora})
                </Text>
              ) : null}

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setReservaACancelar(null)}
                  disabled={procesandoId !== null}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalBackText}>Volver</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmCancelButton}
                  onPress={confirmarCancelar}
                  disabled={procesandoId !== null}
                  activeOpacity={0.8}
                >
                  {procesandoId !== null ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalConfirmCancelText}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f6f9'
  },
  container: {
    flex: 1,
    paddingHorizontal: 22
  },
  topNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14
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
  serviciosLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dceee6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5
  },
  serviciosLinkText: {
    color: '#1b5e48',
    fontSize: 13,
    fontWeight: '800'
  },
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f2942',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  listContent: {
    paddingBottom: 32
  },
  reservaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8edf2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  topCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f2942',
    flex: 1,
    marginRight: 8
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4
  },
  clientText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f2942'
  },
  priceChip: {
    backgroundColor: '#162e44',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  priceChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b5e48',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6
  },
  cancelButtonText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f2942',
    marginBottom: 8
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12
  },
  modalPreview: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12
  },
  modalBackButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modalBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569'
  },
  modalConfirmCancelButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modalConfirmCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  }
});
