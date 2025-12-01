import React, { useState, useEffect } from 'react';
import { registroService, docenteService, turnoService } from '../../services/api';
import './Registro.css';

const RegistrosHoy = () => {
  const [registros, setRegistros] = useState([]);
  const [docentes, setDocentes] = useState({});
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

      // Cargar registros de hoy
      const registrosResponse = await registroService.getRegistrosHoy();
      const registrosData = registrosResponse.data || [];
      setRegistros(registrosData);

      // Cargar docentes, ambientes y turnos para mostrar nombres
      const [docentesRes, turnosRes] = await Promise.all([
        docenteService.getAll(),
        turnoService.getAll(),
      ]);

      // Crear mapas para búsqueda rápida
      const docentesMap = {};
      (docentesRes.data || []).forEach(d => {
        docentesMap[d.id] = d;
      });


      const turnosMap = {};
      (turnosRes.data || []).forEach(t => {
        turnosMap[t.id] = t;
      });

      setDocentes(docentesMap);
      setTurnos(turnosMap);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error cargando los registros de hoy');
    } finally {
      setLoading(false);
    }
  };

  const formatFechaHora = (fechaHora) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
    return <div className="loading">Cargando registros de hoy...</div>;
  }

  return (
    <div className="registros-hoy-container">
      <div className="page-header">
        <h2>Registros de Hoy</h2>
        <button onClick={loadData} className="btn btn-secondary">
          Actualizar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {registros.length === 0 ? (
        <div className="text-center">
          <p>No hay registros para el día de hoy</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Docente</th>
                <th>CI</th>
                <th>Aula</th>
                <th>Turno</th>
                <th>Tipo</th>
                <th>Retraso</th>
                <th>Extra</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => {
                const docente = docentes[registro.docente_id];
                const turno = turnos[registro.turno_id];

                return (
                  <tr key={registro.id}>
                    <td>{formatFechaHora(registro.fecha_hora)}</td>
                    <td>{docente?.nombre_completo || 'Desconocido'}</td>
                    <td>{docente?.documento_identidad || '-'}</td>
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

export default RegistrosHoy;
