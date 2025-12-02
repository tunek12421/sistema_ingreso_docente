import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Llave, LlaveCreate, LlaveUpdate, ESTADOS_LLAVE, EstadoLlave } from '../../../shared/models/llave.model';
import { LlaveService } from '../../../core/services/llave.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AlertModal, AlertType } from '../../../shared/components/alert-modal/alert-modal';
import { LlaveForm } from './llave-form';

@Component({
  selector: 'app-llaves-list',
  imports: [CommonModule, FormsModule, LoadingSpinner, AlertModal, LlaveForm],
  templateUrl: './llaves-list.html',
  styleUrl: './llaves-list.css',
})
export class LlavesList implements OnInit {
  llaves = signal<Llave[]>([]);
  filteredLlaves = signal<Llave[]>([]);
  loading = signal<boolean>(false);

  // Filtros
  searchTerm = signal<string>('');
  estadoFilter = signal<EstadoLlave | ''>('');

  // Paginación
  currentPage = signal<number>(1);
  readonly itemsPerPage = 6;
  totalPages = signal<number>(1);
  readonly Math = Math;

  // Modal de confirmación
  showDeleteModal = signal<boolean>(false);
  llaveToDelete = signal<Llave | null>(null);

  // Modal de formulario
  showForm = signal<boolean>(false);
  llaveToEdit = signal<Llave | null>(null);

  // Modal de alerta
  showAlert = signal<boolean>(false);
  alertType = signal<AlertType>('success');
  alertTitle = signal<string>('');
  alertMessage = signal<string>('');

  // Estados disponibles
  readonly estadosLlave = ESTADOS_LLAVE;

  constructor(private llaveService: LlaveService) {}

  ngOnInit(): void {
    this.loadLlaves();
  }

  loadLlaves(): void {
    this.loading.set(true);
    this.llaveService.getAll().subscribe({
      next: (response) => {
        const llaves = response.data || [];
        this.llaves.set(llaves);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.showErrorAlert('Error al cargar llaves', 'No se pudieron cargar las llaves.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.llaves()];
    const search = this.searchTerm().toLowerCase();
    const estado = this.estadoFilter();

    if (search) {
      filtered = filtered.filter(l =>
        l.codigo.toLowerCase().includes(search) ||
        l.aula_codigo.toLowerCase().includes(search) ||
        l.aula_nombre.toLowerCase().includes(search)
      );
    }

    if (estado) {
      filtered = filtered.filter(l => l.estado === estado);
    }

    this.filteredLlaves.set(filtered);
    this.updatePagination();
  }

  updatePagination(): void {
    const total = Math.ceil(this.filteredLlaves().length / this.itemsPerPage);
    this.totalPages.set(total || 1);

    if (this.currentPage() > total) {
      this.currentPage.set(1);
    }
  }

  getPaginatedLlaves(): Llave[] {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredLlaves().slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(1);
    this.applyFilters();
  }

  onEstadoFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.estadoFilter.set(target.value as EstadoLlave | '');
    this.currentPage.set(1);
    this.applyFilters();
  }

  getEstadoLabel(estado: EstadoLlave): string {
    return this.estadosLlave.find(e => e.value === estado)?.label || estado;
  }

  getEstadoColor(estado: EstadoLlave): string {
    return this.estadosLlave.find(e => e.value === estado)?.color || 'gray';
  }

  confirmDelete(llave: Llave): void {
    this.llaveToDelete.set(llave);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.llaveToDelete.set(null);
  }

  deleteLlave(): void {
    const llave = this.llaveToDelete();
    if (!llave) return;

    this.llaveService.delete(llave.id).subscribe({
      next: (response) => {
        this.showSuccessAlert('Llave eliminada', 'La llave ha sido eliminada exitosamente.');
        this.showDeleteModal.set(false);
        this.llaveToDelete.set(null);
        this.loadLlaves();
      },
      error: (err) => {
        this.showErrorAlert('Error al eliminar llave', err.message || 'Ha ocurrido un error al eliminar la llave.');
        this.showDeleteModal.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.llaveToEdit.set(null);
    this.showForm.set(true);
  }

  openEditForm(llave: Llave): void {
    this.llaveToEdit.set(llave);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.llaveToEdit.set(null);
  }

  handleSave(data: LlaveCreate | { id: number; data: LlaveUpdate }): void {
    if ('id' in data) {
      // Update
      this.llaveService.update(data.id, data.data).subscribe({
        next: (response) => {
          this.showSuccessAlert('Llave actualizada', 'La llave ha sido actualizada exitosamente.');
          this.closeForm();
          this.loadLlaves();
        },
        error: (err) => {
          const errorMessage = err.message || 'Ha ocurrido un error al actualizar la llave.';
          this.showErrorAlert('Error al actualizar llave', errorMessage);
        }
      });
    } else {
      // Create
      this.llaveService.create(data).subscribe({
        next: (response) => {
          this.showSuccessAlert('Llave creada', 'La llave ha sido creada exitosamente.');
          this.closeForm();
          this.loadLlaves();
        },
        error: (err) => {
          const errorMessage = err.message || 'Ha ocurrido un error al crear la llave.';
          this.showErrorAlert('Error al crear llave', errorMessage);
        }
      });
    }
  }

  showSuccessAlert(title: string, message: string): void {
    this.alertType.set('success');
    this.alertTitle.set(title);
    this.alertMessage.set(message);
    this.showAlert.set(true);
  }

  showErrorAlert(title: string, message: string): void {
    this.alertType.set('error');
    this.alertTitle.set(title);
    this.alertMessage.set(message);
    this.showAlert.set(true);
  }

  closeAlert(): void {
    this.showAlert.set(false);
  }
}
