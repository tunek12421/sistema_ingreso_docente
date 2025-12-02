import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../core/services/usuario.service';
import { DocenteService } from '../../../core/services/docente.service';
import { TurnoService } from '../../../core/services/turno.service';
import { LlaveService } from '../../../core/services/llave.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  totalUsuarios = signal<number>(0);
  totalDocentes = signal<number>(0);
  totalTurnos = signal<number>(0);
  totalLlaves = signal<number>(0);
  loading = signal<boolean>(true);

  constructor(
    private usuarioService: UsuarioService,
    private docenteService: DocenteService,
    private turnoService: TurnoService,
    private llaveService: LlaveService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);

    forkJoin({
      usuarios: this.usuarioService.getAll(),
      docentes: this.docenteService.getAll(),
      turnos: this.turnoService.getAll(),
      llaves: this.llaveService.getAll()
    }).subscribe({
      next: (results) => {
        this.totalUsuarios.set(results.usuarios.data?.length || 0);
        this.totalDocentes.set(results.docentes?.length || 0);
        this.totalTurnos.set(results.turnos.data?.length || 0);
        this.totalLlaves.set(results.llaves.data?.length || 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
