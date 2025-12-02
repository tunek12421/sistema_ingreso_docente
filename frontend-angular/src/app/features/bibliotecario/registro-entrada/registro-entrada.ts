import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DocenteService } from '../../../core/services/docente.service';
import { LlaveService } from '../../../core/services/llave.service';
import { RegistroService } from '../../../core/services/registro.service';
import { TurnoService } from '../../../core/services/turno.service';
import { Turno } from '../../../shared/models';

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
export class RegistroEntrada implements OnInit {
  registroForm: FormGroup;
  docentes = signal<DocenteInfo[]>([]);
  llaves = signal<LlaveInfo[]>([]);
  llavesDisponibles = signal<LlaveInfo[]>([]);
  turnos = signal<Turno[]>([]);
  loading = signal<boolean>(false);
  loadingData = signal<boolean>(true);
  error = signal<string>('');
  success = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private docenteService: DocenteService,
    private llaveService: LlaveService,
    private registroService: RegistroService,
    private turnoService: TurnoService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      docente_id: ['', Validators.required],
      llave_id: ['', Validators.required],
      turno_id: ['', Validators.required]
    });

    // Console log de cambios en el formulario
    this.registroForm.valueChanges.subscribe(value => {
      console.log('📋 Formulario cambió:', value);
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadingData.set(true);
    this.error.set('');

    console.log('🔄 Iniciando carga de datos...');

    // Cargar docentes
    this.docenteService.getAll().subscribe({
      next: (response) => {
        console.log('👥 Docentes cargados:', response);
        if (response) {
          const docentesMapeados = response.map((d) => ({
            id: d.id,
            nombre: d.nombre_completo,
            ci: d.documento_identidad
          }));
          console.log('👥 Docentes mapeados:', docentesMapeados);
          this.docentes.set(docentesMapeados);
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar docentes:', err);
        this.error.set('Error al cargar la lista de docentes');
      }
    });

    // Cargar turnos
    this.turnoService.getAll().subscribe({
      next: (response) => {
        console.log('⏰ Turnos cargados:', response);
        if (response.data) {
          console.log('⏰ Turnos mapeados:', response.data);
          this.turnos.set(response.data);
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar turnos:', err);
        this.error.set('Error al cargar la lista de turnos');
      }
    });

    // Cargar llaves
    this.llaveService.getAll().subscribe({
      next: (response) => {
        console.log('🔑 Llaves cargadas:', response);
        if (response.data) {
          const todasLlaves = response.data.map((l) => ({
            id: l.id,
            codigo: l.codigo,
            descripcion: l.descripcion || `${l.aula_codigo} - ${l.aula_nombre}`
          }));
          console.log('🔑 Llaves mapeadas:', todasLlaves);
          this.llaves.set(todasLlaves);

          // Obtener llaves en uso
          this.registroService.getLlaveActual().subscribe({
            next: (registros) => {
              console.log('📊 Registros activos:', registros);
              // Si registros es null o undefined, tratarlo como array vacío
              const registrosArray = registros || [];
              const llavesEnUsoIds = registrosArray.map(r => r.llave_id);
              console.log('🔒 Llaves en uso (IDs):', llavesEnUsoIds);
              const disponibles = todasLlaves.filter(
                (l) => !llavesEnUsoIds.includes(l.id)
              );
              console.log('✅ Llaves disponibles:', disponibles);
              this.llavesDisponibles.set(disponibles);
              this.loadingData.set(false);
            },
            error: () => {
              console.log('⚠️ Error al cargar registros activos, mostrando todas las llaves');
              // Si falla, mostrar todas las llaves
              this.llavesDisponibles.set(todasLlaves);
              this.loadingData.set(false);
            }
          });
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar llaves:', err);
        this.error.set('Error al cargar la lista de llaves');
        this.loadingData.set(false);
      }
    });
  }

  onSubmit(): void {
    console.log('🚀 onSubmit() iniciado');
    console.log('📝 Estado del formulario:', {
      valid: this.registroForm.valid,
      invalid: this.registroForm.invalid,
      value: this.registroForm.value,
      status: this.registroForm.status
    });

    if (this.registroForm.invalid) {
      console.log('❌ Formulario inválido, marcando campos como touched');
      this.registroForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const formValue = this.registroForm.value;
    console.log('📊 Valores del formulario:', formValue);

    // Buscar el docente seleccionado para obtener su CI
    console.log('🔍 Buscando docente con ID:', formValue.docente_id);
    console.log('📋 Lista completa de docentes:', this.docentes());

    const docenteSeleccionado = this.docentes().find(d => d.id === Number(formValue.docente_id));
    console.log('✅ Docente seleccionado encontrado:', docenteSeleccionado);

    if (!docenteSeleccionado) {
      console.error('❌ Docente no encontrado en la lista');
      this.error.set('Error: Docente no encontrado');
      this.loading.set(false);
      return;
    }

    // Crear el request con el formato esperado por el backend
    const request = {
      ci: docenteSeleccionado.ci,
      llave_id: Number(formValue.llave_id),
      turno_id: Number(formValue.turno_id)
    };
    console.log('📤 Request que se enviará al backend:', request);
    console.log('📤 Tipos de datos en el request:', {
      ci: typeof request.ci,
      llave_id: typeof request.llave_id,
      turno_id: typeof request.turno_id
    });

    this.registroService.registrarEntrada(request).subscribe({
      next: (response) => {
        console.log('✅ Respuesta exitosa del backend:', response);
        this.success.set('Entrada registrada exitosamente');
        this.registroForm.reset();
        this.loading.set(false);

        // Recargar llaves disponibles
        this.loadData();

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          console.log('🔄 Redirigiendo al dashboard...');
          this.router.navigate(['/bibliotecario']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Error completo al registrar entrada:', err);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error message:', err.error?.message);
        console.error('❌ Error body completo:', err.error);
        this.error.set(
          err.error?.message || 'Error al registrar la entrada. Por favor, intente nuevamente.'
        );
        this.loading.set(false);
      }
    });
  }

  getDocenteNombre(id: number | string): string {
    console.log('🔎 getDocenteNombre llamado con ID:', id, 'tipo:', typeof id);
    const numericId = Number(id);
    const docente = this.docentes().find(d => d.id === numericId);
    console.log('🔎 Docente encontrado:', docente);
    return docente ? docente.nombre : '';
  }

  getTurnoNombre(id: number | string): string {
    console.log('🔎 getTurnoNombre llamado con ID:', id, 'tipo:', typeof id);
    const numericId = Number(id);
    const turno = this.turnos().find(t => t.id === numericId);
    console.log('🔎 Turno encontrado:', turno);
    return turno ? `${turno.nombre} (${turno.hora_inicio} - ${turno.hora_fin})` : '';
  }

  getLlaveInfo(id: number | string): string {
    console.log('🔎 getLlaveInfo llamado con ID:', id, 'tipo:', typeof id);
    const numericId = Number(id);
    const llave = this.llaves().find(l => l.id === numericId);
    console.log('🔎 Llave encontrada:', llave);
    return llave ? `${llave.codigo} - ${llave.descripcion}` : '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
