import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getToken,
  getUser,
  getServiciosApi,
  crearServicioApi,
  editarServicioApi,
  eliminarServicioApi,
  AuthExpiredError
} from '@/services/api';
import { ServicioItem } from '@/features/servicios/types';

export default function ServiciosIndexScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [servicios, setServicios] = useState<ServicioItem[]>([]);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState<ServicioItem | null>(null);
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
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        router.replace('/');
        return;
      }
      setToken(storedToken);
      const user = await getUser();
      setEsAdmin(user?.rol === 'admin');
      await cargarServicios(storedToken);
    } catch (err: any) {
      manejarError(err, 'Error al iniciar la sesion');
    } finally {
      setCargando(false);
    }
  };

  const cargarServicios = async (authToken: string) => {
    try {
      const data = await getServiciosApi(authToken);
      setServicios(data);
    } catch (err: any) {
      manejarError(err, 'Error al cargar los servicios');
    }
  };

  const limpiarFormulario = () => {
    setNombre('');
    setDescripcion('');
    setDuracion('');
    setPrecio('');
    setEditandoId(null);
  };

  const handleGuardarServicio = async () => {
    if (!token) return;
    setMensajeError('');

    if (!nombre.trim() || !descripcion.trim() || !duracion.trim() || !precio.trim()) {
      setMensajeError('Por favor completa nombre, descripcion, duracion y precio');
      return;
    }

    const duracionNum = parseInt(duracion, 10);
    const precioNum = parseFloat(precio);

    if (isNaN(duracionNum) || duracionNum <= 0 || isNaN(precioNum) || precioNum < 0) {
      setMensajeError('Ingresa valores numericos validos para duracion y precio');
      return;
    }

    setGuardando(true);
    try {
      if (editandoId !== null) {
        const actualizado = await editarServicioApi(token, editandoId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          duracion: duracionNum,
          precio: precioNum
        });
        setServicios((prev) =>
          prev.map((s) => (s.id === editandoId ? actualizado : s))
        );
      } else {
        const nuevo = await crearServicioApi(token, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          duracion: duracionNum,
          precio: precioNum
        });
        setServicios((prev) => [...prev, nuevo]);
      }
      limpiarFormulario();
    } catch (err: any) {
      manejarError(err, 'No se pudo guardar el servicio');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (servicio: ServicioItem) => {
    setMensajeError('');
    setEditandoId(servicio.id);
    setNombre(servicio.nombre);
    setDescripcion(servicio.descripcion);
    setDuracion(String(servicio.duracion));
    setPrecio(String(servicio.precio));
  };

  const confirmarEliminar = async () => {
    if (!token || !servicioAEliminar) return;

    const id = servicioAEliminar.id;
    setEliminando(true);
    setMensajeError('');
    try {
      await eliminarServicioApi(token, id);
      setServicios((prev) => prev.filter((s) => s.id !== id));
      setServicioAEliminar(null);
      if (editandoId === id) limpiarFormulario();
    } catch (err: any) {
      setServicioAEliminar(null);
      manejarError(err, 'No se pudo eliminar el servicio');
    } finally {
      setEliminando(false);
    }
  };

  const renderItem = ({ item }: { item: ServicioItem }) => (
    <View style={styles.serviceCard}>
      <TouchableOpacity
        style={styles.serviceInfo}
        onPress={() => router.push(`/servicios/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <Text style={styles.serviceTitle}>{item.nombre}</Text>
        {item.descripcion ? (
          <Text style={styles.serviceDesc} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="time-outline" size={14} color="#1b5e48" />
            <Text style={styles.metaBadgeText}>{item.duracion} min</Text>
          </View>

          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${Number(item.precio).toFixed(2)}</Text>
          </View>

          <View style={styles.detailLinkBadge}>
            <Text style={styles.detailLinkText}>Ver detalle</Text>
            <Ionicons name="chevron-forward" size={13} color="#1b5e48" />
          </View>
        </View>
      </TouchableOpacity>

      {esAdmin ? (
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => iniciarEdicion(item)}
            activeOpacity={0.7}
            accessibilityLabel="Editar servicio"
          >
            <Ionicons name="create-outline" size={20} color="#0f2942" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setServicioAEliminar(item)}
            activeOpacity={0.7}
            accessibilityLabel="Eliminar servicio"
          >
            <Ionicons name="trash-outline" size={20} color="#b91c1c" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            style={styles.reservasLinkButton}
            onPress={() => router.push('/reservas' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color="#1b5e48" />
            <Text style={styles.reservasLinkText}>Reservas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Servicios</Text>
          <Text style={styles.subtitle}>
            {esAdmin
              ? 'Administra los servicios o toca uno para ver su detalle'
              : 'Toca un servicio para ver su detalle y reservar'}
          </Text>
        </View>

        {esAdmin ? (
          <View style={styles.formCard}>
            <View style={styles.formHeaderRow}>
              <Text style={styles.formLabel}>
                {editandoId !== null ? 'Editar servicio' : 'Nuevo servicio'}
              </Text>
              {editandoId !== null ? (
                <TouchableOpacity onPress={limpiarFormulario}>
                  <Text style={styles.cancelEditText}>Cancelar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre del servicio"
              placeholderTextColor="#94a3b8"
              value={nombre}
              onChangeText={setNombre}
            />

            <TextInput
              style={styles.input}
              placeholder="Descripcion"
              placeholderTextColor="#94a3b8"
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, { flex: 1, minWidth: 0 }]}
                placeholder="Duracion (min)"
                placeholderTextColor="#94a3b8"
                value={duracion}
                onChangeText={setDuracion}
                keyboardType="numeric"
              />

              <TextInput
                style={[styles.input, { flex: 1, minWidth: 0 }]}
                placeholder="Precio ($)"
                placeholderTextColor="#94a3b8"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, guardando && styles.buttonDisabled]}
              onPress={handleGuardarServicio}
              disabled={guardando}
              activeOpacity={0.85}
            >
              {guardando ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editandoId !== null ? 'Guardar cambios' : 'Crear servicio'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

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
            data={servicios}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay servicios registrados</Text>
              </View>
            }
          />
        )}

        <Modal
          visible={servicioAEliminar !== null}
          transparent
          animationType="fade"
          onRequestClose={() => !eliminando && setServicioAEliminar(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Eliminar servicio</Text>
              <Text style={styles.modalMessage}>
                Estas seguro de que deseas eliminar este servicio?
              </Text>
              {servicioAEliminar?.nombre ? (
                <Text style={styles.modalTaskPreview} numberOfLines={2}>
                  "{servicioAEliminar.nombre}"
                </Text>
              ) : null}

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setServicioAEliminar(null)}
                  disabled={eliminando}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalDeleteButton, eliminando && styles.buttonDisabled]}
                  onPress={confirmarEliminar}
                  disabled={eliminando}
                  activeOpacity={0.8}
                >
                  {eliminando ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalDeleteText}>Eliminar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  reservasLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dceee6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6
  },
  reservasLinkText: {
    color: '#1b5e48',
    fontSize: 13,
    fontWeight: '800'
  },
  header: {
    marginBottom: 16
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
    fontWeight: '500'
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8edf2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 10
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f2942'
  },
  cancelEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c'
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1e293b'
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10
  },
  saveButton: {
    backgroundColor: '#1b5e48',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  buttonDisabled: {
    opacity: 0.6
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
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  serviceInfo: {
    flex: 1
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f2942',
    marginBottom: 4
  },
  serviceDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 18
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff8f4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5e48'
  },
  priceBadge: {
    backgroundColor: '#162e44',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  detailLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2
  },
  detailLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1b5e48'
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc'
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
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6
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
  modalTaskPreview: {
    fontSize: 13,
    fontWeight: '600',
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
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569'
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  }
});
