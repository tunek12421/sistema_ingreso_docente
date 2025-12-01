import { Component, input, output, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Turno, TurnoCreate, TurnoUpdate } from '../../../shared/models/turno.model';

@Component({
  selector: 'app-turno-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './turno-form.html',
  styleUrl: './turno-form.css',
})
export class TurnoForm implements OnInit {
  show = input.required<boolean>();
  turno = input<Turno | null>(null);
  onClose = output<void>();
  onSave = output<TurnoCreate | { id: number; data: TurnoUpdate }>();

  turnoForm!: FormGroup;

  get isEditMode(): boolean {
    return this.turno() !== null;
  }

  get title(): string {
    return this.isEditMode ? 'Editar Turno' : 'Nuevo Turno';
  }

  constructor(private fb: FormBuilder) {
    effect(() => {
      const isVisible = this.show();
      const t = this.turno();

      if (!this.turnoForm) return;

      if (isVisible) {
        if (t) {
          this.setupEditMode(t);
        } else {
          this.setupCreateMode();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.turnoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      hora_inicio: ['', [Validators.required]],
      hora_fin: ['', [Validators.required]]
    }, {
      validators: this.timeRangeValidator
    });
  }

  private timeRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const horaInicio = group.get('hora_inicio')?.value;
    const horaFin = group.get('hora_fin')?.value;

    if (!horaInicio || !horaFin) {
      return null;
    }

    // Comparar las horas
    if (horaInicio >= horaFin) {
      return { timeRangeInvalid: true };
    }

    return null;
  }

  setupCreateMode(): void {
    this.turnoForm.reset({
      nombre: '',
      hora_inicio: '',
      hora_fin: ''
    });
  }

  setupEditMode(turno: Turno): void {
    // Convertir timestamps a formato HH:MM para inputs tipo time
    const horaInicio = this.extractTime(turno.hora_inicio);
    const horaFin = this.extractTime(turno.hora_fin);

    this.turnoForm.patchValue({
      nombre: turno.nombre,
      hora_inicio: horaInicio,
      hora_fin: horaFin
    });
  }

  private extractTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onSubmit(): void {
    if (this.turnoForm.invalid) {
      this.markFormGroupTouched(this.turnoForm);
      return;
    }

    const formValue = this.turnoForm.value;

    // Convertir HH:MM a formato HH:MM:SS para backend
    const horaInicio = this.formatTimeForBackend(formValue.hora_inicio);
    const horaFin = this.formatTimeForBackend(formValue.hora_fin);

    if (this.isEditMode) {
      const updateData: TurnoUpdate = {
        nombre: formValue.nombre,
        hora_inicio: horaInicio,
        hora_fin: horaFin
      };
      this.onSave.emit({ id: this.turno()!.id, data: updateData });
    } else {
      const createData: TurnoCreate = {
        nombre: formValue.nombre,
        hora_inicio: horaInicio,
        hora_fin: horaFin
      };
      this.onSave.emit(createData);
    }
  }

  private formatTimeForBackend(time: string): string {
    if (!time) return '';
    // PostgreSQL TIME acepta formato HH:MM:SS
    return `${time}:00`;
  }

  cancel(): void {
    this.onClose.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  hasError(field: string): boolean {
    const control = this.turnoForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.turnoForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      return 'Debe tener al menos 3 caracteres';
    }
    return '';
  }

  hasTimeRangeError(): boolean {
    return !!(this.turnoForm.hasError('timeRangeInvalid') &&
             (this.turnoForm.get('hora_inicio')?.touched || this.turnoForm.get('hora_fin')?.touched));
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
