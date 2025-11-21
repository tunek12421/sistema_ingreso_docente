import React, { useState, useEffect } from 'react';
import { turnoService } from '../../services/api';
import TurnoForm from './TurnoForm';
import '../Docentes/Docentes.css';

const TurnosList = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    try {
      const response = await turnoService.getAll();
      setTurnos(response.data || []);
    } catch (error) {
      console.error('Error cargando turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (turno) => {
    setEditingTurno(turno);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este turno?')) {
      try {
        await turnoService.delete(id);
        fetchTurnos();
      } catch (error) {
        alert('Error eliminando turno');
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTurno(null);
    fetchTurnos();
  };

  if (loading) return <div className="loading">Cargando turnos...</div>;

  return (
    <div className="docentes-container">
      <div className="docentes-header">
        <h2>Gestión de Turnos</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nuevo Turno
        </button>
      </div>

      {showForm && (
        <TurnoForm
          turno={editingTurno}
          onClose={handleFormClose}
        />
      )}

      {turnos.length === 0 ? (
        <div className="empty-state">
          <p>No hay turnos registrados. Cree el primero.</p>
        </div>
      ) : (
        <table className="docentes-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Hora Inicio</th>
              <th>Hora Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => (
              <tr key={turno.id}>
                <td>{turno.nombre}</td>
                <td>{turno.hora_inicio}</td>
                <td>{turno.hora_fin}</td>
                <td>
                  <span className={`status ${turno.activo ? 'activo' : 'inactivo'}`}>
                    {turno.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(turno)} className="btn-edit">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(turno.id)} className="btn-delete">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TurnosList;
