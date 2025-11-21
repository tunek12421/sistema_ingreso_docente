import React, { useState, useEffect } from 'react';
import { docenteService } from '../../services/api';

const DocenteForm = ({ docente, onClose }) => {
  const [formData, setFormData] = useState({
    documento_identidad: '',
    nombre_completo: '',
    correo: '',
    telefono: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (docente) {
      setFormData({
        documento_identidad: docente.documento_identidad,
        nombre_completo: docente.nombre_completo,
        correo: docente.correo,
        telefono: docente.telefono || '',
      });
    }
  }, [docente]);

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
      const data = {
        ...formData,
        documento_identidad: parseInt(formData.documento_identidad),
        telefono: formData.telefono ? parseInt(formData.telefono) : null,
      };

      if (docente) {
        await docenteService.update(docente.id, data);
      } else {
        await docenteService.create(data);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error guardando docente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{docente ? 'Editar Docente' : 'Nuevo Docente'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>CI</label>
            <input
              type="number"
              name="documento_identidad"
              value={formData.documento_identidad}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Correo</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="number"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocenteForm;
