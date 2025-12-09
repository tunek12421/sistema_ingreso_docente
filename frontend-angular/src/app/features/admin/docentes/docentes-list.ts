import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Docente, DocenteCreate, DocenteUpdate } from '../../../shared/models/docente.model';
import { DocenteService } from '../../../core/services/docente.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AlertModal, AlertType } from '../../../shared/components/alert-modal/alert-modal';
import { DocenteForm } from './docente-form';
import { RegistrarRostroModal } from './registrar-rostro-modal';

@Component({
  selector: 'app-docentes-list',
  imports: [CommonModule, FormsModule, LoadingSpinner, AlertModal, DocenteForm, RegistrarRostroModal],
  templateUrl: './docentes-list.html',
  styleUrl: './docentes-list.css',
})
export class DocentesList implements OnInit {
  docentes = signal<Docente[]>([]);
  filteredDocentes = signal<Docente[]>([]);
  loading = signal<boolean>(false);

  // Filtros
  searchTerm = signal<string>('');
  activoFilter = signal<boolean | ''>('');

  // Paginación
  currentPage = signal<number>(1);
  readonly itemsPerPage = 6;
  totalPages = signal<number>(1);
  readonly Math = Math;

  // Modal de confirmación
  showDeleteModal = signal<boolean>(false);
  docenteToDelete = signal<Docente | null>(null);

  // Modal de formulario
  showForm = signal<boolean>(false);
  docenteToEdit = signal<Docente | null>(null);

  // Modal de alerta
  showAlert = signal<boolean>(false);
  alertType = signal<AlertType>('success');
  alertTitle = signal<string>('');
  alertMessage = signal<string>('');

  // Modal de registrar rostro
  showRegistrarRostro = signal<boolean>(false);
  docenteParaRostro = signal<Docente | null>(null);

  constructor(private docenteService: DocenteService) {}

  ngOnInit(): void {
    this.loadDocentes();
  }

  loadDocentes(): void {
    this.loading.set(true);
    this.docenteService.getAll().subscribe({
      next: (docentes) => {
        this.docentes.set(docentes);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.showErrorAlert('Error al cargar docentes', 'No se pudieron cargar los docentes.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.docentes()];
    const search = this.searchTerm().toLowerCase();
    const activo = this.activoFilter();

    if (search) {
      filtered = filtered.filter(d =>
        d.nombre_completo.toLowerCase().includes(search) ||
        d.documento_identidad.toString().includes(search) ||
        d.correo.toLowerCase().includes(search)
      );
    }

    if (activo !== '') {
      filtered = filtered.filter(d => d.activo === activo);
    }

    this.filteredDocentes.set(filtered);
    this.updatePagination();
  }

  updatePagination(): void {
    const total = Math.ceil(this.filteredDocentes().length / this.itemsPerPage);
    this.totalPages.set(total || 1);

    if (this.currentPage() > total) {
      this.currentPage.set(1);
    }
  }

  getPaginatedDocentes(): Docente[] {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredDocentes().slice(start, end);
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

  onActivoFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.activoFilter.set(target.value === '' ? '' : target.value === 'true');
    this.currentPage.set(1);
    this.applyFilters();
  }

  confirmDelete(docente: Docente): void {
    this.docenteToDelete.set(docente);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.docenteToDelete.set(null);
  }

  deleteDocente(): void {
    const docente = this.docenteToDelete();
    if (!docente) return;

    this.docenteService.delete(docente.id).subscribe({
      next: () => {
        this.showSuccessAlert('Docente eliminado', 'El docente ha sido eliminado exitosamente.');
        this.showDeleteModal.set(false);
        this.docenteToDelete.set(null);
        this.loadDocentes();
      },
      error: (err) => {
        this.showErrorAlert('Error al eliminar docente', err.message || 'Ha ocurrido un error al eliminar el docente.');
        this.showDeleteModal.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.docenteToEdit.set(null);
    this.showForm.set(true);
  }

  openEditForm(docente: Docente): void {
    this.docenteToEdit.set(docente);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.docenteToEdit.set(null);
  }

  handleSave(data: DocenteCreate | { id: number; data: DocenteUpdate }): void {
    if ('id' in data) {
      // Update
      this.docenteService.update(data.id, data.data).subscribe({
        next: () => {
          this.showSuccessAlert('Docente actualizado', 'El docente ha sido actualizado exitosamente.');
          this.closeForm();
          this.loadDocentes();
        },
        error: (err) => {
          const errorMessage = err.message || 'Ha ocurrido un error al actualizar el docente.';
          this.showErrorAlert('Error al actualizar docente', errorMessage);
        }
      });
    } else {
      // Create
      this.docenteService.create(data).subscribe({
        next: () => {
          this.showSuccessAlert('Docente creado', 'El docente ha sido creado exitosamente.');
          this.closeForm();
          this.loadDocentes();
        },
        error: (err) => {
          const errorMessage = err.message || 'Ha ocurrido un error al crear el docente.';
          this.showErrorAlert('Error al crear docente', errorMessage);
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

  // Métodos para registrar rostro
  abrirRegistrarRostro(docente: Docente): void {
    this.docenteParaRostro.set(docente);
    this.showRegistrarRostro.set(true);
  }

  cerrarRegistrarRostro(): void {
    this.showRegistrarRostro.set(false);
    this.docenteParaRostro.set(null);
  }

  onRostroRegistrado(): void {
    this.showSuccessAlert('Rostro Registrado', 'El rostro del docente ha sido registrado exitosamente.');
    // Opcionalmente recargar la lista
    this.loadDocentes();
  }
}
