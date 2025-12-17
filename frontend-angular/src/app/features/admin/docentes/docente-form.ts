import { Component, OnInit, Output, EventEmitter, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Docente, DocenteCreate, DocenteUpdate } from '../../../shared/models/docente.model';

// Validador personalizado para campos de texto (trim y validar espacios)
function trimmedValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const value = control.value;
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { whitespaceOnly: true };
  }
  if (trimmed !== value) {
    return { hasExtraSpaces: true };
  }
  if (/\s{2,}/.test(value)) {
    return { multipleSpaces: true };
  }
  return null;
}

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
      documento_identidad: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]+$/),
        Validators.minLength(5),
        Validators.maxLength(15)
      ]],
      nombre_completo: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/),
        trimmedValidator
      ]],
      correo: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      telefono: ['', [
        Validators.pattern(/^[0-9]+$/),
        Validators.minLength(7),
        Validators.maxLength(15)
      ]],
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

  isValid(field: string): boolean {
    const control = this.docenteForm.get(field);
    return !!(control && control.valid && control.touched && control.value);
  }

  getErrorMessage(field: string): string {
    const control = this.docenteForm.get(field);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) {
      const labels: Record<string, string> = {
        documento_identidad: 'El documento de identidad es requerido',
        nombre_completo: 'El nombre completo es requerido',
        correo: 'El correo electronico es requerido'
      };
      return labels[field] || 'Este campo es requerido';
    }
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `No puede exceder ${maxLength} caracteres`;
    }
    if (control.hasError('email')) {
      return 'Ingrese un correo valido (ej: usuario@dominio.com)';
    }
    if (control.hasError('pattern')) {
      const patterns: Record<string, string> = {
        documento_identidad: 'Solo se permiten numeros',
        telefono: 'Solo se permiten numeros',
        nombre_completo: 'Solo puede contener letras y espacios'
      };
      return patterns[field] || 'Formato invalido';
    }
    if (control.hasError('whitespaceOnly')) {
      return 'No puede contener solo espacios';
    }
    if (control.hasError('hasExtraSpaces')) {
      return 'No puede tener espacios al inicio o final';
    }
    if (control.hasError('multipleSpaces')) {
      return 'No puede tener multiples espacios consecutivos';
    }
    return 'Campo invalido';
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
