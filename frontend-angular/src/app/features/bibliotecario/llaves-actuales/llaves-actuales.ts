import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroService } from '../../../core/services/registro.service';
import { LlaveActual } from '../../../shared/models';

@Component({
  selector: 'app-llaves-actuales',
  imports: [CommonModule],
  templateUrl: './llaves-actuales.html',
  styleUrl: './llaves-actuales.css'
})
export class LlavesActuales implements OnInit {
  llavesActuales = signal<LlaveActual[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  constructor(
    private registroService: RegistroService
  ) {}

  ngOnInit(): void {
    this.loadLlavesActuales();
  }

  loadLlavesActuales(): void {
    this.loading.set(true);
    this.error.set('');

    this.registroService.getLlaveActual().subscribe({
      next: (registros) => {
        this.llavesActuales.set(registros);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar llaves actuales:', err);
        this.error.set('Error al cargar las llaves actuales');
        this.loading.set(false);
      }
    });
  }

  getHoraFormat(hora: string): string {
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

  getTiempoTranscurrido(hora: string): string {
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
}
