import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-webcam-capture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webcam-capture.component.html',
  styleUrls: ['./webcam-capture.component.css']
})
export class WebcamCaptureComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  @Input() continuousMode = false; // Modo continuo para reconocimiento automático
  @Input() captureInterval = 1000; // Intervalo de captura en ms (por defecto 1 segundo)

  @Output() imageCaptured = new EventEmitter<File>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() frameCaptured = new EventEmitter<File>(); // Para modo continuo

  stream = signal<MediaStream | null>(null);
  isCapturing = signal(false);
  capturedImage = signal<string | null>(null);
  error = signal<string | null>(null);

  private continuousIntervalId: any = null;
  private frameCount = 0;

  ngOnInit(): void {
    console.log('[WebcamCapture] Inicializando componente');
    console.log('[WebcamCapture] Modo continuo:', this.continuousMode);
    console.log('[WebcamCapture] Intervalo de captura:', this.captureInterval, 'ms');
    this.startCamera();
  }

  ngOnDestroy(): void {
    console.log('[WebcamCapture] Destruyendo componente');
    this.stopCamera();
    this.stopContinuousCapture();
  }

  async startCamera() {
    console.log('[WebcamCapture] Iniciando cámara...');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      console.log('[WebcamCapture] ✓ Cámara iniciada exitosamente');
      this.stream.set(mediaStream);

      // Wait for video element to be available
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = mediaStream;
          console.log('[WebcamCapture] ✓ Stream asignado al elemento de video');

          // Iniciar captura continua si está en modo continuo
          if (this.continuousMode) {
            this.videoElement.nativeElement.onloadedmetadata = () => {
              console.log('[WebcamCapture] Video metadata cargada, iniciando modo continuo');
              this.startContinuousCapture();
            };
          }
        }
      }, 100);
    } catch (err: any) {
      console.error('[WebcamCapture] ERROR al acceder a la cámara:', err);
      this.error.set('No se pudo acceder a la cámara. Por favor, verifique los permisos.');
    }
  }

  stopCamera() {
    console.log('[WebcamCapture] Deteniendo cámara');
    const currentStream = this.stream();
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      this.stream.set(null);
      console.log('[WebcamCapture] ✓ Cámara detenida');
    }
  }

  startContinuousCapture() {
    console.log('[WebcamCapture] Iniciando captura continua cada', this.captureInterval, 'ms');
    this.stopContinuousCapture(); // Detener cualquier captura previa

    this.continuousIntervalId = setInterval(() => {
      this.frameCount++;
      console.log(`[WebcamCapture] Capturando frame #${this.frameCount}`);
      this.captureFrame();
    }, this.captureInterval);
  }

  stopContinuousCapture() {
    if (this.continuousIntervalId) {
      console.log('[WebcamCapture] Deteniendo captura continua');
      clearInterval(this.continuousIntervalId);
      this.continuousIntervalId = null;
      this.frameCount = 0;
    }
  }

  captureFrame() {
    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (!video || !canvas) {
      console.warn('[WebcamCapture] Elementos de video o canvas no disponibles');
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('[WebcamCapture] ERROR: No se pudo obtener contexto del canvas');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and emit - aumentar calidad JPEG a 0.98
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `frame-${Date.now()}.jpg`, { type: 'image/jpeg' });
        console.log(`[WebcamCapture] ✓ Frame capturado: ${file.name}, tamaño: ${(file.size / 1024).toFixed(2)} KB, dimensiones: ${canvas.width}x${canvas.height}`);
        this.frameCaptured.emit(file);
      } else {
        console.error('[WebcamCapture] ERROR: No se pudo crear blob desde canvas');
      }
    }, 'image/jpeg', 0.98);
  }

  capturePhoto() {
    console.log('[WebcamCapture] Capturando foto manual');
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('[WebcamCapture] ERROR: No se pudo obtener contexto del canvas');
      this.error.set('Error al capturar imagen');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);

        console.log('[WebcamCapture] ✓ Foto capturada:', file.name, 'tamaño:', (file.size / 1024).toFixed(2), 'KB');

        this.capturedImage.set(imageUrl);
        this.isCapturing.set(true);

        // Emit the captured file
        this.imageCaptured.emit(file);
      }
    }, 'image/jpeg', 0.95);

    // Stop camera after capture (solo en modo manual)
    if (!this.continuousMode) {
      this.stopCamera();
    }
  }

  retake() {
    const currentImageUrl = this.capturedImage();
    if (currentImageUrl) {
      URL.revokeObjectURL(currentImageUrl);
    }

    this.capturedImage.set(null);
    this.isCapturing.set(false);
    this.startCamera();
  }

  cancel() {
    this.stopCamera();
    this.cancelled.emit();
  }
}
