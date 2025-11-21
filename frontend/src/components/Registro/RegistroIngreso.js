import React, { useState, useEffect } from 'react';
import { registroService, docenteService, asignacionService, ambienteService, turnoService } from '../../services/api';
import './Registro.css';

const RegistroIngreso = () => {
  const [ci, setCI] = useState('');
  const [docente, setDocente] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [turnos, setTurnos] = useState([]);

  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [llaveID, setLlaveID] = useState('');

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar catálogos
  useEffect(() => {
    loadCatalogos();
  }, []);

  const loadCatalogos = async () => {
    try {
      const [ambientesRes, turnosRes] = await Promise.all([
        ambienteService.getAll(),
        turnoService.getAll(),
      ]);
      setAmbientes(ambientesRes.data || []);
      setTurnos(turnosRes.data || []);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  // Buscar docente por CI
  const buscarDocente = async () => {
    if (!ci) return;

    setSearching(true);
    setMessage({ type: '', text: '' });
    setDocente(null);
    setAsignaciones([]);

    try {
      const docenteRes = await docenteService.getByCI(parseInt(ci));
      const docenteData = docenteRes.data;
      setDocente(docenteData);

      // Buscar la llave actual del docente (para salidas automáticas)
      try {
        const llaveActualRes = await registroService.getLlaveActual(docenteData.id);
        if (llaveActualRes.data && llaveActualRes.data.llave_id) {
          setLlaveID(llaveActualRes.data.llave_id);
          console.log('Llave actual detectada:', llaveActualRes.data.llave_id);
        }
      } catch (err) {
        console.log('No se encontró llave actual');
      }

      // Buscar asignaciones del docente
      try {
        const asignacionesRes = await asignacionService.getByDocenteYFecha(
          docenteData.id,
          new Date().toISOString().split('T')[0]
        );
        const asignacionesData = asignacionesRes.data || [];
        setAsignaciones(asignacionesData.filter(a => a.activo));

        if (asignacionesData.length > 0) {
          // Auto-seleccionar la primera asignación
          const primeraAsignacion = asignacionesData[0];
          setSelectedAmbiente(primeraAsignacion.ambiente_id);
          setSelectedTurno(primeraAsignacion.turno_id);
          // Solo usar la llave de la asignación si no hay una llave actual detectada
          if (!llaveID && primeraAsignacion.llave_id) {
            setLlaveID(primeraAsignacion.llave_id);
          }
        }
      } catch (err) {
        console.log('Sin asignaciones encontradas');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Docente no encontrado',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleIngreso = async (e) => {
    e.preventDefault();

    if (!docente) {
      setMessage({ type: 'error', text: 'Primero busque al docente' });
      return;
    }

    if (!selectedAmbiente || !selectedTurno) {
      setMessage({ type: 'error', text: 'Debe seleccionar ambiente y turno' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {
        ci: parseInt(ci),
        ambiente_id: parseInt(selectedAmbiente),
        turno_id: parseInt(selectedTurno),
        llave_id: llaveID ? parseInt(llaveID) : null,
      };

      await registroService.registrarIngreso(data);
      setMessage({ type: 'success', text: '✓ Ingreso registrado exitosamente' });

      // Limpiar formulario
      setTimeout(() => {
        setCI('');
        setDocente(null);
        setAsignaciones([]);
        setSelectedAmbiente('');
        setSelectedTurno('');
        setLlaveID('');
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error registrando ingreso',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalida = async (e) => {
    e.preventDefault();

    if (!docente) {
      setMessage({ type: 'error', text: 'Primero busque al docente' });
      return;
    }

    if (!selectedAmbiente || !selectedTurno) {
      setMessage({ type: 'error', text: 'Debe seleccionar ambiente y turno' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {
        ci: parseInt(ci),
        ambiente_id: parseInt(selectedAmbiente),
        turno_id: parseInt(selectedTurno),
        llave_id: llaveID ? parseInt(llaveID) : null,
      };

      await registroService.registrarSalida(data);
      setMessage({ type: 'success', text: '✓ Salida registrada exitosamente' });

      // Limpiar formulario
      setTimeout(() => {
        setCI('');
        setDocente(null);
        setAsignaciones([]);
        setSelectedAmbiente('');
        setSelectedTurno('');
        setLlaveID('');
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error registrando salida',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-container">
      <form className="registro-form">
        <h3>Registro de Ingreso/Salida</h3>

        <div className="search-container">
          <div className="search-input-group">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>🔍 CI del Docente *</label>
              <input
                type="number"
                value={ci}
                onChange={(e) => setCI(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarDocente();
                  }
                }}
                placeholder="Ingrese el CI del docente"
                required
              />
            </div>
            <button
              type="button"
              onClick={buscarDocente}
              disabled={searching || !ci}
              className="btn btn-secondary"
            >
              {searching ? '⏳ Buscando...' : '🔍 Buscar Docente'}
            </button>
          </div>
        </div>

        {docente && (
          <div className="docente-info">
            <h4>👤 Docente: {docente.nombre_completo}</h4>
            {asignaciones.length > 0 ? (
              <p className="info-asignacion">
                ✅ Tiene {asignaciones.length} asignación(es) activa(s) - Datos auto-completados
              </p>
            ) : (
              <p className="warning-asignacion">
                ⚠️ Sin asignaciones para hoy - Ingreso EXCEPCIONAL (requiere selección manual de ambiente y turno)
              </p>
            )}
          </div>
        )}

        {docente && (
          <>
            <div className="form-group">
              <label>🏢 Ambiente *</label>
              <select
                value={selectedAmbiente}
                onChange={(e) => setSelectedAmbiente(e.target.value)}
                required
              >
                <option value="">-- Seleccione un ambiente --</option>
                {ambientes.map(amb => (
                  <option key={amb.id} value={amb.id}>
                    {amb.codigo} - {amb.nombre}
                  </option>
                ))}
              </select>
              {asignaciones.length > 0 && (
                <small className="form-text">
                  ✓ Auto-seleccionado desde asignación
                </small>
              )}
            </div>

            <div className="form-group">
              <label>⏰ Turno *</label>
              <select
                value={selectedTurno}
                onChange={(e) => setSelectedTurno(e.target.value)}
                required
              >
                <option value="">-- Seleccione un turno --</option>
                {turnos.map(turno => (
                  <option key={turno.id} value={turno.id}>
                    {turno.nombre} ({turno.hora_inicio} - {turno.hora_fin})
                  </option>
                ))}
              </select>
              {asignaciones.length > 0 && (
                <small className="form-text">
                  ✓ Auto-seleccionado desde asignación
                </small>
              )}
            </div>

            <div className="form-group">
              <label>🔑 ID de Llave</label>
              <input
                type="number"
                value={llaveID}
                onChange={(e) => setLlaveID(e.target.value)}
                placeholder="Ingrese el ID de la llave (opcional)"
              />
              {llaveID && (
                <small className="form-text" style={{ color: '#28a745' }}>
                  ✓ Llave detectada automáticamente
                </small>
              )}
            </div>
          </>
        )}

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {docente && (
          <div className="form-actions-registro">
            <button
              type="button"
              onClick={handleIngreso}
              disabled={loading || !selectedAmbiente || !selectedTurno}
              className="btn-ingreso"
            >
              {loading ? '⏳ Registrando...' : 'Registrar Ingreso'}
            </button>

            <button
              type="button"
              onClick={handleSalida}
              disabled={loading || !selectedAmbiente || !selectedTurno}
              className="btn-salida"
            >
              {loading ? '⏳ Registrando...' : 'Registrar Salida'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default RegistroIngreso;
