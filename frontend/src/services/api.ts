import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

const TOKEN_KEY = '@jwt_token';
const USER_KEY = '@user_data';

export class AuthExpiredError extends Error {
  constructor(message = 'Sesion expirada. Por favor inicia sesion nuevamente.') {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

export const decodeJwtPayload = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token && isTokenExpired(token)) {
    await removeToken();
    return null;
  }
  return token;
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};

export const saveUser = async (user: any) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<any | null> => {
  const data = await AsyncStorage.getItem(USER_KEY);
  if (data) return JSON.parse(data);
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) return decodeJwtPayload(token);
  return null;
};

const checkResponse = async (response: Response, defaultMsg: string) => {
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 || (response.status === 403 && data?.error?.toLowerCase().includes('token'))) {
    await removeToken();
    throw new AuthExpiredError(data.error || 'Tu sesion ha expirado');
  }
  if (!response.ok) {
    throw new Error(data.error || defaultMsg);
  }
  return data;
};

export const loginApi = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al iniciar sesion');
  }
  return data;
};

export const registroApi = async (
  nombre: string,
  email: string,
  password: string,
  rol: 'cliente' | 'admin'
) => {
  const response = await fetch(`${API_URL}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password, rol })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al registrar usuario');
  }
  return data;
};

export const getServiciosApi = async (token: string) => {
  const response = await fetch(`${API_URL}/servicios`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return await checkResponse(response, 'Error al obtener los servicios');
};

export const getServicioByIdApi = async (token: string, id: number | string) => {
  const response = await fetch(`${API_URL}/servicios/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return await checkResponse(response, 'Error al obtener el detalle del servicio');
};

export const crearServicioApi = async (
  token: string,
  servicio: { nombre: string; descripcion: string; duracion: number; precio: number }
) => {
  const response = await fetch(`${API_URL}/servicios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(servicio)
  });
  return await checkResponse(response, 'Error al crear el servicio');
};

export const editarServicioApi = async (
  token: string,
  id: number,
  servicio: { nombre?: string; descripcion?: string; duracion?: number; precio?: number }
) => {
  const response = await fetch(`${API_URL}/servicios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(servicio)
  });
  return await checkResponse(response, 'Error al editar el servicio');
};

export const eliminarServicioApi = async (token: string, id: number) => {
  const response = await fetch(`${API_URL}/servicios/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return await checkResponse(response, 'Error al eliminar el servicio');
};

export const crearReservaApi = async (
  token: string,
  reserva: { servicioId: number; fecha: string; hora: string }
) => {
  const response = await fetch(`${API_URL}/reservas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reserva)
  });
  return await checkResponse(response, 'Error al crear la reserva');
};

export const getMisReservasApi = async (token: string) => {
  const response = await fetch(`${API_URL}/reservas/mis-reservas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return await checkResponse(response, 'Error al obtener tus reservas');
};

export const getTodasReservasApi = async (token: string) => {
  const response = await fetch(`${API_URL}/reservas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return await checkResponse(response, 'Error al obtener todas las reservas');
};

export const cambiarEstadoReservaApi = async (
  token: string,
  id: number,
  estado: 'pendiente' | 'completada' | 'cancelada'
) => {
  const response = await fetch(`${API_URL}/reservas/${id}/estado`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ estado })
  });
  return await checkResponse(response, 'Error al actualizar el estado de la reserva');
};

export const cancelarReservaApi = async (token: string, id: number) => {
  const response = await fetch(`${API_URL}/reservas/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return await checkResponse(response, 'Error al cancelar la reserva');
};
