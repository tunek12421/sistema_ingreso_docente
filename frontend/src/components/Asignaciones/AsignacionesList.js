import React, { useState, useEffect } from 'react';
import { asignacionService, docenteService, turnoService, ambienteService, llaveService } from '../../services/api';
import AsignacionForm from './AsignacionForm';
import './Asignaciones.css';

const AsignacionesList = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [llaves, setLlaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [asignacionesRes, docentesRes, turnosRes, ambientesRes, llavesRes] = await Promise.all([
        asignacionService.getAll(),
        docenteService.getAll(),
        turnoService.getAll(),
        ambienteService.getAll(),
        llaveService.getAll()
      ]);
      setAsignaciones(asignacionesRes.data || []);
      setDocentes(docentesRes.data || []);
      setTurnos(turnosRes.data || []);
      setAmbientes(ambientesRes.data || []);
      setLlaves(llavesRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const getDocenteNombre = (docenteId) => {
    const docente = docentes.find(d => d.id === docenteId);
    return docente ? docente.nombre_completo : 'N/A';
  };

  const getTurnoNombre = (turnoId) => {
    const turno = turnos.find(t => t.id === turnoId);
    return turno ? `${turno.nombre} (${turno.hora_inicio}-${turno.hora_fin})` : 'N/A';
  };

  const getAmbienteNombre = (ambienteId) => {
    const ambiente = ambientes.find(a => a.id === ambienteId);
    return ambiente ? `${ambiente.codigo} - ${ambiente.nombre}` : 'N/A';
  };

  const getLlaveCodigo = (llaveId) => {
    if (!llaveId) return 'Sin llave';
    const llave = llaves.find(l => l.id === llaveId);
    return llave ? llave.codigo : 'N/A';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const handleEdit = (asignacion) => {
    setEditingAsignacion(asignacion);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Esta seguro de eliminar esta asignacion?')) {
      try {
        await asignacionService.delete(id);
        alert('Asignacion eliminada correctamente');
        fetchData();
      } catch (error) {
        console.error('Error eliminando asignacion:', error);
        alert('Error eliminando asignacion');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAsignacion(null);
  };

  const handleSaveSuccess = () => {
    handleCloseForm();
    fetchData();
  };

  if (loading) {
    return <div className="loading">Cargando asignaciones...</div>;
  }

  return (
    <div className="asignaciones-container">
      <div className="page-header">
        <h2>Gestion de Asignaciones</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Nueva Asignacion
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>Turno</th>
              <th>Ambiente</th>
              <th>Llave</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  No hay asignaciones registradas
                </td>
              </tr>
            ) : (
              asignaciones.map((asignacion) => (
                <tr key={asignacion.id}>
                  <td>{getDocenteNombre(asignacion.docente_id)}</td>
                  <td>{getTurnoNombre(asignacion.turno_id)}</td>
                  <td>{getAmbienteNombre(asignacion.ambiente_id)}</td>
                  <td>{getLlaveCodigo(asignacion.llave_id)}</td>
                  <td>{formatFecha(asignacion.fecha_inicio)}</td>
                  <td>{formatFecha(asignacion.fecha_fin)}</td>
                  <td>
                    <span className={`badge ${asignacion.activo ? 'badge-success' : 'badge-danger'}`}>
                      {asignacion.activo ? 'Si' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(asignacion)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(asignacion.id)}
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
        <AsignacionForm
          asignacion={editingAsignacion}
          docentes={docentes}
          turnos={turnos}
          ambientes={ambientes}
          llaves={llaves}
          onClose={handleCloseForm}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default AsignacionesList;
