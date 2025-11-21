import React, { useState, useEffect } from 'react';
import { asignacionService } from '../../services/api';

const AsignacionForm = ({ asignacion, docentes, turnos, ambientes, llaves, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    docente_id: '',
    turno_id: '',
    ambiente_id: '',
    llave_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true,
  });

  useEffect(() => {
    if (asignacion) {
      setFormData({
        docente_id: asignacion.docente_id || '',
        turno_id: asignacion.turno_id || '',
        ambiente_id: asignacion.ambiente_id || '',
        llave_id: asignacion.llave_id || '',
        fecha_inicio: asignacion.fecha_inicio ? asignacion.fecha_inicio.split('T')[0] : '',
        fecha_fin: asignacion.fecha_fin ? asignacion.fecha_fin.split('T')[0] : '',
        activo: asignacion.activo !== undefined ? asignacion.activo : true,
      });
    }
  }, [asignacion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.docente_id || !formData.turno_id || !formData.ambiente_id || !formData.fecha_inicio) {
      alert('Docente, turno, ambiente y fecha de inicio son obligatorios');
      return;
    }

    const data = {
      docente_id: parseInt(formData.docente_id),
      turno_id: parseInt(formData.turno_id),
      ambiente_id: parseInt(formData.ambiente_id),
      llave_id: formData.llave_id ? parseInt(formData.llave_id) : null,
      fecha_inicio: formData.fecha_inicio + 'T00:00:00Z',
      fecha_fin: formData.fecha_fin ? formData.fecha_fin + 'T00:00:00Z' : null,
      activo: formData.activo,
    };

    try {
      if (asignacion) {
        await asignacionService.update(asignacion.id, data);
        alert('Asignacion actualizada correctamente');
      } else {
        await asignacionService.create(data);
        alert('Asignacion creada correctamente');
      }
      onSave();
    } catch (error) {
      console.error('Error guardando asignacion:', error);
      alert(error.response?.data?.error || 'Error guardando asignacion');
    }
  };

  // Filtrar llaves disponibles por ambiente seleccionado
  const llavesDisponibles = formData.ambiente_id
    ? llaves.filter(l => l.ambiente_id === parseInt(formData.ambiente_id) && l.estado === 'disponible')
    : [];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{asignacion ? 'Editar Asignacion' : 'Nueva Asignacion'}</h3>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Docente *</label>
            <select
              name="docente_id"
              value={formData.docente_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un docente</option>
              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docente.nombre_completo} (CI: {docente.documento_identidad})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Turno *</label>
            <select
              name="turno_id"
              value={formData.turno_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un turno</option>
              {turnos.map((turno) => (
                <option key={turno.id} value={turno.id}>
                  {turno.nombre} ({turno.hora_inicio} - {turno.hora_fin})
                </option>
              ))}
            </select>
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
            <label>Llave (Opcional)</label>
            <select
              name="llave_id"
              value={formData.llave_id}
              onChange={handleChange}
            >
              <option value="">Sin llave asignada</option>
              {llavesDisponibles.map((llave) => (
                <option key={llave.id} value={llave.id}>
                  {llave.codigo}
                </option>
              ))}
            </select>
            {formData.ambiente_id && llavesDisponibles.length === 0 && (
              <small className="form-text">No hay llaves disponibles para este ambiente</small>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha Inicio *</label>
              <input
                type="date"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Fecha Fin (Opcional)</label>
              <input
                type="date"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
              />
              <span>Asignacion activa</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {asignacion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsignacionForm;
