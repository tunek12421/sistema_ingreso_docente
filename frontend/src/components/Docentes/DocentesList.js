import React, { useState, useEffect } from 'react';
import { docenteService } from '../../services/api';
import DocenteForm from './DocenteForm';
import './Docentes.css';

const DocentesList = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDocente, setEditingDocente] = useState(null);

  useEffect(() => {
    fetchDocentes();
  }, []);

  const fetchDocentes = async () => {
    try {
      const response = await docenteService.getAll();
      setDocentes(response.data);
    } catch (error) {
      console.error('Error cargando docentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (docente) => {
    setEditingDocente(docente);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este docente?')) {
      try {
        await docenteService.delete(id);
        fetchDocentes();
      } catch (error) {
        alert('Error eliminando docente');
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDocente(null);
    fetchDocentes();
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="docentes-container">
      <div className="docentes-header">
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nuevo Docente
        </button>
      </div>

      {showForm && (
        <DocenteForm
          docente={editingDocente}
          onClose={handleFormClose}
        />
      )}

      <table className="docentes-table">
        <thead>
          <tr>
            <th>CI</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {docentes.map((docente) => (
            <tr key={docente.id}>
              <td>{docente.documento_identidad}</td>
              <td>{docente.nombre_completo}</td>
              <td>{docente.correo}</td>
              <td>{docente.telefono || 'N/A'}</td>
              <td className="actions">
                <button onClick={() => handleEdit(docente)} className="btn-edit">
                  Editar
                </button>
                <button onClick={() => handleDelete(docente.id)} className="btn-delete">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {docentes.length === 0 && (
        <div className="empty-state">No hay docentes registrados</div>
      )}
    </div>
  );
};

export default DocentesList;
