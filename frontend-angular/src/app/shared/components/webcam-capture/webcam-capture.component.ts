import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, signal, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReconocimientoService } from '../../../core/services/reconocimiento.service';

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
  @ViewChild('displayCanvas') displayCanvasElement!: ElementRef<HTMLCanvasElement>;

  @Input() modo: 'registro' | 'identificacion' = 'identificacion';

  @Output() frameCaptured = new EventEmitter<File>();
  @Output() closed = new EventEmitter<void>();

  private reconocimientoService = inject(ReconocimientoService);

  // Señales de estado
  stream = signal<MediaStream | null>(null);
  cameraReady = signal(false);
  error = signal<string | null>(null);
  procesando = signal(false);
  minimizado = signal(false);

  // Estado de detección de rostro (modo registro)
  rostroDetectado = signal(false);
  validandoRostro = signal(false);
  mensajeEstado = signal<string>('Iniciando cámara...');

  // Estado para modo identificación (detección de movimiento)
  movimientoDetectado = signal(false);
  estadoCaptura = signal<'esperando' | 'movimiento' | 'quietud' | 'capturando'>('esperando');

  private displayIntervalId: any = null;
  private detectionIntervalId: any = null;
  private motionDetectionIntervalId: any = null;

  // Variables para detección de movimiento (modo identificación)
  private previousFrameData: ImageData | null = null;
  private motionThreshold = 40;
  private motionPixelsThreshold = 0.07;
  private movimientoPrevioDetectado = false;
  private tiempoInicioQuietud: number | null = null;
  private tiempoQuietudRequerido = 200;
  private esperandoQuietud = false;

  ngOnInit(): void {
    console.log('[WebcamCapture] Inicializando componente en modo:', this.modo);
    this.startCamera();
  }

  public detenerCamara(): void {
    this.stopCamera();
    this.stopDisplayUpdate();
    this.stopFaceDetection();
    this.stopMotionDetection();
  }

  public setProcesando(estado: boolean): void {
    this.procesando.set(estado);
  }

  toggleMinimizar(): void {
    this.minimizado.set(!this.minimizado());
  }

  cerrar(): void {
    this.detenerCamara();
    this.closed.emit();
  }

  ngOnDestroy(): void {
    console.log('[WebcamCapture] Destruyendo componente');
    this.stopCamera();
    this.stopDisplayUpdate();
    this.stopFaceDetection();
    this.stopMotionDetection();
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

      console.log('[WebcamCapture] Cámara iniciada exitosamente');
      this.stream.set(mediaStream);
      this.cameraReady.set(true);

      if (this.modo === 'registro') {
        this.mensajeEstado.set('Posicione su rostro en el centro');
      } else {
        this.mensajeEstado.set('Detectando movimiento...');
      }

      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = mediaStream;

          this.videoElement.nativeElement.onloadedmetadata = () => {
            console.log('[WebcamCapture] Video listo');
            this.startDisplayUpdate();

            if (this.modo === 'registro') {
              // Modo registro: detección de rostro con botón manual
              this.startFaceDetection();
            } else {
              // Modo identificación: detección de movimiento automática
              this.startMotionDetection();
            }
          };
        }
      }, 100);
    } catch (err: any) {
      console.error('[WebcamCapture] ERROR al acceder a la cámara:', err);
      this.error.set('No se pudo acceder a la cámara. Verifique los permisos.');
      this.cameraReady.set(false);
      setTimeout(() => this.cerrar(), 3000);
    }
  }

  stopCamera() {
    const currentStream = this.stream();
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      this.stream.set(null);
    }
    this.stopDisplayUpdate();
    this.stopFaceDetection();
    this.stopMotionDetection();
  }

  // ========== MODO REGISTRO: Detección de rostro con botón manual ==========

  startFaceDetection() {
    console.log('[WebcamCapture] Iniciando detección de rostro periódica');
    this.stopFaceDetection();

    this.detectionIntervalId = setInterval(() => {
      if (!this.validandoRostro() && !this.procesando()) {
        this.detectarRostro();
      }
    }, 1500);

    setTimeout(() => this.detectarRostro(), 500);
  }

  stopFaceDetection() {
    if (this.detectionIntervalId) {
      clearInterval(this.detectionIntervalId);
      this.detectionIntervalId = null;
    }
  }

  private detectarRostro() {
    if (this.validandoRostro() || this.procesando()) return;

    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (!video || !canvas || !this.cameraReady()) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], 'detection.jpg', { type: 'image/jpeg' });
      this.validandoRostro.set(true);
      this.mensajeEstado.set('Buscando rostro...');

      this.reconocimientoService.detectarRostro(file).subscribe({
        next: (response) => {
          this.validandoRostro.set(false);

          if (response.data && response.data.face_count > 0) {
            this.rostroDetectado.set(true);
            this.mensajeEstado.set('Rostro detectado - Listo para capturar');
          } else {
            this.rostroDetectado.set(false);
            this.mensajeEstado.set('No se detecta rostro - Acérquese a la cámara');
          }
        },
        error: () => {
          this.validandoRostro.set(false);
          this.rostroDetectado.set(false);
          this.mensajeEstado.set('Error al detectar - Intente de nuevo');
        }
      });
    }, 'image/jpeg', 0.85);
  }

  capturarFoto() {
    if (!this.rostroDetectado() || this.procesando()) {
      return;
    }

    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    this.procesando.set(true);
    this.mensajeEstado.set('Capturando...');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.frameCaptured.emit(file);

        this.rostroDetectado.set(false);
        this.mensajeEstado.set('Foto tomada - Posicione para siguiente');
        this.procesando.set(false);

        setTimeout(() => {
          this.mensajeEstado.set('Posicione su rostro en el centro');
        }, 1500);
      } else {
        this.procesando.set(false);
        this.mensajeEstado.set('Error al capturar - Intente de nuevo');
      }
    }, 'image/jpeg', 0.95);
  }

  // ========== MODO IDENTIFICACIÓN: Detección de movimiento automática ==========

  startMotionDetection() {
    console.log('[WebcamCapture] Iniciando detección de movimiento');
    this.stopMotionDetection();

    this.motionDetectionIntervalId = setInterval(() => {
      this.detectMotion();
    }, 100);

    // Forzar quietud inicial para captura inmediata
    setTimeout(() => {
      this.esperandoQuietud = true;
      this.tiempoInicioQuietud = Date.now() - this.tiempoQuietudRequerido;
    }, 100);
  }

  stopMotionDetection() {
    if (this.motionDetectionIntervalId) {
      clearInterval(this.motionDetectionIntervalId);
      this.motionDetectionIntervalId = null;
      this.previousFrameData = null;
    }
  }

  detectMotion() {
    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (!video || !canvas || !this.cameraReady()) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height);

    if (this.previousFrameData) {
      const diff = this.compareFrames(currentFrameData, this.previousFrameData);
      const totalPixels = canvas.width * canvas.height;
      const changedPixelsPercentage = diff / totalPixels;

      const hasMotion = changedPixelsPercentage > this.motionPixelsThreshold;
      this.movimientoDetectado.set(hasMotion);

      if (hasMotion) {
        this.estadoCaptura.set('movimiento');
        this.esperandoQuietud = true;
        this.tiempoInicioQuietud = null;
      } else if (this.esperandoQuietud && !hasMotion) {
        if (this.tiempoInicioQuietud === null) {
          this.tiempoInicioQuietud = Date.now();
          this.estadoCaptura.set('quietud');
        } else {
          const tiempoQuieto = Date.now() - this.tiempoInicioQuietud;
          if (tiempoQuieto >= this.tiempoQuietudRequerido) {
            this.estadoCaptura.set('capturando');
            this.captureFrameAuto();
          }
        }
      }

      this.movimientoPrevioDetectado = hasMotion;
    }

    this.previousFrameData = currentFrameData;
  }

  compareFrames(frame1: ImageData, frame2: ImageData): number {
    let changedPixels = 0;
    const length = frame1.data.length;

    for (let i = 0; i < length; i += 4) {
      const rDiff = Math.abs(frame1.data[i] - frame2.data[i]);
      const gDiff = Math.abs(frame1.data[i + 1] - frame2.data[i + 1]);
      const bDiff = Math.abs(frame1.data[i + 2] - frame2.data[i + 2]);

      const avgDiff = (rDiff + gDiff + bDiff) / 3;

      if (avgDiff > this.motionThreshold) {
        changedPixels++;
      }
    }

    return changedPixels;
  }

  captureFrameAuto() {
    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `frame-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.frameCaptured.emit(file);

        this.esperandoQuietud = false;
        this.tiempoInicioQuietud = null;
        this.estadoCaptura.set('esperando');
      }
    }, 'image/jpeg', 0.98);
  }

  // ========== Display ==========

  startDisplayUpdate() {
    this.stopDisplayUpdate();
    this.displayIntervalId = setInterval(() => {
      this.updateDisplayCanvas();
    }, 33);
  }

  stopDisplayUpdate() {
    if (this.displayIntervalId) {
      clearInterval(this.displayIntervalId);
      this.displayIntervalId = null;
    }
  }

  updateDisplayCanvas() {
    const video = this.videoElement?.nativeElement;
    const displayCanvas = this.displayCanvasElement?.nativeElement;

    if (!video || !displayCanvas || !this.cameraReady()) return;

    const context = displayCanvas.getContext('2d');
    if (!context) return;

    displayCanvas.width = video.videoWidth;
    displayCanvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, displayCanvas.width, displayCanvas.height);
  }

  // Método público para captura desde exterior (modo identificación legacy)
  captureFrame() {
    this.captureFrameAuto();
  }
}
