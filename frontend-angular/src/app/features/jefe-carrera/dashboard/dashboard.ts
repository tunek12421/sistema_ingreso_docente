import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocenteService } from '../../../core/services/docente.service';
import { RegistroService } from '../../../core/services/registro.service';
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

        // Registros de hoy
        this.totalRegistrosHoy.set(results.registrosHoy?.length || 0);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
