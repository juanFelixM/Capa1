export const esFechaFuturaOActual = (fechaStr: string, horaStr?: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr.trim())) return false;
  const [anio, mes, dia] = fechaStr.trim().split('-').map(Number);
  const ahora = new Date();

  if (horaStr && /^\d{1,2}:\d{2}$/.test(horaStr.trim())) {
    const [horas, minutos] = horaStr.trim().split(':').map(Number);
    if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return false;
    const fechaHora = new Date(anio, mes - 1, dia, horas, minutos, 0, 0);
    return fechaHora >= ahora;
  }

  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fecha = new Date(anio, mes - 1, dia);
  return fecha >= hoy;
};

export const obtenerFechaManana = (): string => {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const y = manana.getFullYear();
  const m = String(manana.getMonth() + 1).padStart(2, '0');
  const d = String(manana.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
