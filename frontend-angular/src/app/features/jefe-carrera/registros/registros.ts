import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService } from '../../../core/services/registro.service';
import { DocenteService } from '../../../core/services/docente.service';
import { Registro } from '../../../shared/models';

interface RegistroAgrupado {
  id: number;
  docente_id: number;
  docente_ci: string;
  docente_nombre_completo: string;
  llave_id: number;
  llave_codigo: string;
  aula_codigo: string;
  turno_nombre: string;
  hora_ingreso?: string;
  hora_salida?: string;
  fecha: string;
  minutos_retraso?: number;
  minutos_extra?: number;
}

@Component({
  selector: 'app-jefe-carrera-registros',
  imports: [CommonModule, FormsModule],
  templateUrl: './registros.html',
  styleUrl: './registros.css'
})
export class JefeCarreraRegistros implements OnInit {
  registrosRaw = signal<Registro[]>([]);
  docentes = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // Filtros
  fechaInicio = signal<string>(this.getToday());
  fechaFin = signal<string>(this.getToday());
  docenteSeleccionado = signal<string>('');

  // Computed signal para agrupar y filtrar registros
  registros = computed(() => {
    const raw = this.registrosRaw();
    const docenteId = this.docenteSeleccionado();
    const grouped = new Map<string, RegistroAgrupado>();

    // Filtrar por docente si está seleccionado
    const registrosFiltrados = docenteId
      ? raw.filter(r => String(r.docente_id) === docenteId)
      : raw;

    registrosFiltrados.forEach(reg => {
      const fecha = this.extractDate(reg.fecha_hora);
      const key = `${reg.docente_id}-${reg.llave_id}-${fecha}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: reg.id,
          docente_id: reg.docente_id,
          docente_ci: String(reg.docente_ci || ''),
          docente_nombre_completo: reg.docente_nombre || reg.docente_nombre_completo || '',
          llave_id: reg.llave_id,
          llave_codigo: reg.llave_codigo || '',
          aula_codigo: reg.aula_codigo || '',
          turno_nombre: reg.turno_nombre || '',
          fecha: fecha,
          hora_ingreso: reg.tipo === 'ingreso' ? reg.fecha_hora : undefined,
          hora_salida: reg.tipo === 'salida' ? reg.fecha_hora : undefined,
          minutos_retraso: reg.minutos_retraso,
          minutos_extra: reg.minutos_extra
        });
      } else {
        const existing = grouped.get(key)!;
        if (reg.tipo === 'ingreso' && !existing.hora_ingreso) {
          existing.hora_ingreso = reg.fecha_hora;
          existing.minutos_retraso = reg.minutos_retraso;
        } else if (reg.tipo === 'salida' && !existing.hora_salida) {
          existing.hora_salida = reg.fecha_hora;
          existing.minutos_extra = reg.minutos_extra;
        }
      }
    });

    // Ordenar por fecha más reciente primero
    return Array.from(grouped.values()).sort((a, b) => {
      const fechaA = a.hora_ingreso || a.hora_salida || '';
      const fechaB = b.hora_ingreso || b.hora_salida || '';
      return fechaB.localeCompare(fechaA);
    });
  });

  // Estadísticas
  totalRegistros = computed(() => this.registros().length);
  registrosCompletos = computed(() =>
    this.registros().filter(r => r.hora_ingreso && r.hora_salida).length
  );
  registrosIncompletos = computed(() =>
    this.registros().filter(r => !r.hora_ingreso || !r.hora_salida).length
  );

  constructor(
    private registroService: RegistroService,
    private docenteService: DocenteService
  ) {}

  ngOnInit(): void {
    this.loadDocentes();
    this.loadRegistros();
  }

  loadDocentes(): void {
    this.docenteService.getAll().subscribe({
      next: (docentes) => {
        this.docentes.set(docentes || []);
      },
      error: (err) => {
        console.error('Error al cargar docentes:', err);
      }
    });
  }

  loadRegistros(): void {
    this.loading.set(true);
    this.error.set('');

    const fechaInicio = this.fechaInicio();
    const fechaFin = this.fechaFin();

    // Si fechaInicio y fechaFin son iguales, usar getByFecha
    if (fechaInicio === fechaFin) {
      this.registroService.getByFecha(fechaInicio).subscribe({
        next: (registros) => {
          this.registrosRaw.set(registros || []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar registros:', err);
          this.error.set('Error al cargar los registros');
          this.registrosRaw.set([]);
          this.loading.set(false);
        }
      });
    } else {
      // TODO: Implementar endpoint para rango de fechas en el backend
      // Por ahora, usar la fecha de inicio
      this.registroService.getByFecha(fechaInicio).subscribe({
        next: (registros) => {
          this.registrosRaw.set(registros || []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar registros:', err);
          this.error.set('Error al cargar los registros');
          this.registrosRaw.set([]);
          this.loading.set(false);
        }
      });
    }
  }

  aplicarFiltros(): void {
    this.loadRegistros();
  }

  limpiarFiltros(): void {
    this.fechaInicio.set(this.getToday());
    this.fechaFin.set(this.getToday());
    this.docenteSeleccionado.set('');
    this.loadRegistros();
  }

  exportarReporte(): void {
    const registros = this.registros();

    // Crear CSV
    const headers = ['Fecha', 'Docente', 'CI', 'Llave', 'Aula', 'Turno', 'Hora Ingreso', 'Hora Salida', 'Retraso (min)', 'Extra (min)', 'Estado'];
    const rows = registros.map(r => [
      r.fecha,
      r.docente_nombre_completo,
      r.docente_ci,
      r.llave_codigo,
      r.aula_codigo,
      r.turno_nombre,
      r.hora_ingreso ? this.getHoraFormat(r.hora_ingreso) : '-',
      r.hora_salida ? this.getHoraFormat(r.hora_salida) : '-',
      r.minutos_retraso || 0,
      r.minutos_extra || 0,
      (r.hora_ingreso && r.hora_salida) ? 'Completado' : 'En uso'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_registros_${this.fechaInicio()}_${this.fechaFin()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getHoraFormat(hora?: string): string {
    if (!hora) return '-';
    try {
      const date = new Date(hora);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  }

  getFechaFormat(fecha: string): string {
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return fecha;
      return date.toLocaleDateString('es-BO');
    } catch {
      return fecha;
    }
  }

  private extractDate(fechaHora: string): string {
    try {
      return fechaHora.split('T')[0];
    } catch {
      return fechaHora;
    }
  }

  private getToday(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
