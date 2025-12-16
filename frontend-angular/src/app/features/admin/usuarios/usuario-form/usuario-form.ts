import { Component, OnInit, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Usuario, UsuarioCreate, UsuarioUpdate, Rol } from '../../../../shared/models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioForm implements OnInit {
  // Inputs/Outputs
  show = input.required<boolean>();
  usuario = input<Usuario | null>(null);
  onClose = output<void>();
  onSave = output<UsuarioCreate | { id: number; data: UsuarioUpdate }>();

  usuarioForm!: FormGroup;
  showPassword = false;

  roles: { value: Rol; label: string }[] = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'jefe_carrera', label: 'Jefe de Carrera' },
    { value: 'bibliotecario', label: 'Bibliotecario' },
    { value: 'becario', label: 'Becario' }
    // Nota: Los usuarios docentes se crean automáticamente al crear un docente
  ];

  constructor(private fb: FormBuilder) {
    // Effect para actualizar el formulario cuando cambian show o usuario
    effect(() => {
      const isVisible = this.show();
      const user = this.usuario();

      if (!this.usuarioForm) {
        return;
      }

      if (isVisible) {
        // Modal se está abriendo
        if (user) {
          // Modo edición
          this.setupEditMode(user);
        } else {
          // Modo creación
          this.setupCreateMode();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.usuarioForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['administrador', Validators.required],
      nombre_completo: [''],
      email: ['', [Validators.email]]
    });
  }

  setupCreateMode(): void {
    this.usuarioForm.reset({
      username: '',
      password: '',
      rol: 'administrador',
      nombre_completo: '',
      email: ''
    });

    // Password es requerido en creación
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();

    this.showPassword = false;
  }

  setupEditMode(user: Usuario): void {
    this.usuarioForm.patchValue({
      username: user.username,
      password: '',
      rol: user.rol,
      nombre_completo: user.nombre_completo || '',
      email: user.email || ''
    });

    // Password no se usa en edición (se cambia desde el modal dedicado)
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();

    this.showPassword = false;
  }

  get isEditMode(): boolean {
    return !!this.usuario();
  }

  get title(): string {
    return this.isEditMode ? 'Editar Usuario' : 'Nuevo Usuario';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.markFormGroupTouched(this.usuarioForm);
      return;
    }

    const formValue = this.usuarioForm.getRawValue();

    if (this.isEditMode) {
      const updateData: UsuarioUpdate = {
        rol: formValue.rol,
        nombre_completo: formValue.nombre_completo || undefined,
        email: formValue.email || undefined
      };
      this.onSave.emit({ id: this.usuario()!.id, data: updateData });
    } else {
      const createData: UsuarioCreate = {
        username: formValue.username,
        password: formValue.password,
        rol: formValue.rol,
        nombre_completo: formValue.nombre_completo || undefined,
        email: formValue.email || undefined
      };
      this.onSave.emit(createData);
    }
  }

  cancel(): void {
    this.onClose.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.usuarioForm.get(controlName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (control.errors['email']) {
      return 'Email inválido';
    }
    return '';
  }

  hasError(controlName: string): boolean {
    const control = this.usuarioForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }
}
