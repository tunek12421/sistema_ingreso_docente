import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para convertir timestamps UTC a hora local de Bolivia (UTC-4)
 * Los timestamps se almacenan en UTC en el backend para garantizar consistencia
 * independientemente de la ubicación del servidor (VPS en Brasil)
 *
 * Uso:
 * {{ fecha | timezoneDisplay }}  // Formato completo: DD/MM/YYYY HH:mm:ss
 * {{ fecha | timezoneDisplay:'short' }}  // Solo hora: HH:mm
 * {{ fecha | timezoneDisplay:'date' }}  // Solo fecha: DD/MM/YYYY
 */
@Pipe({
  name: 'timezoneDisplay',
  standalone: true
})
export class TimezoneDisplayPipe implements PipeTransform {

  transform(value: string | Date | null | undefined, format: 'full' | 'short' | 'date' = 'full'): string {
    if (!value) return '';

    try {
      // Parsear la fecha (viene como UTC del backend)
      const date = typeof value === 'string' ? new Date(value) : value;

      if (isNaN(date.getTime())) return '';

      // Convertir a timezone de Bolivia (UTC-4)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };

      const formatter = new Intl.DateTimeFormat('es-BO', options);
      const parts = formatter.formatToParts(date);

      const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

      const day = getPart('day');
      const month = getPart('month');
      const year = getPart('year');
      const hour = getPart('hour');
      const minute = getPart('minute');
      const second = getPart('second');

      switch (format) {
        case 'short':
          return `${hour}:${minute}`;
        case 'date':
          return `${day}/${month}/${year}`;
        case 'full':
        default:
          return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
      }
    } catch (error) {
      console.error('Error en timezoneDisplay pipe:', error);
      return '';
    }
  }

}
