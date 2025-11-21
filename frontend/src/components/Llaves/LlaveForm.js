import React, { useState, useEffect } from 'react';
import { llaveService } from '../../services/api';

const LlaveForm = ({ llave, ambientes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    ambiente_id: '',
    estado: 'disponible',
    descripcion: '',
  });

  useEffect(() => {
    if (llave) {
      setFormData({
        codigo: llave.codigo || '',
        ambiente_id: llave.ambiente_id || '',
        estado: llave.estado || 'disponible',
        descripcion: llave.descripcion || '',
      });
    }
  }, [llave]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo.trim() || !formData.ambiente_id) {
      alert('Codigo y ambiente son obligatorios');
      return;
    }

    const data = {
      codigo: formData.codigo.trim(),
      ambiente_id: parseInt(formData.ambiente_id),
      estado: formData.estado,
      descripcion: formData.descripcion.trim() || null,
    };

    try {
      if (llave) {
        await llaveService.update(llave.id, data);
        alert('Llave actualizada correctamente');
      } else {
        await llaveService.create(data);
        alert('Llave creada correctamente');
      }
      onSave();
    } catch (error) {
      console.error('Error guardando llave:', error);
      alert(error.response?.data?.error || 'Error guardando llave');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{llave ? 'Editar Llave' : 'Nueva Llave'}</h3>
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
              placeholder="Ej: L-A101"
              required
              disabled={llave ? true : false}
            />
            {llave && (
              <small className="form-text">El codigo no se puede modificar</small>
            )}
          </div>

          <div className="form-group">
            <label>Ambiente *</label>
            <select
              name="ambiente_id"
              value={formData.ambiente_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un ambiente</option>
              {ambientes.map((ambiente) => (
                <option key={ambiente.id} value={ambiente.id}>
                  {ambiente.codigo} - {ambiente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Estado *</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="disponible">Disponible</option>
              <option value="en_uso">En Uso</option>
              <option value="extraviada">Extraviada</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descripcion</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Informacion adicional sobre la llave"
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {llave ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LlaveForm;
