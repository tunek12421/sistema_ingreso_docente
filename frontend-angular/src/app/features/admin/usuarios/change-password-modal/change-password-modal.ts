import { Component, OnInit, input, output, effect } from '@angular/core';
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

  constructor(private fb: FormBuilder) {
    // Effect para resetear el formulario cuando cambia el usuario
    effect(() => {
      const user = this.usuario();
      if (user && this.passwordForm) {
        this.passwordForm.reset();
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
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
      return 'Este campo es requerido';
    }
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (control.errors['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  hasError(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }
}
