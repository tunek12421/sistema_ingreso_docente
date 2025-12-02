import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroService } from '../../../core/services/registro.service';
import { Registro } from '../../../shared/models';

@Component({
  selector: 'app-historial',
  imports: [CommonModule],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial implements OnInit {
  registros = signal<Registro[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  constructor(private registroService: RegistroService) {}

  ngOnInit(): void {
    this.loadRegistros();
  }

  loadRegistros(): void {
    this.loading.set(true);
    this.error.set('');

    this.registroService.getRegistrosHoy().subscribe({
      next: (registros) => {
        // Si registros es null o undefined, tratarlo como array vacío
        this.registros.set(registros || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar registros:', err);
        this.error.set('Error al cargar el historial de registros');
        this.registros.set([]);
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

  getFechaFormat(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-BO');
    } catch {
      return fecha;
    }
  }
}
