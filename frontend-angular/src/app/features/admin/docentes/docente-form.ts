import { Component, OnInit, Output, EventEmitter, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Docente, DocenteCreate, DocenteUpdate } from '../../../shared/models/docente.model';

@Component({
  selector: 'app-docente-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './docente-form.html',
  styleUrl: './docente-form.css',
})
export class DocenteForm implements OnInit {
  docente = input<Docente | null>(null);
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<DocenteCreate | { id: number; data: DocenteUpdate }>();

  docenteForm!: FormGroup;
  show = signal<boolean>(true);

  constructor(private fb: FormBuilder) {
    effect(() => {
      const docente = this.docente();
      if (docente) {
        this.setupEditMode(docente);
      } else {
        this.setupCreateMode();
      }
    });
  }

  get isEditMode(): boolean {
    return this.docente() !== null;
  }

  get title(): string {
    return this.isEditMode ? 'Editar Docente' : 'Nuevo Docente';
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.docenteForm = this.fb.group({
      documento_identidad: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[0-9]+$/)]],
      activo: [true, [Validators.required]]
    });
  }

  setupCreateMode(): void {
    this.docenteForm.reset({
      documento_identidad: '',
      nombre_completo: '',
      correo: '',
      telefono: '',
      activo: true
    });
  }

  setupEditMode(docente: Docente): void {
    this.docenteForm.patchValue({
      documento_identidad: docente.documento_identidad,
      nombre_completo: docente.nombre_completo,
      correo: docente.correo,
      telefono: docente.telefono || '',
      activo: docente.activo
    });
  }

  onSubmit(): void {
    if (this.docenteForm.invalid) {
      this.markFormGroupTouched(this.docenteForm);
      return;
    }

    const formValue = this.docenteForm.value;

    // Limpiar teléfono vacío
    const telefono = formValue.telefono ? parseInt(formValue.telefono) : undefined;

    if (this.isEditMode) {
      const updateData: DocenteUpdate = {
        documento_identidad: parseInt(formValue.documento_identidad),
        nombre_completo: formValue.nombre_completo,
        correo: formValue.correo,
        telefono: telefono,
        activo: formValue.activo
      };
      this.onSave.emit({ id: this.docente()!.id, data: updateData });
    } else {
      const createData: DocenteCreate = {
        documento_identidad: parseInt(formValue.documento_identidad),
        nombre_completo: formValue.nombre_completo,
        correo: formValue.correo,
        telefono: telefono,
        activo: formValue.activo
      };
      this.onSave.emit(createData);
    }
  }

  cancel(): void {
    this.onCancel.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.cancel();
    }
  }

  hasError(field: string): boolean {
    const control = this.docenteForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.docenteForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (control?.hasError('email')) {
      return 'Debe ser un correo electrónico válido';
    }
    if (control?.hasError('pattern')) {
      if (field === 'documento_identidad' || field === 'telefono') {
        return 'Solo se permiten números';
      }
      return 'Formato inválido';
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
