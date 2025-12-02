import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DocenteService } from '../../../core/services/docente.service';
import { LlaveService } from '../../../core/services/llave.service';
import { RegistroService } from '../../../core/services/registro.service';

interface DocenteInfo {
  id: number;
  nombre: string;
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
export class RegistroEntrada implements OnInit {
  registroForm: FormGroup;
  docentes = signal<DocenteInfo[]>([]);
  llaves = signal<LlaveInfo[]>([]);
  llavesDisponibles = signal<LlaveInfo[]>([]);
  loading = signal<boolean>(false);
  loadingData = signal<boolean>(true);
  error = signal<string>('');
  success = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private docenteService: DocenteService,
    private llaveService: LlaveService,
    private registroService: RegistroService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      docente_id: ['', Validators.required],
      llave_id: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadingData.set(true);
    this.error.set('');

    // Cargar docentes
    this.docenteService.getAll().subscribe({
      next: (response) => {
        if (response) {
          this.docentes.set(response.map((d) => ({
            id: d.id,
            nombre: d.nombre_completo
          })));
        }
      },
      error: (err) => {
        console.error('Error al cargar docentes:', err);
        this.error.set('Error al cargar la lista de docentes');
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
              // Si registros es null o undefined, tratarlo como array vacío
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

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const formData = this.registroForm.value;

    this.registroService.registrarEntrada(formData).subscribe({
      next: (response) => {
        this.success.set('Entrada registrada exitosamente');
        this.registroForm.reset();
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

  getDocenteNombre(id: number): string {
    const docente = this.docentes().find(d => d.id === id);
    return docente ? docente.nombre : '';
  }

  getLlaveInfo(id: number): string {
    const llave = this.llaves().find(l => l.id === id);
    return llave ? `${llave.codigo} - ${llave.descripcion}` : '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
