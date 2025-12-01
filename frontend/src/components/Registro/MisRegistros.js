import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registroService, docenteService, turnoService } from '../../services/api';
import './Registro.css';

const MisRegistros = () => {
  const { user } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [docenteInfo, setDocenteInfo] = useState(null);
  const [turnos, setTurnos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Primero, obtener todos los docentes y buscar el que coincida con el usuario actual
      const docentesResponse = await docenteService.getAll();
      const todosDocentes = docentesResponse.data || [];

      const miDocente = todosDocentes.find(d => d.usuario_id === user.id);

      if (!miDocente) {
        setError('No se encontró un perfil de docente asociado a este usuario');
        setLoading(false);
        return;
      }

      setDocenteInfo(miDocente);

      // Cargar mis registros
      const registrosResponse = await registroService.getByFecha(
        new Date().toISOString().split('T')[0]
      );

      // Filtrar solo los registros del docente actual
      const misRegistrosData = (registrosResponse.data || []).filter(
        r => r.docente_id === miDocente.id
      );
      setRegistros(misRegistrosData);

      // Cargar turnos para mostrar nombres
      const turnosRes = await turnoService.getAll();

      const turnosMap = {};
      (turnosRes.data || []).forEach(t => {
        turnosMap[t.id] = t;
      });

      setTurnos(turnosMap);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando mis registros');
    } finally {
      setLoading(false);
    }
  };

  const formatFechaHora = (fechaHora) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoBadge = (tipo) => {
    return tipo === 'ingreso' ? 'badge badge-success' : 'badge badge-info';
  };

  const getExcepcionalBadge = (esExcepcional) => {
    return esExcepcional ? (
      <span className="badge badge-warning" title="Registro excepcional sin asignación previa">
        ⚠️ Excepcional
      </span>
    ) : null;
  };

  if (loading) {
    return <div className="loading">Cargando mis registros...</div>;
  }

  if (error) {
    return (
      <div className="registros-hoy-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="registros-hoy-container">
      <div className="page-header">
        <div>
          <h2>Mis Registros</h2>
          {docenteInfo && (
            <p style={{ color: '#6c757d', margin: '5px 0 0 0' }}>
              {docenteInfo.nombre_completo} - CI: {docenteInfo.documento_identidad}
            </p>
          )}
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          Actualizar
        </button>
      </div>

      {registros.length === 0 ? (
        <div className="text-center">
          <p>No tienes registros para hoy</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Aula</th>
                <th>Turno</th>
                <th>Tipo</th>
                <th>Retraso</th>
                <th>Tiempo Extra</th>
                <th>Estado</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => {
                const turno = turnos[registro.turno_id];

                return (
                  <tr key={registro.id}>
                    <td>{formatFechaHora(registro.fecha_hora)}</td>
                    <td>{registro.aula_codigo || registro.aula_nombre || 'N/A'}</td>
                    <td>{turno?.nombre || `Turno ${registro.turno_id}`}</td>
                    <td>
                      <span className={getTipoBadge(registro.tipo)}>
                        {registro.tipo}
                      </span>
                    </td>
                    <td>
                      {registro.minutos_retraso > 0 ? (
                        <span className="text-danger">
                          {registro.minutos_retraso} min
                        </span>
                      ) : (
                        <span className="text-success">-</span>
                      )}
                    </td>
                    <td>
                      {registro.minutos_extra > 0 ? (
                        <span className="text-info">
                          {registro.minutos_extra} min
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td>
                      {getExcepcionalBadge(registro.es_excepcional)}
                    </td>
                    <td>
                      {registro.observaciones || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MisRegistros;
