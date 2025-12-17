import { Component, OnInit, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Usuario, UsuarioCreate, UsuarioUpdate, Rol } from '../../../../shared/models/usuario.model';

// Validador personalizado para campos de texto (trim y validar espacios)
function trimmedValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Campo vacio es valido (no es requerido)
  }
  const value = control.value;
  const trimmed = value.trim();

  // No permite solo espacios
  if (trimmed.length === 0) {
    return { whitespaceOnly: true };
  }

  // No permite espacios al inicio o final
  if (trimmed !== value) {
    return { hasExtraSpaces: true };
  }

  // No permite multiples espacios consecutivos
  if (/\s{2,}/.test(value)) {
    return { multipleSpaces: true };
  }

  return null;
}

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

  // Indicador de fortaleza de password
  passwordStrength = signal<number>(0);
  passwordStrengthLabel = signal<string>('');
  passwordStrengthColor = signal<string>('bg-gray-200');

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
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)  // Solo letras, numeros y guion bajo
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50)
      ]],
      rol: ['administrador', Validators.required],
      nombre_completo: ['', [
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/),  // Solo letras y espacios
        trimmedValidator  // No permite solo espacios ni espacios al inicio/final
      ]],
      email: ['', [
        Validators.email,
        Validators.maxLength(100)
      ]]
    });

    // Escuchar cambios en password para calcular fortaleza
    this.usuarioForm.get('password')?.valueChanges.subscribe(value => {
      this.calculatePasswordStrength(value || '');
    });
  }

  calculatePasswordStrength(password: string): void {
    let strength = 0;

    if (!password) {
      this.passwordStrength.set(0);
      this.passwordStrengthLabel.set('');
      this.passwordStrengthColor.set('bg-gray-200');
      return;
    }

    // Criterios de fortaleza
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 15;  // minusculas
    if (/[A-Z]/.test(password)) strength += 15;  // mayusculas
    if (/[0-9]/.test(password)) strength += 15;  // numeros
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;  // caracteres especiales

    this.passwordStrength.set(Math.min(strength, 100));

    // Etiqueta y color segun fortaleza
    if (strength < 30) {
      this.passwordStrengthLabel.set('Muy debil');
      this.passwordStrengthColor.set('bg-red-500');
    } else if (strength < 50) {
      this.passwordStrengthLabel.set('Debil');
      this.passwordStrengthColor.set('bg-orange-500');
    } else if (strength < 70) {
      this.passwordStrengthLabel.set('Media');
      this.passwordStrengthColor.set('bg-yellow-500');
    } else if (strength < 90) {
      this.passwordStrengthLabel.set('Fuerte');
      this.passwordStrengthColor.set('bg-green-500');
    } else {
      this.passwordStrengthLabel.set('Muy fuerte');
      this.passwordStrengthColor.set('bg-green-600');
    }
  }

  setupCreateMode(): void {
    this.usuarioForm.reset({
      username: '',
      password: '',
      rol: 'administrador',
      nombre_completo: '',
      email: ''
    });

    // Password es requerido en creacion
    this.usuarioForm.get('password')?.setValidators([
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(50)
    ]);
    this.usuarioForm.get('password')?.updateValueAndValidity();

    this.showPassword = false;
    this.calculatePasswordStrength('');
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

  get isDocente(): boolean {
    const user = this.usuario();
    // Un usuario es docente si tiene rol 'docente' (los datos de nombre/email vienen del docente)
    return user?.rol === 'docente';
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

    const errors = control.errors;

    if (errors['required']) {
      const labels: Record<string, string> = {
        username: 'El nombre de usuario es requerido',
        password: 'La contrasena es requerida',
        rol: 'Debe seleccionar un rol'
      };
      return labels[controlName] || 'Este campo es requerido';
    }

    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }

    if (errors['maxlength']) {
      const maxLength = errors['maxlength'].requiredLength;
      return `No puede exceder ${maxLength} caracteres`;
    }

    if (errors['pattern']) {
      const patterns: Record<string, string> = {
        username: 'Solo puede contener letras, numeros y guion bajo (_)',
        nombre_completo: 'Solo puede contener letras y espacios'
      };
      return patterns[controlName] || 'Formato invalido';
    }

    if (errors['whitespaceOnly']) {
      return 'No puede contener solo espacios';
    }

    if (errors['hasExtraSpaces']) {
      return 'No puede tener espacios al inicio o final';
    }

    if (errors['multipleSpaces']) {
      return 'No puede tener multiples espacios consecutivos';
    }

    if (errors['email']) {
      return 'Ingrese un email valido (ej: usuario@dominio.com)';
    }

    return 'Campo invalido';
  }

  hasError(controlName: string): boolean {
    const control = this.usuarioForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  isValid(controlName: string): boolean {
    const control = this.usuarioForm.get(controlName);
    return !!(control && control.valid && control.touched && control.value);
  }

  // Getters para requisitos de password (para mostrar en UI)
  get passwordHasMinLength(): boolean {
    const password = this.usuarioForm.get('password')?.value || '';
    return password.length >= 6;
  }

  get passwordHasUppercase(): boolean {
    const password = this.usuarioForm.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  get passwordHasLowercase(): boolean {
    const password = this.usuarioForm.get('password')?.value || '';
    return /[a-z]/.test(password);
  }

  get passwordHasNumber(): boolean {
    const password = this.usuarioForm.get('password')?.value || '';
    return /[0-9]/.test(password);
  }
}
