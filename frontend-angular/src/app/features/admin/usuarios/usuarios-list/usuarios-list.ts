import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, Rol, UsuarioCreate, UsuarioUpdate } from '../../../../shared/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { UsuarioForm } from '../usuario-form/usuario-form';
import { ChangePasswordModal } from '../change-password-modal/change-password-modal';
import { AlertModal, AlertType } from '../../../../shared/components/alert-modal/alert-modal';

@Component({
  selector: 'app-usuarios-list',
  imports: [CommonModule, FormsModule, LoadingSpinner, UsuarioForm, ChangePasswordModal, AlertModal],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.css',
})
export class UsuariosList implements OnInit {
  usuarios = signal<Usuario[]>([]);
  filteredUsuarios = signal<Usuario[]>([]);
  loading = signal<boolean>(false);

  // Filtros
  searchTerm = signal<string>('');
  selectedRol = signal<string>('todos');
  selectedStatus = signal<string>('todos');

  // Paginación
  currentPage = signal<number>(1);
  readonly itemsPerPage = 6;
  totalPages = signal<number>(1);

  // Exponer Math para el template
  readonly Math = Math;

  // Modal de confirmación
  showDeleteModal = signal<boolean>(false);
  usuarioToDelete = signal<Usuario | null>(null);

  // Modal de formulario
  showForm = signal<boolean>(false);
  usuarioToEdit = signal<Usuario | null>(null);

  // Modal de cambio de contraseña
  showPasswordModal = signal<boolean>(false);
  usuarioToChangePassword = signal<Usuario | null>(null);

  // Modal de alerta
  showAlert = signal<boolean>(false);
  alertType = signal<AlertType>('success');
  alertTitle = signal<string>('');
  alertMessage = signal<string>('');

  roles: { value: string; label: string }[] = [
    { value: 'todos', label: 'Todos los roles' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'jefe_carrera', label: 'Jefe de Carrera' },
    { value: 'bibliotecario', label: 'Bibliotecario' },
    { value: 'docente', label: 'Docente' }
  ];

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading.set(true);
    this.usuarioService.getAll().subscribe({
      next: (response) => {
        this.usuarios.set(response.data || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error al cargar usuarios');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.usuarios()];

    // Filtro por búsqueda (username, nombre_completo, email)
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(search) ||
        u.nombre_completo?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      );
    }

    // Filtro por rol
    if (this.selectedRol() !== 'todos') {
      filtered = filtered.filter(u => u.rol === this.selectedRol());
    }

    // Filtro por estado
    if (this.selectedStatus() !== 'todos') {
      const isActive = this.selectedStatus() === 'activo';
      filtered = filtered.filter(u => u.activo === isActive);
    }

    this.filteredUsuarios.set(filtered);
    this.updatePagination();
  }

  updatePagination(): void {
    const total = Math.ceil(this.filteredUsuarios().length / this.itemsPerPage);
    this.totalPages.set(total || 1);
    if (this.currentPage() > total) {
      this.currentPage.set(1);
    }
  }

  getPaginatedUsuarios(): Usuario[] {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsuarios().slice(start, end);
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

  onRolChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedRol.set(value);
    this.applyFilters();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
    this.applyFilters();
  }

  toggleUserStatus(usuario: Usuario): void {
    const newStatus = !usuario.activo;
    const action = newStatus ? 'activado' : 'desactivado';

    this.usuarioService.toggleStatus(usuario.id).subscribe({
      next: () => {
        usuario.activo = newStatus;
        this.showSuccessAlert(`Usuario ${action}`, `El usuario ha sido ${action} exitosamente.`);
        this.applyFilters();
      },
      error: (err) => {
        this.showErrorAlert(`Error al ${action === 'activado' ? 'activar' : 'desactivar'} usuario`, err.message || 'Ha ocurrido un error.');
      }
    });
  }

  confirmDelete(usuario: Usuario): void {
    this.usuarioToDelete.set(usuario);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.usuarioToDelete.set(null);
  }

  deleteUsuario(): void {
    const usuario = this.usuarioToDelete();
    if (!usuario) return;

    this.usuarioService.delete(usuario.id).subscribe({
      next: () => {
        this.showSuccessAlert('Usuario eliminado', 'El usuario ha sido eliminado exitosamente.');
        this.showDeleteModal.set(false);
        this.usuarioToDelete.set(null);
        this.loadUsuarios();
      },
      error: (err) => {
        this.showErrorAlert('Error al eliminar usuario', err.message || 'Ha ocurrido un error al eliminar el usuario.');
        this.showDeleteModal.set(false);
      }
    });
  }

  getRolBadgeClass(rol: Rol): string {
    const classes: Record<Rol, string> = {
      'administrador': 'bg-red-100 text-red-800',
      'jefe_carrera': 'bg-blue-100 text-blue-800',
      'bibliotecario': 'bg-green-100 text-green-800',
      'becario': 'bg-orange-100 text-orange-800',
      'docente': 'bg-purple-100 text-purple-800'
    };
    return classes[rol];
  }

  getRolLabel(rol: Rol): string {
    const labels: Record<Rol, string> = {
      'administrador': 'Administrador',
      'jefe_carrera': 'Jefe de Carrera',
      'bibliotecario': 'Bibliotecario',
      'becario': 'Becario',
      'docente': 'Docente'
    };
    return labels[rol];
  }

  openCreateForm(): void {
    this.usuarioToEdit.set(null);
    this.showForm.set(true);
  }

  openEditForm(usuario: Usuario): void {
    this.usuarioToEdit.set(usuario);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.usuarioToEdit.set(null);
  }

  handleSave(data: UsuarioCreate | { id: number; data: UsuarioUpdate }): void {
    if ('id' in data) {
      // Update
      this.usuarioService.update(data.id, data.data).subscribe({
        next: () => {
          this.showSuccessAlert('Usuario actualizado', 'El usuario ha sido actualizado exitosamente.');
          this.closeForm();
          this.loadUsuarios();
        },
        error: (err) => {
          this.showErrorAlert('Error al actualizar usuario', err.message || 'Ha ocurrido un error al actualizar el usuario.');
        }
      });
    } else {
      // Create
      this.usuarioService.create(data).subscribe({
        next: () => {
          this.showSuccessAlert('Usuario creado', 'El usuario ha sido creado exitosamente.');
          this.closeForm();
          this.loadUsuarios();
        },
        error: (err) => {
          this.showErrorAlert('Error al crear usuario', err.message || 'Ha ocurrido un error al crear el usuario.');
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

  openPasswordModal(usuario: Usuario): void {
    this.usuarioToChangePassword.set(usuario);
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.usuarioToChangePassword.set(null);
  }

  handlePasswordChange(data: { userId: number; newPassword: string }): void {
    this.usuarioService.changePassword(data.userId, { new_password: data.newPassword }).subscribe({
      next: () => {
        this.showSuccessAlert('Contraseña actualizada', 'La contraseña ha sido cambiada exitosamente.');
        this.closePasswordModal();
      },
      error: (err) => {
        this.showErrorAlert('Error al cambiar contraseña', err.message || 'Ha ocurrido un error al cambiar la contraseña.');
        this.closePasswordModal();
      }
    });
  }
}
