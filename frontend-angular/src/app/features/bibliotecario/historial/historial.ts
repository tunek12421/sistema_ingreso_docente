import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroService } from '../../../core/services/registro.service';
import { Registro } from '../../../shared/models';

interface RegistroAgrupado {
  id: number;
  docente_id: number;
  docente_ci: string;
  docente_nombre_completo: string;
  llave_id: number;
  llave_codigo: string;
  aula_codigo: string;
  hora_ingreso?: string;
  hora_salida?: string;
}

@Component({
  selector: 'app-historial',
  imports: [CommonModule],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial implements OnInit {
  registrosRaw = signal<Registro[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // Computed signal para agrupar registros de ingreso y salida
  registros = computed(() => {
    const raw = this.registrosRaw();
    const grouped = new Map<string, RegistroAgrupado>();

    raw.forEach(reg => {
      const key = `${reg.docente_id}-${reg.llave_id}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: reg.id,
          docente_id: reg.docente_id,
          docente_ci: String(reg.docente_ci || ''),
          docente_nombre_completo: reg.docente_nombre || reg.docente_nombre_completo || '',
          llave_id: reg.llave_id,
          llave_codigo: reg.llave_codigo || '',
          aula_codigo: reg.aula_codigo || '',
          hora_ingreso: reg.tipo === 'ingreso' ? reg.fecha_hora : undefined,
          hora_salida: reg.tipo === 'salida' ? reg.fecha_hora : undefined
        });
      } else {
        const existing = grouped.get(key)!;
        if (reg.tipo === 'ingreso' && !existing.hora_ingreso) {
          existing.hora_ingreso = reg.fecha_hora;
        } else if (reg.tipo === 'salida' && !existing.hora_salida) {
          existing.hora_salida = reg.fecha_hora;
        }
      }
    });

    return Array.from(grouped.values());
  });

  constructor(private registroService: RegistroService) {}

  ngOnInit(): void {
    this.loadRegistros();
  }

  loadRegistros(): void {
    this.loading.set(true);
    this.error.set('');

    this.registroService.getRegistrosHoy().subscribe({
      next: (registros) => {
        this.registrosRaw.set(registros || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar registros:', err);
        this.error.set('Error al cargar el historial de registros');
        this.registrosRaw.set([]);
        this.loading.set(false);
      }
    });
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
}
