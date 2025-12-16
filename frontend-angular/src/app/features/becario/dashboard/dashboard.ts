import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RegistroService } from '../../../core/services/registro.service';
import { LlaveService } from '../../../core/services/llave.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-becario-dashboard',
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class BecarioDashboard implements OnInit {
  totalRegistrosHoy = signal<number>(0);
  llavesEnUso = signal<number>(0);
  llavesDisponibles = signal<number>(0);
  loading = signal<boolean>(true);

  constructor(
    private registroService: RegistroService,
    private llaveService: LlaveService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);

    forkJoin({
      registrosHoy: this.registroService.getRegistrosHoy(),
      llavesActuales: this.registroService.getLlaveActual(),
      todasLlaves: this.llaveService.getAll()
    }).subscribe({
      next: (results) => {
        // Registros de hoy
        this.totalRegistrosHoy.set(results.registrosHoy?.length || 0);

        // Llaves en uso
        this.llavesEnUso.set(results.llavesActuales?.length || 0);

        // Llaves disponibles
        const totalLlaves = results.todasLlaves?.data?.length || 0;
        const enUso = results.llavesActuales?.length || 0;
        this.llavesDisponibles.set(totalLlaves - enUso);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
