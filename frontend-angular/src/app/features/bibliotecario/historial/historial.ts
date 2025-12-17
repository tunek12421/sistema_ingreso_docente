import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService } from '../../../core/services/registro.service';
import { LlaveService } from '../../../core/services/llave.service';
import { TurnoService } from '../../../core/services/turno.service';
import { DocenteService } from '../../../core/services/docente.service';
import { AuthService } from '../../../core/services/auth.service';
import { Registro, RegistroUpdate, Llave, Turno, Docente } from '../../../shared/models';
import { TimezoneDisplayPipe } from '../../../shared/pipes/timezone-display-pipe';

@Component({
  selector: 'app-historial',
  imports: [CommonModule, FormsModule, TimezoneDisplayPipe],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial implements OnInit {
  private registroService = inject(RegistroService);
  private llaveService = inject(LlaveService);
  private turnoService = inject(TurnoService);
  private docenteService = inject(DocenteService);
  private authService = inject(AuthService);

  registros = signal<Registro[]>([]);
  llaves = signal<Llave[]>([]);
  turnos = signal<Turno[]>([]);
  docentes = signal<Docente[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  successMessage = signal<string>('');

  // Modal de edición
  showEditModal = signal<boolean>(false);
  editingRegistro = signal<Registro | null>(null);
  editForm = signal<{
    docente_id: number | null;
    fecha: string;
    hora: string;
    llave_id: number | null;
    turno_id: number | null;
    tipo: 'ingreso' | 'salida';
    observaciones: string;
  }>({
    docente_id: null,
    fecha: '',
    hora: '',
    llave_id: null,
    turno_id: null,
    tipo: 'ingreso',
    observaciones: ''
  });
  saving = signal<boolean>(false);

  // Guardar valores originales para detectar cambios
  private originalDocenteId: number | null = null;
  private originalFecha = '';
  private originalHora = '';
  private originalLlaveId: number | null = null;
  private originalTurnoId: number | null = null;
  private originalTipo: 'ingreso' | 'salida' = 'ingreso';
  private originalObservaciones = '';

  ngOnInit(): void {
    this.loadRegistros();
    this.loadLlaves();
    this.loadTurnos();
    this.loadDocentes();
  }

  loadRegistros(): void {
    this.loading.set(true);
    this.error.set('');

    this.registroService.getRegistrosHoy().subscribe({
      next: (registros) => {
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

  loadLlaves(): void {
    this.llaveService.getAll().subscribe({
      next: (response) => {
        this.llaves.set(response.data || []);
      },
      error: (err) => {
        console.error('Error al cargar llaves:', err);
      }
    });
  }

  loadTurnos(): void {
    this.turnoService.getAll().subscribe({
      next: (response) => {
        this.turnos.set(response.data || []);
      },
      error: (err) => {
        console.error('Error al cargar turnos:', err);
      }
    });
  }

  loadDocentes(): void {
    this.docenteService.getAll().subscribe({
      next: (docentes) => {
        this.docentes.set(docentes || []);
      },
      error: (err) => {
        console.error('Error al cargar docentes:', err);
      }
    });
  }

  openEditModal(registro: Registro): void {
    this.editingRegistro.set(registro);

    // Convertir fecha_hora a fecha y hora locales
    const fechaObj = new Date(registro.fecha_hora);
    const fechaLocal = new Date(fechaObj.getTime() - fechaObj.getTimezoneOffset() * 60000);

    // Formato YYYY-MM-DD para input date
    const fecha = fechaLocal.toISOString().slice(0, 10);
    // Formato HH:MM:SS para input time
    const hora = fechaLocal.toISOString().slice(11, 19);

    // Guardar valores originales
    this.originalDocenteId = registro.docente_id || null;
    this.originalFecha = fecha;
    this.originalHora = hora;
    this.originalLlaveId = registro.llave_id || null;
    this.originalTurnoId = registro.turno_id || null;
    this.originalTipo = registro.tipo;
    this.originalObservaciones = registro.observaciones || '';

    this.editForm.set({
      docente_id: registro.docente_id || null,
      fecha,
      hora,
      llave_id: registro.llave_id || null,
      turno_id: registro.turno_id || null,
      tipo: registro.tipo,
      observaciones: registro.observaciones || ''
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingRegistro.set(null);
    this.editForm.set({
      docente_id: null,
      fecha: '',
      hora: '',
      llave_id: null,
      turno_id: null,
      tipo: 'ingreso',
      observaciones: ''
    });
  }

  saveEdit(): void {
    const registro = this.editingRegistro();
    if (!registro) return;

    this.saving.set(true);
    this.error.set('');
    const form = this.editForm();

    // Solo incluir campos que realmente cambiaron
    const updateData: RegistroUpdate = {
      editado_por: this.authService.currentUser()?.id
    };

    // Verificar si docente_id cambió
    if (form.docente_id !== this.originalDocenteId) {
      updateData.docente_id = form.docente_id || undefined;
    }

    // Verificar si fecha u hora cambiaron
    const fechaCambio = form.fecha !== this.originalFecha || form.hora !== this.originalHora;

    if (fechaCambio) {
      // Combinar fecha y hora en ISO string
      const fechaHoraStr = `${form.fecha}T${form.hora}`;
      updateData.fecha_hora = new Date(fechaHoraStr).toISOString();
    }

    // Verificar si llave_id cambió
    if (form.llave_id !== this.originalLlaveId) {
      updateData.llave_id = form.llave_id || undefined;
    }

    // Verificar si turno_id cambió
    if (form.turno_id !== this.originalTurnoId) {
      updateData.turno_id = form.turno_id || undefined;
    }

    // Verificar si tipo cambió
    if (form.tipo !== this.originalTipo) {
      updateData.tipo = form.tipo;
    }

    // Solo enviar observaciones si cambió
    if (form.observaciones !== this.originalObservaciones) {
      updateData.observaciones = form.observaciones || undefined;
    }

    this.registroService.update(registro.id, updateData).subscribe({
      next: () => {
        this.successMessage.set('Registro actualizado correctamente');
        this.closeEditModal();
        this.loadRegistros();
        this.saving.set(false);

        // Limpiar mensaje después de 3 segundos
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('Error al actualizar registro:', err);
        this.error.set('Error al actualizar el registro');
        this.saving.set(false);
      }
    });
  }

  updateDocenteId(value: string): void {
    const docenteId = value ? parseInt(value, 10) : null;
    this.editForm.set({ ...this.editForm(), docente_id: docenteId });
  }

  updateFecha(value: string): void {
    this.editForm.set({ ...this.editForm(), fecha: value });
  }

  updateHora(value: string): void {
    this.editForm.set({ ...this.editForm(), hora: value });
  }

  updateLlaveId(value: string): void {
    const llaveId = value ? parseInt(value, 10) : null;
    this.editForm.set({ ...this.editForm(), llave_id: llaveId });
  }

  updateTurnoId(value: string): void {
    const turnoId = value ? parseInt(value, 10) : null;
    this.editForm.set({ ...this.editForm(), turno_id: turnoId });
  }

  updateTipo(value: 'ingreso' | 'salida'): void {
    this.editForm.set({ ...this.editForm(), tipo: value });
  }

  updateObservaciones(value: string): void {
    this.editForm.set({ ...this.editForm(), observaciones: value });
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'ingreso' ? 'Entrada' : 'Salida';
  }

  getTipoClass(tipo: string): string {
    return tipo === 'ingreso'
      ? 'bg-green-100 text-green-800'
      : 'bg-blue-100 text-blue-800';
  }
}
