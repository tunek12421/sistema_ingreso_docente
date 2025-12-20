import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService } from '../../../core/services/registro.service';
import { LlaveService } from '../../../core/services/llave.service';
import { LlaveActual, Llave, EstadoLlave, ESTADOS_LLAVE } from '../../../shared/models';

interface LlaveConEstado extends Llave {
  docente_ci?: string;
  docente_nombre_completo?: string;
  hora_ingreso?: string;
}

@Component({
  selector: 'app-llaves-actuales',
  imports: [CommonModule, FormsModule],
  templateUrl: './llaves-actuales.html',
  styleUrl: './llaves-actuales.css'
})
export class LlavesActuales implements OnInit {
  private registroService = inject(RegistroService);
  private llaveService = inject(LlaveService);

  llaves = signal<LlaveConEstado[]>([]);
  llavesEnUso = signal<LlaveActual[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // Filtros
  filtroEstado = signal<EstadoLlave | 'todos'>('todos');
  filtroBusqueda = signal<string>('');

  estadosLlave = ESTADOS_LLAVE;

  // Llaves filtradas
  llavesFiltradas = computed(() => {
    let resultado = this.llaves();

    // Filtrar por estado
    if (this.filtroEstado() !== 'todos') {
      resultado = resultado.filter(l => l.estado === this.filtroEstado());
    }

    // Filtrar por búsqueda
    const busqueda = this.filtroBusqueda().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(l =>
        l.codigo.toLowerCase().includes(busqueda) ||
        l.aula_codigo.toLowerCase().includes(busqueda) ||
        l.aula_nombre.toLowerCase().includes(busqueda) ||
        (l.docente_nombre_completo && l.docente_nombre_completo.toLowerCase().includes(busqueda)) ||
        (l.docente_ci && l.docente_ci.includes(busqueda))
      );
    }

    return resultado;
  });

  // Contadores por estado
  contadorDisponibles = computed(() => this.llaves().filter(l => l.estado === 'disponible').length);
  contadorEnUso = computed(() => this.llaves().filter(l => l.estado === 'en_uso').length);
  contadorExtraviadas = computed(() => this.llaves().filter(l => l.estado === 'extraviada').length);
  contadorInactivas = computed(() => this.llaves().filter(l => l.estado === 'inactiva').length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');

    // Cargar llaves en uso primero
    this.registroService.getLlaveActual().subscribe({
      next: (registros) => {
        this.llavesEnUso.set(registros || []);
        // Luego cargar todas las llaves
        this.llaveService.getAll().subscribe({
          next: (response) => {
            this.combinarDatos(response.data || []);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error al cargar llaves:', err);
            this.error.set('Error al cargar las llaves');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar llaves en uso:', err);
        this.error.set('Error al cargar las llaves');
        this.loading.set(false);
      }
    });
  }

  private combinarDatos(todasLasLlaves: Llave[]): void {
    const enUso = this.llavesEnUso();

    // Crear mapa de llaves en uso para acceso rápido
    const mapaEnUso = new Map<number, LlaveActual>();
    enUso.forEach(l => mapaEnUso.set(l.llave_id, l));

    // Combinar datos
    const llavesConEstado: LlaveConEstado[] = todasLasLlaves.map(llave => {
      const enUsoInfo = mapaEnUso.get(llave.id);
      return {
        ...llave,
        docente_ci: enUsoInfo?.docente_ci,
        docente_nombre_completo: enUsoInfo?.docente_nombre_completo,
        hora_ingreso: enUsoInfo?.hora_ingreso
      };
    });

    // Ordenar: primero en_uso, luego disponibles, luego extraviadas, luego inactivas
    llavesConEstado.sort((a, b) => {
      const orden: Record<EstadoLlave, number> = {
        'en_uso': 0,
        'disponible': 1,
        'extraviada': 2,
        'inactiva': 3
      };
      return orden[a.estado] - orden[b.estado];
    });

    this.llaves.set(llavesConEstado);
  }

  getHoraFormat(hora: string | undefined): string {
    if (!hora) return '-';
    try {
      const date = new Date(hora);
      return date.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return hora;
    }
  }

  getTiempoTranscurrido(hora: string | undefined): string {
    if (!hora) return '-';
    try {
      const entrada = new Date(hora);
      const ahora = new Date();
      const diff = ahora.getTime() - entrada.getTime();
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (horas > 0) {
        return `${horas}h ${minutos}m`;
      }
      return `${minutos}m`;
    } catch {
      return 'N/A';
    }
  }

  getEstadoClass(estado: EstadoLlave): string {
    const clases: Record<EstadoLlave, string> = {
      'disponible': 'bg-green-100 text-green-800',
      'en_uso': 'bg-orange-100 text-orange-800',
      'extraviada': 'bg-red-100 text-red-800',
      'inactiva': 'bg-gray-100 text-gray-500'
    };
    return clases[estado] || 'bg-gray-100 text-gray-500';
  }

  getEstadoLabel(estado: EstadoLlave | 'todos'): string {
    const labels: Record<EstadoLlave | 'todos', string> = {
      'todos': 'Todos',
      'disponible': 'Disponible',
      'en_uso': 'En Uso',
      'extraviada': 'Extraviada',
      'inactiva': 'Inactiva'
    };
    return labels[estado] || estado;
  }

  getIconBgClass(estado: EstadoLlave): string {
    const clases: Record<EstadoLlave, string> = {
      'disponible': 'bg-green-100',
      'en_uso': 'bg-orange-100',
      'extraviada': 'bg-red-100',
      'inactiva': 'bg-gray-100'
    };
    return clases[estado] || 'bg-gray-100';
  }

  getIconTextClass(estado: EstadoLlave): string {
    const clases: Record<EstadoLlave, string> = {
      'disponible': 'text-green-600',
      'en_uso': 'text-orange-600',
      'extraviada': 'text-red-600',
      'inactiva': 'text-gray-400'
    };
    return clases[estado] || 'text-gray-400';
  }

  setFiltroEstado(estado: EstadoLlave | 'todos'): void {
    this.filtroEstado.set(estado);
  }

  updateBusqueda(value: string): void {
    this.filtroBusqueda.set(value);
  }
}
