import { Component, EventEmitter, input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcamCaptureComponent } from '../../../shared/components/webcam-capture/webcam-capture.component';
import { ReconocimientoService } from '../../../core/services/reconocimiento.service';
import { Docente } from '../../../shared/models/docente.model';

@Component({
  selector: 'app-registrar-rostro-modal',
  standalone: true,
  imports: [CommonModule, WebcamCaptureComponent],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Registrar Rostro</h2>
              <p class="text-sm text-gray-600 mt-1">{{ docente().nombre_completo }} (CI: {{ docente().documento_identidad }})</p>
            </div>
            <button
              type="button"
              (click)="cancel()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Success Message -->
          @if (success()) {
            <div class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
              <svg class="h-5 w-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{{ success() }}</p>
            </div>
          }

          <!-- Error Message -->
          @if (error()) {
            <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <svg class="h-5 w-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{{ error() }}</p>
            </div>
          }

          <!-- Fotos Existentes -->
          @if (!guardandoRostro() && !success()) {
            @if (cargandoDescriptores()) {
              <div class="mb-6 flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span class="text-gray-600">Cargando fotos registradas...</span>
              </div>
            } @else if (descriptoresExistentes().length > 0) {
              <div class="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold text-gray-900">
                    Fotos ya registradas ({{ descriptoresExistentes().length }})
                  </h3>
                  @if (descriptoresExistentes().length > 0) {
                    <button
                      type="button"
                      (click)="limpiarTodosDescriptores()"
                      [disabled]="eliminandoDescriptor()"
                      class="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Eliminar todas
                    </button>
                  }
                </div>
                <div class="grid grid-cols-3 gap-3">
                  @for (descriptor of descriptoresExistentes(); track $index) {
                    <div class="relative bg-white border-2 border-gray-300 rounded-lg p-3 group">
                      <div class="flex items-center justify-center h-20">
                        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div class="text-center mt-2">
                        <p class="text-xs text-gray-600">Foto {{ $index + 1 }}</p>
                      </div>
                      <button
                        type="button"
                        (click)="eliminarDescriptor($index)"
                        [disabled]="eliminandoDescriptor()"
                        class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="Eliminar esta foto"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
                <p class="mt-3 text-xs text-gray-500">
                  💡 Estas son las fotos utilizadas para el reconocimiento facial. Puedes eliminarlas individualmente o agregar más fotos.
                </p>
              </div>
            }
          }

          <!-- Tabs -->
          @if (!guardandoRostro() && !success()) {
            <div class="mb-6 border-b border-gray-200">
              <nav class="-mb-px flex space-x-8">
                <button
                  type="button"
                  (click)="metodo.set('webcam')"
                  [class]="metodo() === 'webcam' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Cámara Web
                  </div>
                </button>
                <button
                  type="button"
                  (click)="metodo.set('upload')"
                  [class]="metodo() === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subir Fotos
                  </div>
                </button>
              </nav>
            </div>
          }

          <!-- Content -->
          @if (guardandoRostro()) {
            <div class="flex flex-col items-center justify-center py-12">
              <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-4"></div>
              <p class="text-gray-600">Procesando fotos...</p>
            </div>
          } @else if (success()) {
            <div class="flex justify-center mt-4">
              <button
                type="button"
                (click)="close()"
                class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Cerrar
              </button>
            </div>
          } @else {
            @if (metodo() === 'webcam') {
              <!-- Instrucciones Webcam -->
              <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-800">
                  <strong>Instrucciones:</strong> Capture 3 fotos del docente desde diferentes ángulos (frontal, ligeramente a la izquierda, ligeramente a la derecha) para mejor reconocimiento.
                </p>
              </div>

              @if (capturedImages().length < 3) {
                <app-webcam-capture
                  (imageCaptured)="onImageCaptured($event)"
                  (cancelled)="cancel()"
                ></app-webcam-capture>

                <!-- Progress -->
                <div class="mt-4 text-center">
                  <p class="text-sm text-gray-600">
                    Fotos capturadas: <span class="font-semibold text-blue-600">{{ capturedImages().length }}/3</span>
                  </p>
                </div>
              } @else {
                <div class="text-center py-8">
                  <svg class="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-lg font-medium text-gray-900 mb-2">¡3 fotos capturadas!</p>
                  <p class="text-sm text-gray-600 mb-6">Las fotos están listas para ser registradas</p>
                  <div class="flex justify-center gap-3">
                    <button
                      type="button"
                      (click)="resetarCaptura()"
                      class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                    >
                      Volver a capturar
                    </button>
                    <button
                      type="button"
                      (click)="guardarRostros()"
                      class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                    >
                      Guardar Rostros
                    </button>
                  </div>
                </div>
              }
            } @else {
              <!-- Subir Fotos -->
              <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-800">
                  <strong>Instrucciones:</strong> Seleccione al menos 3 fotos del docente. Asegúrese de que las fotos muestren el rostro claramente y desde diferentes ángulos.
                </p>
              </div>

              <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  #fileInput
                  multiple
                  accept="image/*"
                  (change)="onFilesSelected($event)"
                  class="hidden"
                >
                <button
                  type="button"
                  (click)="fileInput.click()"
                  class="text-blue-600 hover:text-blue-700 font-medium"
                >
                  <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span class="text-lg">Click para seleccionar fotos</span>
                  <p class="text-sm text-gray-500 mt-2">o arrastre las imágenes aquí (mínimo 3)</p>
                </button>
              </div>

              <!-- Preview de imágenes seleccionadas -->
              @if (selectedFiles().length > 0) {
                <div class="mt-6">
                  <p class="text-sm font-medium text-gray-700 mb-3">
                    Fotos seleccionadas: {{ selectedFiles().length }}
                  </p>
                  <div class="grid grid-cols-3 gap-4">
                    @for (file of selectedFiles(); track $index) {
                      <div class="relative group">
                        <img [src]="getFilePreview($index)" alt="Preview" class="w-full h-32 object-cover rounded-lg border-2 border-gray-200">
                        <button
                          type="button"
                          (click)="removeFile($index)"
                          class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    }
                  </div>

                  @if (selectedFiles().length >= 3) {
                    <div class="mt-4 flex justify-end">
                      <button
                        type="button"
                        (click)="guardarRostros()"
                        class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                      >
                        Guardar {{ selectedFiles().length }} Fotos
                      </button>
                    </div>
                  } @else {
                    <p class="mt-3 text-sm text-amber-600">
                      Se requieren al menos 3 fotos (faltan {{ 3 - selectedFiles().length }})
                    </p>
                  }
                </div>
              }
            }
          }
        </div>
      </div>
    </div>
  `
})
export class RegistrarRostroModal implements OnInit, OnDestroy {
  docente = input.required<Docente>();
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  metodo = signal<'webcam' | 'upload'>('upload');
  guardandoRostro = signal(false);
  error = signal('');
  success = signal('');
  capturedImages = signal<File[]>([]);
  selectedFiles = signal<File[]>([]);
  selectedFilesPreviews = signal<string[]>([]); // URLs de preview para archivos seleccionados
  descriptoresExistentes = signal<string[]>([]);
  cargandoDescriptores = signal(false);
  eliminandoDescriptor = signal(false);

  constructor(private reconocimientoService: ReconocimientoService) {}

  ngOnInit() {
    this.cargarDescriptoresExistentes();
  }

  ngOnDestroy() {
    // Limpiar URLs de blob para evitar memory leaks
    this.selectedFilesPreviews().forEach(url => URL.revokeObjectURL(url));
  }

  cargarDescriptoresExistentes() {
    this.cargandoDescriptores.set(true);
    this.reconocimientoService.obtenerDescriptoresDocente(this.docente().id).subscribe({
      next: (response) => {
        this.cargandoDescriptores.set(false);
        if (response.data && response.data.descriptors) {
          this.descriptoresExistentes.set(response.data.descriptors);
        }
      },
      error: (err) => {
        this.cargandoDescriptores.set(false);
        console.error('Error al cargar descriptores:', err);
      }
    });
  }

  eliminarDescriptor(index: number) {
    if (!confirm('¿Está seguro de eliminar esta foto registrada?')) {
      return;
    }

    this.eliminandoDescriptor.set(true);
    this.error.set('');

    this.reconocimientoService.eliminarDescriptorDocente(this.docente().id, index).subscribe({
      next: (response) => {
        this.eliminandoDescriptor.set(false);
        this.success.set('Foto eliminada exitosamente');
        this.cargarDescriptoresExistentes();
        setTimeout(() => this.success.set(''), 2000);
      },
      error: (err) => {
        this.eliminandoDescriptor.set(false);
        this.error.set('Error al eliminar foto');
      }
    });
  }

  limpiarTodosDescriptores() {
    if (!confirm('¿Está seguro de eliminar TODAS las fotos registradas? Esta acción no se puede deshacer.')) {
      return;
    }

    this.eliminandoDescriptor.set(true);
    this.error.set('');

    this.reconocimientoService.limpiarDescriptoresDocente(this.docente().id).subscribe({
      next: (response) => {
        this.eliminandoDescriptor.set(false);
        this.success.set('Todas las fotos han sido eliminadas');
        this.cargarDescriptoresExistentes();
        setTimeout(() => this.success.set(''), 2000);
      },
      error: (err) => {
        this.eliminandoDescriptor.set(false);
        this.error.set('Error al eliminar fotos');
      }
    });
  }

  onImageCaptured(imageFile: File) {
    const current = this.capturedImages();
    this.capturedImages.set([...current, imageFile]);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      // Limpiar URLs antiguas
      this.selectedFilesPreviews().forEach(url => URL.revokeObjectURL(url));

      const filesArray = Array.from(input.files);
      this.selectedFiles.set(filesArray);

      // Crear nuevas URLs de preview
      const previews = filesArray.map(file => URL.createObjectURL(file));
      this.selectedFilesPreviews.set(previews);
    }
  }

  removeFile(index: number) {
    const currentFiles = this.selectedFiles();
    const currentPreviews = this.selectedFilesPreviews();

    // Liberar la URL del archivo eliminado
    URL.revokeObjectURL(currentPreviews[index]);

    currentFiles.splice(index, 1);
    currentPreviews.splice(index, 1);

    this.selectedFiles.set([...currentFiles]);
    this.selectedFilesPreviews.set([...currentPreviews]);
  }

  getFilePreview(index: number): string {
    return this.selectedFilesPreviews()[index] || '';
  }

  resetarCaptura() {
    this.capturedImages.set([]);
  }

  guardarRostros() {
    const files = this.metodo() === 'webcam' ? this.capturedImages() : this.selectedFiles();

    if (files.length < 3) {
      this.error.set('Se requieren al menos 3 fotos del docente');
      return;
    }

    this.guardandoRostro.set(true);
    this.error.set('');
    this.success.set('');

    const docenteData = this.docente();
    this.reconocimientoService.registrarRostroDocente(docenteData.id, files).subscribe({
      next: (response) => {
        this.guardandoRostro.set(false);
        this.success.set(response.message || 'Rostros registrados exitosamente');
        this.onSuccess.emit();

        // Recargar descriptores para mostrar las nuevas fotos
        this.cargarDescriptoresExistentes();

        // Limpiar URLs de blob
        this.selectedFilesPreviews().forEach(url => URL.revokeObjectURL(url));

        // Limpiar las fotos capturadas/seleccionadas
        this.capturedImages.set([]);
        this.selectedFiles.set([]);
        this.selectedFilesPreviews.set([]);

        setTimeout(() => {
          this.success.set('');
        }, 3000);
      },
      error: (err) => {
        this.guardandoRostro.set(false);
        const errorMsg = err.error?.error || 'Error al registrar rostros. Por favor, intente de nuevo.';
        this.error.set(errorMsg);
        console.error('Error al registrar rostro:', err);
      }
    });
  }

  cancel() {
    this.onClose.emit();
  }

  close() {
    this.onClose.emit();
  }
}
