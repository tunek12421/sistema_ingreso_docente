import React, { useState, useEffect } from 'react';
import { turnoService } from '../../services/api';

const TurnoForm = ({ turno, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    hora_inicio: '',
    hora_fin: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (turno) {
      setFormData({
        nombre: turno.nombre,
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
      });
    }
  }, [turno]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Agregar segundos si no están presentes
      const data = {
        nombre: formData.nombre,
        hora_inicio: formData.hora_inicio.length === 5 ? formData.hora_inicio + ':00' : formData.hora_inicio,
        hora_fin: formData.hora_fin.length === 5 ? formData.hora_fin + ':00' : formData.hora_fin,
      };

      if (turno) {
        await turnoService.update(turno.id, data);
      } else {
        await turnoService.create(data);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error guardando turno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{turno ? 'Editar Turno' : 'Nuevo Turno'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Turno</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Mañana, Tarde, Noche"
              required
            />
          </div>

          <div className="form-group">
            <label>Hora de Inicio</label>
            <input
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio.substring(0, 5)}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Hora de Fin</label>
            <input
              type="time"
              name="hora_fin"
              value={formData.hora_fin.substring(0, 5)}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TurnoForm;
