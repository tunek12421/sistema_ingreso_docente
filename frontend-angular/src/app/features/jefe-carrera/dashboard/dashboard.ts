import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocenteService } from '../../../core/services/docente.service';
import { RegistroService } from '../../../core/services/registro.service';
import { Registro } from '../../../shared/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-jefe-carrera-dashboard',
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class JefeCarreraDashboard implements OnInit {
  totalDocentes = signal<number>(0);
  docentesActivos = signal<number>(0);
  totalRegistrosHoy = signal<number>(0);
  loading = signal<boolean>(true);

  constructor(
    private docenteService: DocenteService,
    private registroService: RegistroService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);

    forkJoin({
      docentes: this.docenteService.getAll(),
      registrosHoy: this.registroService.getRegistrosHoy()
    }).subscribe({
      next: (results) => {
        // Total y activos de docentes
        this.totalDocentes.set(results.docentes?.length || 0);
        this.docentesActivos.set(results.docentes?.filter(d => d.activo)?.length || 0);

        // Registros de hoy - agrupar registros físicos en lógicos
        const registrosAgrupados = this.agruparRegistros(results.registrosHoy || []);
        this.totalRegistrosHoy.set(registrosAgrupados);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private agruparRegistros(registros: Registro[]): number {
    const grouped = new Map<string, boolean>();

    registros.forEach(reg => {
      const fecha = this.extractDate(reg.fecha_hora);
      const key = `${reg.docente_id}-${reg.llave_id}-${fecha}`;
      grouped.set(key, true);
    });

    return grouped.size;
  }

  private extractDate(fechaHora: string): string {
    try {
      return fechaHora.split('T')[0];
    } catch {
      return fechaHora;
    }
  }
}
