import { Component, OnInit, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Usuario } from '../../../../shared/models/usuario.model';

@Component({
  selector: 'app-change-password-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password-modal.html',
  styleUrl: './change-password-modal.css',
})
export class ChangePasswordModal implements OnInit {
  show = input.required<boolean>();
  usuario = input.required<Usuario | null>();
  onClose = output<void>();
  onSave = output<{ userId: number; newPassword: string }>();

  passwordForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  // Indicador de fortaleza de password
  passwordStrength = signal<number>(0);
  passwordStrengthLabel = signal<string>('');
  passwordStrengthColor = signal<string>('bg-gray-200');

  constructor(private fb: FormBuilder) {
    // Effect para resetear el formulario cuando cambia el usuario
    effect(() => {
      const user = this.usuario();
      if (user && this.passwordForm) {
        this.passwordForm.reset();
        this.calculatePasswordStrength('');
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.passwordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Escuchar cambios en password para calcular fortaleza
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(value => {
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

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    const user = this.usuario();
    if (!user) return;

    const newPassword = this.passwordForm.value.newPassword;
    this.onSave.emit({ userId: user.id, newPassword });
  }

  cancel(): void {
    this.passwordForm.reset();
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
    const control = this.passwordForm.get(controlName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      const labels: Record<string, string> = {
        newPassword: 'La nueva contrasena es requerida',
        confirmPassword: 'Debe confirmar la contrasena'
      };
      return labels[controlName] || 'Este campo es requerido';
    }
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `No puede exceder ${maxLength} caracteres`;
    }
    if (control.errors['passwordMismatch']) {
      return 'Las contrasenas no coinciden';
    }
    return 'Campo invalido';
  }

  hasError(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  isValid(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control && control.valid && control.touched && control.value);
  }

  // Getters para requisitos de password (para mostrar en UI)
  get passwordHasMinLength(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return password.length >= 6;
  }

  get passwordHasUppercase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(password);
  }

  get passwordHasLowercase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[a-z]/.test(password);
  }

  get passwordHasNumber(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[0-9]/.test(password);
  }

  get passwordsMatch(): boolean {
    const newPassword = this.passwordForm.get('newPassword')?.value || '';
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value || '';
    return newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  }
}
