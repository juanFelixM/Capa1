import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getToken,
  getUser,
  saveUser,
  removeToken,
  actualizarPerfilApi,
  AuthExpiredError
} from '@/services/api';

export default function PerfilScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    const localUser = await getUser();
    if (localUser) {
      setUsuario(localUser);
      setNombre(localUser.nombre || '');
    }
  };

  const handleGuardar = async () => {
    setMensajeError('');
    setMensajeExito('');

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setMensajeError('El nombre no puede estar vacio');
      return;
    }

    setGuardando(true);
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/');
        return;
      }

      const actualizado = await actualizarPerfilApi(token, nombreLimpio);
      const usuarioActualizado = { ...usuario, ...actualizado };
      await saveUser(usuarioActualizado);
      setUsuario(usuarioActualizado);
      setNombre(actualizado.nombre);
      setMensajeExito('Perfil actualizado correctamente');
    } catch (err: any) {
      if (err instanceof AuthExpiredError || err?.name === 'AuthExpiredError') {
        router.replace('/');
        return;
      }
      setMensajeError(err.message || 'No se pudo actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarSesion = async () => {
    await removeToken();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topNavigation}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/home')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1b5e48" style={styles.backIcon} />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>Consulta y edita tus datos personales</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>NOMBRE</Text>
          <Text style={styles.infoValue}>{usuario?.nombre || ''}</Text>

          <Text style={[styles.infoLabel, styles.infoLabelSpaced]}>CORREO ELECTRONICO</Text>
          <Text style={styles.infoValue}>{usuario?.email || ''}</Text>

          <Text style={[styles.infoLabel, styles.infoLabelSpaced]}>ROL DE USUARIO</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {usuario?.rol === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE'}
            </Text>
          </View>
        </View>

        {mensajeError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        ) : null}

        {mensajeExito ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{mensajeExito}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>EDITAR NOMBRE</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#94a3b8"
            value={nombre}
            onChangeText={setNombre}
          />

          <TouchableOpacity
            style={[styles.saveButton, guardando && styles.buttonDisabled]}
            onPress={handleGuardar}
            disabled={guardando}
            activeOpacity={0.85}
          >
            {guardando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleCerrarSesion}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#b91c1c" style={styles.logoutIcon} />
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
  infoCard: {
    backgroundColor: '#162e44',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6
  },
  infoLabelSpaced: {
    marginTop: 14
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#1b5e48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
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
  successBox: {
    backgroundColor: '#eff8f4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  successText: {
    color: '#15803d',
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
    gap: 10,
    marginBottom: 18
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
  saveButton: {
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
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoutIcon: {
    marginRight: 8
  },
  logoutButtonText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '800'
  }
});
