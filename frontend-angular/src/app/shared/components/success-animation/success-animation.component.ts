import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-animation.component.html',
  styleUrl: './success-animation.component.css'
})
export class SuccessAnimationComponent implements OnInit {
  @Input() show = false;
  @Input() title = 'Registro Exitoso';
  @Input() message = '';
  @Input() type: 'success' | 'error' = 'success';
  @Input() autoClose = true;
  @Input() autoCloseDelay = 2500;
  @Output() closed = new EventEmitter<void>();

  ngOnInit(): void {
    if (this.autoClose && this.show) {
      this.startAutoClose();
    }
  }

  ngOnChanges(): void {
    if (this.autoClose && this.show) {
      this.startAutoClose();
    }
  }

  private startAutoClose(): void {
    setTimeout(() => {
      this.close();
    }, this.autoCloseDelay);
  }

  close(): void {
    this.closed.emit();
  }
}
