import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        const userRole = response.user.rol;

        // Redirigir al dashboard correspondiente
        switch (userRole) {
          case 'administrador':
            this.router.navigate(['/admin']);
            break;
          case 'jefe_carrera':
            this.router.navigate(['/jefe-carrera']);
            break;
          case 'bibliotecario':
            this.router.navigate(['/bibliotecario']);
            break;
          case 'docente':
            this.router.navigate(['/docente']);
            break;
          default:
            this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Usuario o contraseña incorrectos');
      }
    });
  }

  // Getters para validación
  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
