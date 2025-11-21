import React, { useState, useEffect } from 'react';
import { ambienteService } from '../../services/api';

const AmbienteForm = ({ ambiente, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    capacidad: '',
    ubicacion: '',
  });

  useEffect(() => {
    if (ambiente) {
      setFormData({
        codigo: ambiente.codigo || '',
        nombre: ambiente.nombre || '',
        capacidad: ambiente.capacidad || '',
        ubicacion: ambiente.ubicacion || '',
      });
    }
  }, [ambiente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      alert('Codigo y nombre son obligatorios');
      return;
    }

    const data = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      capacidad: formData.capacidad ? parseInt(formData.capacidad) : 0,
      ubicacion: formData.ubicacion.trim(),
    };

    try {
      if (ambiente) {
        await ambienteService.update(ambiente.id, data);
        alert('Ambiente actualizado correctamente');
      } else {
        await ambienteService.create(data);
        alert('Ambiente creado correctamente');
      }
      onSave();
    } catch (error) {
      console.error('Error guardando ambiente:', error);
      alert(error.response?.data?.error || 'Error guardando ambiente');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{ambiente ? 'Editar Ambiente' : 'Nuevo Ambiente'}</h3>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Codigo *</label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="Ej: A101"
              required
              disabled={ambiente ? true : false}
            />
            {ambiente && (
              <small className="form-text">El codigo no se puede modificar</small>
            )}
          </div>

          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Laboratorio de Computo 1"
              required
            />
          </div>

          <div className="form-group">
            <label>Capacidad</label>
            <input
              type="number"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleChange}
              placeholder="Numero de personas"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Ubicacion</label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Edificio A - Piso 1"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {ambiente ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AmbienteForm;
