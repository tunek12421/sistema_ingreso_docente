import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  imports: [CommonModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.css'
})
export class LoadingSpinner {
  size = input<'sm' | 'md' | 'lg'>('md');
  color = input<'primary' | 'white' | 'gray'>('primary');
  fullScreen = input<boolean>(false);

  getSizeClass(): string {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    };
    return sizes[this.size()];
  }

  getColorClass(): string {
    const colors = {
      primary: 'border-primary-600',
      white: 'border-white',
      gray: 'border-gray-600'
    };
    return colors[this.color()];
  }
}
