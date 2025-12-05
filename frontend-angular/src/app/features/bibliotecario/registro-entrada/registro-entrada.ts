import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DocenteService } from '../../../core/services/docente.service';
import { LlaveService } from '../../../core/services/llave.service';
import { RegistroService } from '../../../core/services/registro.service';
import { TurnoService } from '../../../core/services/turno.service';
import { Turno } from '../../../shared/models';
import { debounceTime, distinctUntilChanged, Subject, takeUntil, switchMap } from 'rxjs';

interface DocenteInfo {
  id: number;
  nombre: string;
  ci: number;
}

interface LlaveInfo {
  id: number;
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'app-registro-entrada',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-entrada.html',
  styleUrl: './registro-entrada.css'
})
export class RegistroEntrada implements OnInit, OnDestroy {
  registroForm: FormGroup;
  llaves = signal<LlaveInfo[]>([]);
  llavesDisponibles = signal<LlaveInfo[]>([]);
  turnos = signal<Turno[]>([]);
  docenteEncontrado = signal<DocenteInfo | null>(null);
  sugerenciasDocentes = signal<DocenteInfo[]>([]);
  mostrarSugerencias = signal<boolean>(false);
  llaveEncontrada = signal<LlaveInfo | null>(null);
  sugerenciasLlaves = signal<LlaveInfo[]>([]);
  mostrarSugerenciasLlaves = signal<boolean>(false);
  buscandoDocente = signal<boolean>(false);
  buscandoLlave = signal<boolean>(false);
  loading = signal<boolean>(false);
  loadingData = signal<boolean>(true);
  error = signal<string>('');
  success = signal<string>('');

  private destroy$ = new Subject<void>();
  private ciSearchSubject$ = new Subject<string>();
  private llaveSearchSubject$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private docenteService: DocenteService,
    private llaveService: LlaveService,
    private registroService: RegistroService,
    private turnoService: TurnoService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      docente_ci: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      llave_search: ['', Validators.required],
      turno_id: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupCISearch();
    this.setupLlaveSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupCISearch(): void {
    this.ciSearchSubject$
      .pipe(
        debounceTime(400), // Esperar 400ms después de que el usuario deje de escribir
        distinctUntilChanged(), // Solo buscar si el valor cambió
        takeUntil(this.destroy$)
      )
      .subscribe(ci => {
        this.performSearch(ci);
      });
  }

  loadData(): void {
    this.loadingData.set(true);
    this.error.set('');

    // Cargar turnos
    this.turnoService.getAll().subscribe({
      next: (response) => {
        if (response.data) {
          this.turnos.set(response.data);

          // Obtener y pre-seleccionar el turno actual
          this.turnoService.getTurnoActual().subscribe({
            next: (turnoResponse) => {
              if (turnoResponse.data) {
                this.registroForm.patchValue({
                  turno_id: turnoResponse.data.id
                });
              }
            }
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar turnos:', err);
        this.error.set('Error al cargar la lista de turnos');
      }
    });

    // Cargar llaves
    this.llaveService.getAll().subscribe({
      next: (response) => {
        if (response.data) {
          const todasLlaves = response.data.map((l) => ({
            id: l.id,
            codigo: l.codigo,
            descripcion: l.descripcion || `${l.aula_codigo} - ${l.aula_nombre}`
          }));
          this.llaves.set(todasLlaves);

          // Obtener llaves en uso
          this.registroService.getLlaveActual().subscribe({
            next: (registros) => {
              const registrosArray = registros || [];
              const llavesEnUsoIds = registrosArray.map(r => r.llave_id);
              const disponibles = todasLlaves.filter(
                (l) => !llavesEnUsoIds.includes(l.id)
              );
              this.llavesDisponibles.set(disponibles);
              this.loadingData.set(false);
            },
            error: () => {
              // Si falla, mostrar todas las llaves
              this.llavesDisponibles.set(todasLlaves);
              this.loadingData.set(false);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar llaves:', err);
        this.error.set('Error al cargar la lista de llaves');
        this.loadingData.set(false);
      }
    });
  }

  buscarDocente(): void {
    const ci = this.registroForm.get('docente_ci')?.value?.trim();
    this.ciSearchSubject$.next(ci || '');
  }

  private performSearch(ci: string): void {
    // Limpiar estado si el campo está vacío o muy corto
    if (!ci || ci.length < 1) {
      this.docenteEncontrado.set(null);
      this.sugerenciasDocentes.set([]);
      this.mostrarSugerencias.set(false);
      this.error.set('');
      this.buscandoDocente.set(false);
      return;
    }

    this.buscandoDocente.set(true);
    this.error.set('');

    // Usar searchByCI para obtener sugerencias
    this.docenteService.searchByCI(ci).subscribe({
      next: (docentes) => {
        if (docentes && docentes.length > 0) {
          const sugerencias = docentes.map(d => ({
            id: d.id,
            nombre: d.nombre_completo,
            ci: d.documento_identidad
          }));
          this.sugerenciasDocentes.set(sugerencias);
          this.mostrarSugerencias.set(true);

          // Si solo hay un resultado y el CI coincide exactamente, seleccionarlo automáticamente
          if (sugerencias.length === 1 && String(sugerencias[0].ci) === ci) {
            this.seleccionarDocente(sugerencias[0]);
          }
        } else {
          this.sugerenciasDocentes.set([]);
          this.mostrarSugerencias.set(false);
          this.docenteEncontrado.set(null);
        }
        this.buscandoDocente.set(false);
      },
      error: (err) => {
        console.error('Error al buscar docentes:', err);
        this.sugerenciasDocentes.set([]);
        this.mostrarSugerencias.set(false);
        this.docenteEncontrado.set(null);

        if (err.status === 401 || err.status === 403) {
          this.error.set('Sesión expirada. Por favor, inicie sesión nuevamente.');
        } else {
          this.error.set('Error al buscar docentes.');
        }

        this.buscandoDocente.set(false);
      }
    });
  }

  seleccionarDocente(docente: DocenteInfo): void {
    this.docenteEncontrado.set(docente);
    this.registroForm.patchValue({ docente_ci: String(docente.ci) });
    this.mostrarSugerencias.set(false);
    this.sugerenciasDocentes.set([]);
  }

  cerrarSugerencias(): void {
    // Pequeño delay para permitir click en sugerencias
    setTimeout(() => {
      this.mostrarSugerencias.set(false);
    }, 200);
  }

  private setupLlaveSearch(): void {
    this.llaveSearchSubject$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.performLlaveSearch(query);
      });
  }

  buscarLlave(): void {
    const query = this.registroForm.get('llave_search')?.value?.trim();
    this.llaveSearchSubject$.next(query || '');
  }

  private performLlaveSearch(query: string): void {
    if (!query || query.length < 1) {
      this.llaveEncontrada.set(null);
      this.sugerenciasLlaves.set([]);
      this.mostrarSugerenciasLlaves.set(false);
      this.buscandoLlave.set(false);
      return;
    }

    this.buscandoLlave.set(true);

    this.llaveService.search(query).subscribe({
      next: (llaves) => {
        if (llaves && llaves.length > 0) {
          const sugerencias = llaves.map(l => ({
            id: l.id,
            codigo: l.codigo,
            descripcion: l.descripcion || `${l.aula_codigo} - ${l.aula_nombre}`
          }));
          this.sugerenciasLlaves.set(sugerencias);
          this.mostrarSugerenciasLlaves.set(true);

          if (sugerencias.length === 1 && sugerencias[0].codigo.toLowerCase() === query.toLowerCase()) {
            this.seleccionarLlave(sugerencias[0]);
          }
        } else {
          this.sugerenciasLlaves.set([]);
          this.mostrarSugerenciasLlaves.set(false);
          this.llaveEncontrada.set(null);
        }
        this.buscandoLlave.set(false);
      },
      error: (err) => {
        console.error('Error al buscar llaves:', err);
        this.sugerenciasLlaves.set([]);
        this.mostrarSugerenciasLlaves.set(false);
        this.llaveEncontrada.set(null);
        this.buscandoLlave.set(false);
      }
    });
  }

  seleccionarLlave(llave: LlaveInfo): void {
    this.llaveEncontrada.set(llave);
    this.registroForm.patchValue({ llave_search: llave.codigo });
    this.mostrarSugerenciasLlaves.set(false);
    this.sugerenciasLlaves.set([]);
  }

  cerrarSugerenciasLlaves(): void {
    setTimeout(() => {
      this.mostrarSugerenciasLlaves.set(false);
    }, 200);
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    if (!this.docenteEncontrado()) {
      this.error.set('Por favor busque y verifique el docente por CI');
      return;
    }

    if (!this.llaveEncontrada()) {
      this.error.set('Por favor busque y seleccione una llave');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const formValue = this.registroForm.value;

    const request = {
      ci: Number(formValue.docente_ci),
      llave_id: this.llaveEncontrada()!.id,
      turno_id: Number(formValue.turno_id)
    };

    this.registroService.registrarEntrada(request).subscribe({
      next: (response) => {
        this.success.set('Entrada registrada exitosamente');
        this.registroForm.reset();
        this.docenteEncontrado.set(null);
        this.llaveEncontrada.set(null);
        this.loading.set(false);

        // Recargar llaves disponibles
        this.loadData();

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/bibliotecario']);
        }, 2000);
      },
      error: (err) => {
        console.error('Error al registrar entrada:', err);
        this.error.set(
          err.error?.message || 'Error al registrar la entrada. Por favor, intente nuevamente.'
        );
        this.loading.set(false);
      }
    });
  }

  getTurnoNombre(id: number | string): string {
    const numericId = Number(id);
    const turno = this.turnos().find(t => t.id === numericId);
    return turno ? `${turno.nombre} (${turno.hora_inicio} - ${turno.hora_fin})` : '';
  }

  getLlaveInfo(id: number | string): string {
    const numericId = Number(id);
    const llave = this.llaves().find(l => l.id === numericId);
    return llave ? `${llave.codigo} - ${llave.descripcion}` : '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
