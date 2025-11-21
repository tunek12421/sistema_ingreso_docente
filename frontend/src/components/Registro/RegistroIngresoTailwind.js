import React, { useState, useEffect } from 'react';
import { registroService, docenteService, asignacionService, ambienteService, turnoService, llaveService } from '../../services/api';

const RegistroIngresoTailwind = () => {
  const [ci, setCI] = useState('');
  const [docente, setDocente] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [registrosHoy, setRegistrosHoy] = useState([]);
  const [llavesDisponibles, setLlavesDisponibles] = useState([]);

  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [selectedLlave, setSelectedLlave] = useState('');

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar catálogos y registros
  useEffect(() => {
    loadCatalogos();
    loadRegistrosHoy();
  }, []);

  // Cargar llaves cuando cambia el ambiente
  useEffect(() => {
    if (selectedAmbiente) {
      loadLlavesDelAmbiente(selectedAmbiente);
    } else {
      setLlavesDisponibles([]);
      setSelectedLlave('');
    }
  }, [selectedAmbiente]);

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

  const loadRegistrosHoy = async () => {
    try {
      const res = await registroService.getRegistrosHoy();
      setRegistrosHoy(res.data || []);
    } catch (error) {
      console.error('Error cargando registros:', error);
    }
  };

  const loadLlavesDelAmbiente = async (ambienteId) => {
    try {
      const res = await llaveService.getByAmbiente(ambienteId);
      // Filtrar solo llaves disponibles
      const disponibles = (res.data || []).filter(llave => llave.estado === 'DISPONIBLE');
      setLlavesDisponibles(disponibles);
    } catch (error) {
      console.error('Error cargando llaves:', error);
      setLlavesDisponibles([]);
    }
  };

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

      try {
        const asignacionesRes = await asignacionService.getByDocenteYFecha(
          docenteData.id,
          new Date().toISOString().split('T')[0]
        );
        const asignacionesData = asignacionesRes.data || [];
        setAsignaciones(asignacionesData.filter(a => a.activo));

        if (asignacionesData.length > 0) {
          const primeraAsignacion = asignacionesData[0];
          setSelectedAmbiente(primeraAsignacion.ambiente_id);
          setSelectedTurno(primeraAsignacion.turno_id);
          if (primeraAsignacion.llave_id) {
            setSelectedLlave(primeraAsignacion.llave_id);
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
        llave_id: selectedLlave ? parseInt(selectedLlave) : null,
      };

      await registroService.registrarIngreso(data);
      setMessage({ type: 'success', text: '✓ Ingreso registrado exitosamente' });

      // Recargar registros
      await loadRegistrosHoy();

      // Limpiar formulario
      setTimeout(() => {
        setCI('');
        setDocente(null);
        setAsignaciones([]);
        setSelectedAmbiente('');
        setSelectedTurno('');
        setSelectedLlave('');
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
        llave_id: selectedLlave ? parseInt(selectedLlave) : null,
      };

      await registroService.registrarSalida(data);
      setMessage({ type: 'success', text: '✓ Salida registrada exitosamente' });

      // Recargar registros
      await loadRegistrosHoy();

      // Limpiar formulario
      setTimeout(() => {
        setCI('');
        setDocente(null);
        setAsignaciones([]);
        setSelectedAmbiente('');
        setSelectedTurno('');
        setSelectedLlave('');
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

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-6 p-6 h-full">
      {/* Formulario de Registro - Lado Izquierdo */}
      <div className="w-1/2">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-4 border-blue-500">
            📝 Registro de Ingreso/Salida
          </h2>

          {/* Búsqueda de Docente */}
          <div className="bg-gray-50 rounded-lg p-5 border-2 border-dashed border-gray-300 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 CI del Docente *
            </label>
            <div className="flex gap-3">
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
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
              <button
                type="button"
                onClick={buscarDocente}
                disabled={searching || !ci}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5 shadow-md"
              >
                {searching ? '⏳ Buscando...' : '🔍 Buscar'}
              </button>
            </div>
          </div>

          {/* Información del Docente */}
          {docente && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-5 mb-6 animate-fade-in shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                👤 {docente.nombre_completo}
              </h3>
              {asignaciones.length > 0 ? (
                <p className="text-green-700 font-medium text-sm">
                  ✅ Tiene {asignaciones.length} asignación(es) activa(s) - Datos auto-completados
                </p>
              ) : (
                <div className="bg-yellow-100 text-yellow-800 font-medium text-sm p-3 rounded-md">
                  ⚠️ Sin asignaciones para hoy - Ingreso EXCEPCIONAL
                </div>
              )}
            </div>
          )}

          {/* Campos del Formulario */}
          {docente && (
            <div className="space-y-5">
              {/* Ambiente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏢 Ambiente *
                </label>
                <select
                  value={selectedAmbiente}
                  onChange={(e) => setSelectedAmbiente(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  <p className="text-green-600 text-xs mt-1 font-medium">✓ Auto-seleccionado</p>
                )}
              </div>

              {/* Turno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏰ Turno *
                </label>
                <select
                  value={selectedTurno}
                  onChange={(e) => setSelectedTurno(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                  <p className="text-green-600 text-xs mt-1 font-medium">✓ Auto-seleccionado</p>
                )}
              </div>

              {/* Llave */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔑 Llave (Opcional)
                </label>
                <select
                  value={selectedLlave}
                  onChange={(e) => setSelectedLlave(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={!selectedAmbiente}
                >
                  <option value="">-- Sin llave --</option>
                  {llavesDisponibles.map(llave => (
                    <option key={llave.id} value={llave.id}>
                      {llave.codigo} - {llave.descripcion || 'Sin descripción'}
                    </option>
                  ))}
                </select>
                {!selectedAmbiente && (
                  <p className="text-gray-500 text-xs mt-1">Primero seleccione un ambiente</p>
                )}
                {selectedAmbiente && llavesDisponibles.length === 0 && (
                  <p className="text-yellow-600 text-xs mt-1">⚠️ No hay llaves disponibles para este ambiente</p>
                )}
                {asignaciones.length > 0 && selectedLlave && (
                  <p className="text-green-600 text-xs mt-1 font-medium">✓ Auto-seleccionada</p>
                )}
              </div>
            </div>
          )}

          {/* Mensaje */}
          {message.text && (
            <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Botones */}
          {docente && (
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleIngreso}
                disabled={loading || !selectedAmbiente || !selectedTurno}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-1 shadow-lg"
              >
                {loading ? '⏳ Registrando...' : '→ Registrar Ingreso'}
              </button>

              <button
                type="button"
                onClick={handleSalida}
                disabled={loading || !selectedAmbiente || !selectedTurno}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-1 shadow-lg"
              >
                {loading ? '⏳ Registrando...' : '← Registrar Salida'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Registros de Hoy - Lado Derecho */}
      <div className="w-1/2">
        <div className="bg-white rounded-xl shadow-lg p-8 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-3 border-b-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-800">
              📅 Registros de Hoy
            </h2>
            <button
              onClick={loadRegistrosHoy}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
            >
              🔄 Actualizar
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {registrosHoy.length === 0 ? (
              <div className="text-center text-gray-500 py-20">
                <p className="text-6xl mb-4">📋</p>
                <p className="text-lg">No hay registros para hoy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registrosHoy.map((registro) => (
                  <div
                    key={registro.id}
                    className="bg-gray-50 rounded-lg p-4 border-l-4 hover:bg-gray-100 transition"
                    style={{
                      borderLeftColor: registro.tipo === 'INGRESO' ? '#10b981' : '#ef4444'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{registro.docente_nombre}</p>
                        <p className="text-sm text-gray-600">CI: {registro.docente_ci}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        registro.tipo === 'INGRESO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {registro.tipo === 'INGRESO' ? '→ INGRESO' : '← SALIDA'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">🏢 Ambiente:</p>
                        <p className="font-medium text-gray-700">{registro.ambiente_codigo}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">⏰ Turno:</p>
                        <p className="font-medium text-gray-700">{registro.turno_nombre}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">🕐 Hora:</p>
                        <p className="font-medium text-gray-700">{formatTime(registro.fecha_hora)}</p>
                      </div>
                      {registro.es_excepcional && (
                        <div className="col-span-2">
                          <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            ⚠️ EXCEPCIONAL
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroIngresoTailwind;
