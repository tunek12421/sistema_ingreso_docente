import React, { useState, useEffect } from 'react';
import { ambienteService } from '../../services/api';
import AmbienteForm from './AmbienteForm';
import './Ambientes.css';

const AmbientesList = () => {
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAmbiente, setEditingAmbiente] = useState(null);

  useEffect(() => {
    fetchAmbientes();
  }, []);

  const fetchAmbientes = async () => {
    try {
      const response = await ambienteService.getAll();
      setAmbientes(response.data || []);
    } catch (error) {
      console.error('Error cargando ambientes:', error);
      alert('Error cargando ambientes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ambiente) => {
    setEditingAmbiente(ambiente);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Esta seguro de eliminar este ambiente?')) {
      try {
        await ambienteService.delete(id);
        alert('Ambiente eliminado correctamente');
        fetchAmbientes();
      } catch (error) {
        console.error('Error eliminando ambiente:', error);
        alert('Error eliminando ambiente');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAmbiente(null);
  };

  const handleSaveSuccess = () => {
    handleCloseForm();
    fetchAmbientes();
  };

  if (loading) {
    return <div className="loading">Cargando ambientes...</div>;
  }

  return (
    <div className="ambientes-container">
      <div className="page-header">
        <h2>Gestion de Aulas/Ambientes</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Nuevo Ambiente
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Capacidad</th>
              <th>Ubicacion</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ambientes.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No hay ambientes registrados
                </td>
              </tr>
            ) : (
              ambientes.map((ambiente) => (
                <tr key={ambiente.id}>
                  <td>{ambiente.codigo}</td>
                  <td>{ambiente.nombre}</td>
                  <td>{ambiente.capacidad || 'N/A'}</td>
                  <td>{ambiente.ubicacion || 'N/A'}</td>
                  <td>
                    <span className={`badge ${ambiente.activo ? 'badge-success' : 'badge-danger'}`}>
                      {ambiente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(ambiente)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(ambiente.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AmbienteForm
          ambiente={editingAmbiente}
          onClose={handleCloseForm}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default AmbientesList;
