import { ServicioItem } from '../servicios/types';

export interface ReservaItem {
  id: number;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'completada' | 'cancelada';
  usuarioId: number;
  servicioId: number;
  servicio?: ServicioItem;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
}
