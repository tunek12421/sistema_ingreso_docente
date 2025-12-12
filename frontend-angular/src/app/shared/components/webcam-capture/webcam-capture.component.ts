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
  @ViewChild('displayCanvas') displayCanvasElement!: ElementRef<HTMLCanvasElement>;

  @Input() captureInterval = 1000; // Intervalo de captura en ms (por defecto 1 segundo)

  @Output() frameCaptured = new EventEmitter<File>(); // Emite frames capturados
  @Output() closed = new EventEmitter<void>(); // Emite cuando se cierra el componente

  // Señales de estado
  stream = signal<MediaStream | null>(null);
  cameraReady = signal(false);
  error = signal<string | null>(null);
  procesando = signal(false); // Estado de procesamiento/reconocimiento
  minimizado = signal(false); // Estado de minimización
  movimientoDetectado = signal(false); // Indica si hay movimiento
  estadoCaptura = signal<'esperando' | 'movimiento' | 'quietud' | 'capturando'>('esperando'); // Estado del flujo de captura

  private displayIntervalId: any = null;
  private motionDetectionIntervalId: any = null;
  
  // Variables para detección de movimiento
  private previousFrameData: ImageData | null = null;
  private motionThreshold = 40; // Umbral de diferencia de píxeles para considerar movimiento
  private motionPixelsThreshold = 0.07; // Porcentaje de píxeles que deben cambiar
  
  // Variables para tracking de quietud
  private movimientoPrevioDetectado = false; // Indica si hubo movimiento en ciclo anterior
  private tiempoInicioQuietud: number | null = null; // Timestamp cuando comenzó la quietud
  private tiempoQuietudRequerido = 200; // Ms de quietud requeridos antes de capturar
  private esperandoQuietud = false; // Flag para saber si estamos esperando quietud después de movimiento

  ngOnInit(): void {
    console.log('[WebcamCapture] Inicializando componente');
    console.log('[WebcamCapture] Intervalo de captura:', this.captureInterval, 'ms');
    this.startCamera();
  }

  // Método público para detener la cámara
  public detenerCamara(): void {
    this.stopCamera();
    this.stopDisplayUpdate();
    this.stopMotionDetection();
  }

  // Método público para que el padre indique que está procesando
  public setProcesando(estado: boolean): void {
    console.log('[WebcamCapture] setProcesando llamado con:', estado);
    console.log('[WebcamCapture] Valor anterior de procesando:', this.procesando());
    this.procesando.set(estado);
    console.log('[WebcamCapture] Valor actual de procesando:', this.procesando());
  }

  // Alternar minimización
  toggleMinimizar(): void {
    this.minimizado.set(!this.minimizado());
  }

  // Cerrar el componente
  cerrar(): void {
    this.detenerCamara();
    this.closed.emit();
  }

  ngOnDestroy(): void {
    console.log('[WebcamCapture] Destruyendo componente');
    this.stopCamera();
    this.stopDisplayUpdate();
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

      console.log('[WebcamCapture] ✓ Cámara iniciada exitosamente');
      this.stream.set(mediaStream);
      
      // Marcar cámara como lista INMEDIATAMENTE después de obtener permisos
      this.cameraReady.set(true);

      // Esperar a que el elemento de video se renderice
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = mediaStream;
          console.log('[WebcamCapture] ✓ Stream asignado al elemento de video');

          // Iniciar detección de movimiento y visualización cuando el video esté listo
          this.videoElement.nativeElement.onloadedmetadata = () => {
            console.log('[WebcamCapture] Video metadata cargada, iniciando detección de movimiento');
            this.startMotionDetection();
            this.startDisplayUpdate();
            
            // Forzar quietud inicial para captura inmediata
            setTimeout(() => {
              console.log('[WebcamCapture] Activando captura inmediata al inicio');
              this.esperandoQuietud = true;
              this.tiempoInicioQuietud = Date.now() - this.tiempoQuietudRequerido;
            }, 100); // Esperar 100ms para que la cámara se estabilice
          };
        }
      }, 100);
    } catch (err: any) {
      console.error('[WebcamCapture] ERROR al acceder a la cámara:', err);
      const errorMessage = 'No se pudo acceder a la cámara. Verifique los permisos.';
      this.error.set(errorMessage);
      this.cameraReady.set(false);
      // Cerrar automáticamente después de 3 segundos si hay error
      setTimeout(() => this.cerrar(), 3000);
      return;
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
    this.stopDisplayUpdate();
    this.stopMotionDetection();
  }

  startMotionDetection() {
    console.log('[WebcamCapture] Iniciando detección de movimiento');
    this.stopMotionDetection();

    // Detectar movimiento cada 100ms (más rápido que la captura)
    this.motionDetectionIntervalId = setInterval(() => {
      this.detectMotion();
    }, 100);
  }

  stopMotionDetection() {
    if (this.motionDetectionIntervalId) {
      console.log('[WebcamCapture] Deteniendo detección de movimiento');
      clearInterval(this.motionDetectionIntervalId);
      this.motionDetectionIntervalId = null;
      this.previousFrameData = null;
    }
  }

  detectMotion() {
    const video = this.videoElement?.nativeElement;
    const canvas = this.canvasElement?.nativeElement;

    if (!video || !canvas || !this.cameraReady()) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    // Capturar frame actual
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height);

    if (this.previousFrameData) {
      // Comparar con el frame anterior
      const diff = this.compareFrames(currentFrameData, this.previousFrameData);
      const totalPixels = canvas.width * canvas.height;
      const changedPixelsPercentage = diff / totalPixels;

      // Detectar movimiento si supera el umbral
      const hasMotion = changedPixelsPercentage > this.motionPixelsThreshold;
      this.movimientoDetectado.set(hasMotion);

      // Gestionar flujo de captura basado en movimiento
      if (hasMotion) {
        // Hay movimiento actual
        console.log(`[WebcamCapture] Movimiento detectado: ${(changedPixelsPercentage * 100).toFixed(2)}% de píxeles cambiaron`);
        this.estadoCaptura.set('movimiento');
        this.esperandoQuietud = true; // Marcar que ahora esperamos quietud
        this.tiempoInicioQuietud = null; // Reset tiempo de quietud
      } else if (this.esperandoQuietud && !hasMotion) {
        // Transición: había movimiento y ahora está quieto
        if (this.tiempoInicioQuietud === null) {
          // Primera detección de quietud después de movimiento
          this.tiempoInicioQuietud = Date.now();
          console.log('[WebcamCapture] Usuario se detuvo, esperando quietud...');
          this.estadoCaptura.set('quietud');
        } else {
          // Verificar si ha pasado suficiente tiempo de quietud
          const tiempoQuieto = Date.now() - this.tiempoInicioQuietud;
          if (tiempoQuieto >= this.tiempoQuietudRequerido) {
            // Suficiente tiempo de quietud, capturar inmediatamente
            console.log(`[WebcamCapture] Quietud confirmada (${tiempoQuieto}ms), capturando ahora`);
            this.estadoCaptura.set('capturando');
            this.captureFrame();
          }
        }
      }

      this.movimientoPrevioDetectado = hasMotion;
    }

    // Guardar frame actual como anterior
    this.previousFrameData = currentFrameData;
  }

  compareFrames(frame1: ImageData, frame2: ImageData): number {
    let changedPixels = 0;
    const length = frame1.data.length;

    // Comparar cada 4 píxeles (RGB, ignorando alpha) para optimizar
    for (let i = 0; i < length; i += 4) {
      const rDiff = Math.abs(frame1.data[i] - frame2.data[i]);
      const gDiff = Math.abs(frame1.data[i + 1] - frame2.data[i + 1]);
      const bDiff = Math.abs(frame1.data[i + 2] - frame2.data[i + 2]);
      
      // Promedio de diferencia
      const avgDiff = (rDiff + gDiff + bDiff) / 3;

      if (avgDiff > this.motionThreshold) {
        changedPixels++;
      }
    }

    return changedPixels;
  }

  startDisplayUpdate() {
    console.log('[WebcamCapture] Iniciando actualización de visualización');
    this.stopDisplayUpdate();

    // Actualizar el canvas de visualización a 30 FPS
    this.displayIntervalId = setInterval(() => {
      this.updateDisplayCanvas();
    }, 33); // ~30 FPS
  }

  stopDisplayUpdate() {
    if (this.displayIntervalId) {
      console.log('[WebcamCapture] Deteniendo actualización de visualización');
      clearInterval(this.displayIntervalId);
      this.displayIntervalId = null;
    }
  }

  updateDisplayCanvas() {
    const video = this.videoElement?.nativeElement;
    const displayCanvas = this.displayCanvasElement?.nativeElement;

    if (!video || !displayCanvas || !this.cameraReady()) {
      return;
    }

    const context = displayCanvas.getContext('2d');
    if (!context) {
      return;
    }

    // Ajustar el tamaño del canvas al video
    displayCanvas.width = video.videoWidth;
    displayCanvas.height = video.videoHeight;

    // Dibujar el frame actual del video
    context.drawImage(video, 0, 0, displayCanvas.width, displayCanvas.height);
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
        console.log(`[WebcamCapture]📸 Frame capturado exitosamente: ${file.name}, tamaño: ${(file.size / 1024).toFixed(2)} KB, dimensiones: ${canvas.width}x${canvas.height}`);
        this.frameCaptured.emit(file);
        
        // Resetear estado después de captura
        this.esperandoQuietud = false;
        this.tiempoInicioQuietud = null;
        this.estadoCaptura.set('esperando');
        console.log('[WebcamCapture] Estado reseteado, esperando nuevo ciclo de movimiento');
      } else {
        console.error('[WebcamCapture] ERROR: No se pudo crear blob desde canvas');
      }
    }, 'image/jpeg', 0.98);
  }
}
