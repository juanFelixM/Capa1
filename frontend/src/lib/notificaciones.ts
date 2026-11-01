import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICACIONES_KEY = '@notificaciones_reservas';
const CANAL_RESERVAS = 'reservas';
const HORAS_ANTICIPACION = 24;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

const soportado = () => Platform.OS !== 'web';

const leerMapa = async (): Promise<Record<string, string>> => {
  try {
    const data = await AsyncStorage.getItem(NOTIFICACIONES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const guardarMapa = async (mapa: Record<string, string>) => {
  await AsyncStorage.setItem(NOTIFICACIONES_KEY, JSON.stringify(mapa));
};

export const solicitarPermisosNotificaciones = async (): Promise<boolean> => {
  if (!soportado()) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL_RESERVAS, {
        name: 'Reservas',
        importance: Notifications.AndroidImportance.DEFAULT
      });
    }
    const { status: estadoActual } = await Notifications.getPermissionsAsync();
    if (estadoActual === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

export const programarRecordatorio = async (reserva: {
  id: number;
  fecha: string;
  hora: string;
  servicio?: { nombre: string };
}) => {
  if (!soportado()) return;
  try {
    const [anio, mes, dia] = reserva.fecha.split('-').map(Number);
    const [horas, minutos] = reserva.hora.split(':').map(Number);
    const fechaReserva = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);
    const momentoRecordatorio = new Date(
      fechaReserva.getTime() - HORAS_ANTICIPACION * 60 * 60 * 1000
    );

    if (momentoRecordatorio.getTime() <= Date.now()) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await cancelarRecordatorio(reserva.id);

    const nombreServicio = reserva.servicio?.nombre ?? 'tu servicio';
    const identificador = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de reserva',
        body: `Tienes "${nombreServicio}" programado para el ${reserva.fecha} a las ${reserva.hora}.`
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: momentoRecordatorio,
        channelId: CANAL_RESERVAS
      }
    });

    const mapa = await leerMapa();
    mapa[String(reserva.id)] = identificador;
    await guardarMapa(mapa);
  } catch {
  }
};

export const cancelarRecordatorio = async (reservaId: number) => {
  if (!soportado()) return;
  try {
    const mapa = await leerMapa();
    const clave = String(reservaId);
    const identificador = mapa[clave];
    if (!identificador) return;

    await Notifications.cancelScheduledNotificationAsync(identificador);
    delete mapa[clave];
    await guardarMapa(mapa);
  } catch {
  }
};
