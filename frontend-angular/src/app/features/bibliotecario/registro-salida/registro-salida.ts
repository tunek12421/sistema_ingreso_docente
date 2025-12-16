import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistroService } from '../../../core/services/registro.service';
import { LlaveActual } from '../../../shared/models';
import { SuccessAnimationComponent } from '../../../shared/components/success-animation/success-animation.component';

@Component({
  selector: 'app-registro-salida',
  imports: [CommonModule, ReactiveFormsModule, SuccessAnimationComponent],
  templateUrl: './registro-salida.html',
  styleUrl: './registro-salida.css'
})
export class RegistroSalida implements OnInit {
  registroForm: FormGroup;
  registrosActivos = signal<LlaveActual[]>([]);
  registroSeleccionado = signal<LlaveActual | null>(null);
  loading = signal<boolean>(false);
  loadingData = signal<boolean>(true);
  error = signal<string>('');
  success = signal<string>('');
  showSuccessAnimation = signal<boolean>(false);
  successAnimationMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      llave_codigo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRegistrosActivos();

    // Escuchar cambios en el formulario
    this.registroForm.get('llave_codigo')?.valueChanges.subscribe(codigo => {
      const registro = this.registrosActivos().find(r => r.llave_codigo === codigo);
      this.registroSeleccionado.set(registro || null);
    });
  }

  loadRegistrosActivos(): void {
    this.loadingData.set(true);
    this.error.set('');

    this.registroService.getLlaveActual().subscribe({
      next: (registros) => {
        // Si registros es null o undefined, tratarlo como array vacío
        this.registrosActivos.set(registros || []);
        this.loadingData.set(false);
      },
      error: (err) => {
        console.error('Error al cargar registros activos:', err);
        this.error.set('Error al cargar los registros activos');
        this.registrosActivos.set([]);
        this.loadingData.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const llaveCodigo = this.registroForm.value.llave_codigo?.trim();

    // Buscar el registro activo con esa llave
    const registroActivo = this.registrosActivos().find(r =>
      r.llave_codigo.toLowerCase() === llaveCodigo.toLowerCase()
    );

    if (!registroActivo) {
      this.error.set('No se encontró ningún registro activo con ese código de llave');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    // Crear request con los datos del registro activo
    const request = {
      ci: Number(registroActivo.docente_ci),
      turno_id: 1, // Usar turno default ya que LlaveActual no incluye turno_id
      llave_id: registroActivo.llave_id
    };

    console.log('📤 Enviando registro de salida:', request);
    console.log('📤 Datos del registro activo:', registroActivo);

    this.registroService.registrarSalida(request).subscribe({
      next: () => {
        this.loading.set(false);

        // Mostrar animacion de exito
        this.successAnimationMessage.set(`Llave ${registroActivo.llave_codigo} devuelta por ${registroActivo.docente_nombre_completo}`);
        this.showSuccessAnimation.set(true);

        this.registroForm.reset();
        this.registroSeleccionado.set(null);

        // Recargar registros activos
        this.loadRegistrosActivos();
      },
      error: (err) => {
        console.error('Error al registrar salida:', err);
        this.error.set(
          err.error?.message || 'Error al registrar la salida. Por favor, intente nuevamente.'
        );
        this.loading.set(false);
      }
    });
  }

  getHoraFormat(hora: string): string {
    try {
      const date = new Date(hora);
      return date.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return hora;
    }
  }

  getTiempoTranscurrido(hora: string): string {
    try {
      const entrada = new Date(hora);
      const ahora = new Date();
      const diff = ahora.getTime() - entrada.getTime();
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (horas > 0) {
        return `${horas}h ${minutos}m`;
      }
      return `${minutos}m`;
    } catch {
      return 'N/A';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSuccessAnimationClosed(): void {
    this.showSuccessAnimation.set(false);
    // No redirigir - quedarse en la misma pagina para seguir registrando
  }
}
