import React, { useState, useEffect } from 'react';
import { llaveService, ambienteService } from '../../services/api';
import LlaveForm from './LlaveForm';
import './Llaves.css';

const LlavesList = () => {
  const [llaves, setLlaves] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLlave, setEditingLlave] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [llavesRes, ambientesRes] = await Promise.all([
        llaveService.getAll(),
        ambienteService.getAll()
      ]);
      setLlaves(llavesRes.data || []);
      setAmbientes(ambientesRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const getAmbienteNombre = (ambienteId) => {
    const ambiente = ambientes.find(a => a.id === ambienteId);
    return ambiente ? `${ambiente.codigo} - ${ambiente.nombre}` : 'N/A';
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'disponible':
        return 'badge-success';
      case 'en_uso':
        return 'badge-warning';
      case 'extraviada':
        return 'badge-danger';
      case 'inactiva':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'en_uso':
        return 'En Uso';
      case 'extraviada':
        return 'Extraviada';
      case 'inactiva':
        return 'Inactiva';
      default:
        return estado;
    }
  };

  const handleEdit = (llave) => {
    setEditingLlave(llave);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Esta seguro de eliminar esta llave?')) {
      try {
        await llaveService.delete(id);
        alert('Llave eliminada correctamente');
        fetchData();
      } catch (error) {
        console.error('Error eliminando llave:', error);
        alert('Error eliminando llave');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLlave(null);
  };

  const handleSaveSuccess = () => {
    handleCloseForm();
    fetchData();
  };

  if (loading) {
    return <div className="loading">Cargando llaves...</div>;
  }

  return (
    <div className="llaves-container">
      <div className="page-header">
        <h2>Gestion de Llaves</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Nueva Llave
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Ambiente</th>
              <th>Estado</th>
              <th>Descripcion</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {llaves.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No hay llaves registradas
                </td>
              </tr>
            ) : (
              llaves.map((llave) => (
                <tr key={llave.id}>
                  <td>{llave.codigo}</td>
                  <td>{getAmbienteNombre(llave.ambiente_id)}</td>
                  <td>
                    <span className={`badge ${getEstadoBadgeClass(llave.estado)}`}>
                      {getEstadoLabel(llave.estado)}
                    </span>
                  </td>
                  <td>{llave.descripcion || '-'}</td>
                  <td>
                    <span className={`badge ${llave.activo ? 'badge-success' : 'badge-danger'}`}>
                      {llave.activo ? 'Si' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(llave)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(llave.id)}
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
        <LlaveForm
          llave={editingLlave}
          ambientes={ambientes}
          onClose={handleCloseForm}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default LlavesList;
