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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  loginApi,
  registroApi,
  saveToken,
  saveUser,
  getToken,
  decodeJwtPayload
} from '@/services/api';

export default function AuthScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'cliente' | 'admin'>('cliente');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const token = await getToken();
      if (token) {
        router.replace('/home');
      }
    } catch {
    }
  };

  const handleLogin = async () => {
    setMensajeError('');
    setMensajeExito('');

    if (!email.trim() || !password.trim()) {
      setMensajeError('Por favor completa tu correo y contrasena');
      return;
    }

    setCargando(true);
    try {
      const data = await loginApi(email.trim(), password.trim());
      await saveToken(data.token);
      if (data.usuario) {
        await saveUser(data.usuario);
      } else {
        const decoded = decodeJwtPayload(data.token);
        if (decoded) await saveUser(decoded);
      }
      router.replace('/home');
    } catch (err: any) {
      setMensajeError(err.message || 'Error al iniciar sesion');
    } finally {
      setCargando(false);
    }
  };

  const handleRegister = async () => {
    setMensajeError('');
    setMensajeExito('');

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setMensajeError('Por favor completa todos los campos requeridos');
      return;
    }

    setCargando(true);
    try {
      await registroApi(nombre.trim(), email.trim(), password.trim(), rol);
      setMensajeExito('Cuenta creada con exito! Ya puedes iniciar sesion');
      setTab('login');
      setPassword('');
    } catch (err: any) {
      setMensajeError(err.message || 'Error al registrar la cuenta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.topLabel}>MI APLICACION · SERVICIOS</Text>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesion o registrate para continuar.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
                onPress={() => {
                  setTab('login');
                  setMensajeError('');
                  setMensajeExito('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                  Ingresar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}
                onPress={() => {
                  setTab('register');
                  setMensajeError('');
                  setMensajeExito('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                  Registrarme
                </Text>
              </TouchableOpacity>
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

            {tab === 'login' ? (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Correo electronico"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Contrasena"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!mostrarPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setMostrarPassword(!mostrarPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeText}>
                      {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, cargando && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={cargando}
                  activeOpacity={0.85}
                >
                  {cargando ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Iniciar sesion</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#94a3b8"
                  value={nombre}
                  onChangeText={setNombre}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Correo electronico"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Contrasena"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!mostrarPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setMostrarPassword(!mostrarPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeText}>
                      {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.roleSection}>
                  <Text style={styles.roleLabel}>TIPO DE CUENTA (ROL)</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        rol === 'cliente' && styles.roleOptionActive
                      ]}
                      onPress={() => setRol('cliente')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          rol === 'cliente' && styles.roleOptionTextActive
                        ]}
                      >
                        Cliente
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        rol === 'admin' && styles.roleOptionActive
                      ]}
                      onPress={() => setRol('admin')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          rol === 'admin' && styles.roleOptionTextActive
                        ]}
                      >
                        Administrador
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, cargando && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={cargando}
                  activeOpacity={0.85}
                >
                  {cargando ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Registrarme</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
  keyboardContainer: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    justifyContent: 'center'
  },
  header: {
    marginBottom: 28
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 8
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f2942',
    letterSpacing: -0.5,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8edf2'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#edf2f7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b'
  },
  tabTextActive: {
    color: '#1a5944',
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
  successBox: {
    backgroundColor: '#f0fdf4',
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
  form: {
    gap: 14
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1e293b'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingRight: 14
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1e293b'
  },
  eyeButton: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b5e48'
  },
  roleSection: {
    marginTop: 2
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10
  },
  roleOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  roleOptionActive: {
    borderColor: '#1b5e48',
    backgroundColor: '#eff8f4'
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b'
  },
  roleOptionTextActive: {
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
    opacity: 0.7
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  }
});
