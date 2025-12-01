import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turno, TurnoCreate, TurnoUpdate } from '../../../shared/models/turno.model';
import { TurnoService } from '../../../core/services/turno.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AlertModal, AlertType } from '../../../shared/components/alert-modal/alert-modal';
import { TurnoForm } from './turno-form';

@Component({
  selector: 'app-turnos-list',
  imports: [CommonModule, FormsModule, LoadingSpinner, AlertModal, TurnoForm],
  templateUrl: './turnos-list.html',
  styleUrl: './turnos-list.css',
})
export class TurnosList implements OnInit {
  turnos = signal<Turno[]>([]);
  filteredTurnos = signal<Turno[]>([]);
  loading = signal<boolean>(false);

  // Filtros
  searchTerm = signal<string>('');

  // Paginación
  currentPage = signal<number>(1);
  readonly itemsPerPage = 6;
  totalPages = signal<number>(1);
  readonly Math = Math;

  // Modal de confirmación
  showDeleteModal = signal<boolean>(false);
  turnoToDelete = signal<Turno | null>(null);

  // Modal de formulario
  showForm = signal<boolean>(false);
  turnoToEdit = signal<Turno | null>(null);

  // Modal de alerta
  showAlert = signal<boolean>(false);
  alertType = signal<AlertType>('success');
  alertTitle = signal<string>('');
  alertMessage = signal<string>('');

  constructor(private turnoService: TurnoService) {}

  ngOnInit(): void {
    this.loadTurnos();
  }

  loadTurnos(): void {
    this.loading.set(true);
    this.turnoService.getAll().subscribe({
      next: (response) => {
        const turnos = response.data || [];
        this.turnos.set(turnos);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.showErrorAlert('Error al cargar turnos', 'No se pudieron cargar los turnos.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.turnos()];
    const search = this.searchTerm().toLowerCase();

    if (search) {
      filtered = filtered.filter(t =>
        t.nombre.toLowerCase().includes(search)
      );
    }

    this.filteredTurnos.set(filtered);
    this.updatePagination();
  }

  updatePagination(): void {
    const total = Math.ceil(this.filteredTurnos().length / this.itemsPerPage);
    this.totalPages.set(total || 1);

    if (this.currentPage() > total) {
      this.currentPage.set(1);
    }
  }

  getPaginatedTurnos(): Turno[] {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredTurnos().slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyFilters();
  }

  confirmDelete(turno: Turno): void {
    this.turnoToDelete.set(turno);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.turnoToDelete.set(null);
  }

  deleteTurno(): void {
    const turno = this.turnoToDelete();
    if (!turno) return;

    this.turnoService.delete(turno.id).subscribe({
      next: (response) => {
        this.showSuccessAlert('Turno eliminado', 'El turno ha sido eliminado exitosamente.');
        this.showDeleteModal.set(false);
        this.turnoToDelete.set(null);
        this.loadTurnos();
      },
      error: (err) => {
        this.showErrorAlert('Error al eliminar turno', err.message || 'Ha ocurrido un error al eliminar el turno.');
        this.showDeleteModal.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.turnoToEdit.set(null);
    this.showForm.set(true);
  }

  openEditForm(turno: Turno): void {
    this.turnoToEdit.set(turno);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.turnoToEdit.set(null);
  }

  handleSave(data: TurnoCreate | { id: number; data: TurnoUpdate }): void {
    if ('id' in data) {
      // Update
      this.turnoService.update(data.id, data.data).subscribe({
        next: (response) => {
          this.showSuccessAlert('Turno actualizado', 'El turno ha sido actualizado exitosamente.');
          this.closeForm();
          this.loadTurnos();
        },
        error: (err) => {
          this.showErrorAlert('Error al actualizar turno', err.message || 'Ha ocurrido un error al actualizar el turno.');
        }
      });
    } else {
      // Create
      this.turnoService.create(data).subscribe({
        next: (response) => {
          this.showSuccessAlert('Turno creado', 'El turno ha sido creado exitosamente.');
          this.closeForm();
          this.loadTurnos();
        },
        error: (err) => {
          this.showErrorAlert('Error al crear turno', err.message || 'Ha ocurrido un error al crear el turno.');
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

  formatTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    // Usar UTC para evitar conversión de zona horaria
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
  }
}
