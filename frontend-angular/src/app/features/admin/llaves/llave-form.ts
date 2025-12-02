import { Component, OnInit, Input, Output, EventEmitter, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Llave, LlaveCreate, LlaveUpdate, ESTADOS_LLAVE } from '../../../shared/models/llave.model';

@Component({
  selector: 'app-llave-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './llave-form.html',
  styleUrl: './llave-form.css',
})
export class LlaveForm implements OnInit {
  llave = input<Llave | null>(null);
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<LlaveCreate | { id: number; data: LlaveUpdate }>();

  llaveForm!: FormGroup;
  show = signal<boolean>(true);

  // Estados disponibles
  readonly estadosLlave = ESTADOS_LLAVE;

  // Tipos de aula
  readonly tiposAula = [
    { value: 'A', label: 'Aula' },
    { value: 'LAB', label: 'Laboratorio' },
    { value: 'T', label: 'Taller' },
    { value: 'OF', label: 'Oficina' }
  ];

  constructor(private fb: FormBuilder) {
    effect(() => {
      const llave = this.llave();
      if (llave) {
        this.setupEditMode(llave);
      } else {
        this.setupCreateMode();
      }
    });
  }

  get isEditMode(): boolean {
    return this.llave() !== null;
  }

  get title(): string {
    return this.isEditMode ? 'Editar Llave' : 'Nueva Llave';
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.llaveForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Z0-9\-]+$/)]],
      tipo_aula: ['', [Validators.required]],
      numero_aula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      aula_codigo: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Z0-9\-]+$/)]],
      aula_nombre: [''],
      estado: ['disponible', [Validators.required]],
      descripcion: ['']
    });

    // Auto-generar códigos cuando cambia tipo o número
    this.llaveForm.get('tipo_aula')?.valueChanges.subscribe(() => {
      this.updateCodigos();
    });

    this.llaveForm.get('numero_aula')?.valueChanges.subscribe(() => {
      this.updateCodigos();
    });
  }

  updateCodigos(): void {
    const tipo = this.llaveForm.get('tipo_aula')?.value;
    const numero = this.llaveForm.get('numero_aula')?.value;

    if (tipo && numero && !this.isEditMode) {
      const codigo = `${tipo}-${numero}`;

      this.llaveForm.patchValue({
        aula_codigo: codigo,
        codigo: codigo
      }, { emitEvent: false });
    }
  }

  setupCreateMode(): void {
    this.llaveForm.reset({
      codigo: '',
      tipo_aula: '',
      numero_aula: '',
      aula_codigo: '',
      aula_nombre: '',
      estado: 'disponible',
      descripcion: ''
    });
  }

  setupEditMode(llave: Llave): void {
    // Parsear aula_codigo para extraer tipo y número
    const parsed = this.parseAulaCodigo(llave.aula_codigo);

    this.llaveForm.patchValue({
      codigo: llave.codigo,
      tipo_aula: parsed.tipo,
      numero_aula: parsed.numero,
      aula_codigo: llave.aula_codigo,
      aula_nombre: llave.aula_nombre,
      estado: llave.estado,
      descripcion: llave.descripcion || ''
    });
  }

  parseAulaCodigo(aulaCodigo: string): { tipo: string; numero: string } {
    const parts = aulaCodigo.split('-');
    if (parts.length >= 2) {
      return {
        tipo: parts[0],
        numero: parts.slice(1).join('-') // En caso de que haya más guiones
      };
    }
    return { tipo: '', numero: '' };
  }

  onSubmit(): void {
    if (this.llaveForm.invalid) {
      this.markFormGroupTouched(this.llaveForm);
      return;
    }

    const formValue = this.llaveForm.value;

    // Si aula_nombre está vacío, generar uno automáticamente
    let aulaNombre = formValue.aula_nombre;
    if (!aulaNombre) {
      const tipoLabel = this.tiposAula.find(t => t.value === formValue.tipo_aula)?.label || formValue.tipo_aula;
      aulaNombre = `${tipoLabel} ${formValue.numero_aula}`;
    }

    if (this.isEditMode) {
      const updateData: LlaveUpdate = {
        codigo: formValue.codigo,
        aula_codigo: formValue.aula_codigo,
        aula_nombre: aulaNombre,
        estado: formValue.estado,
        descripcion: formValue.descripcion || undefined
      };
      this.onSave.emit({ id: this.llave()!.id, data: updateData });
    } else {
      const createData: LlaveCreate = {
        codigo: formValue.codigo,
        aula_codigo: formValue.aula_codigo,
        aula_nombre: aulaNombre,
        estado: formValue.estado,
        descripcion: formValue.descripcion || undefined
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
    const control = this.llaveForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.llaveForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (control?.hasError('pattern')) {
      return 'Solo letras mayúsculas, números y guiones (ej: B-16, LAB-3)';
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
