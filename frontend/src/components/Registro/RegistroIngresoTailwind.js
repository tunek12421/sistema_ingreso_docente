import React, { useState, useEffect } from 'react';
import { registroService, docenteService, turnoService, llaveService } from '../../services/api';

const RegistroIngresoTailwind = () => {
  const [ci, setCI] = useState('');
  const [docente, setDocente] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [registrosHoy, setRegistrosHoy] = useState([]);
  const [llaves, setLlaves] = useState([]);
  const [selectedLlave, setSelectedLlave] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCatalogos();
    loadRegistrosHoy();
    loadLlavesDisponibles();
  }, []);

  const loadCatalogos = async () => {
    try {
      const turnosRes = await turnoService.getAll();
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

  const loadLlavesDisponibles = async () => {
    try {
      const res = await llaveService.getAll();
      const disponibles = (res.data || []).filter(llave => llave.estado && llave.estado.toLowerCase() === 'disponible');
      setLlaves(disponibles);
    } catch (error) {
      console.error('Error cargando llaves:', error);
      setLlaves([]);
    }
  };

  const buscarDocente = async () => {
    if (!ci) return;
    setSearching(true);
    setMessage({ type: '', text: '' });
    setDocente(null);
    setSelectedLlave('');
    setSelectedTurno('');
    try {
      const docenteRes = await docenteService.getByCI(parseInt(ci));
      setDocente(docenteRes.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Docente no encontrado' });
    } finally {
      setSearching(false);
    }
  };

  const handleIngreso = async (e) => {
    e.preventDefault();
    if (!docente || !selectedLlave || !selectedTurno) {
      setMessage({ type: 'error', text: 'Complete todos los campos obligatorios' });
      return;
    }
    setLoading(true);
    try {
      await registroService.registrarIngreso({
        ci: parseInt(ci),
        turno_id: parseInt(selectedTurno),
        llave_id: parseInt(selectedLlave),
        observaciones: observaciones || null,
      });
      setMessage({ type: 'success', text: 'Ingreso registrado exitosamente' });
      await loadRegistrosHoy();
      await loadLlavesDisponibles();
      setTimeout(() => {
        setCI(''); setDocente(null); setSelectedTurno(''); setSelectedLlave(''); setObservaciones(''); setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error registrando ingreso' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalida = async (e) => {
    e.preventDefault();
    if (!docente || !selectedLlave || !selectedTurno) {
      setMessage({ type: 'error', text: 'Complete todos los campos obligatorios' });
      return;
    }
    setLoading(true);
    try {
      await registroService.registrarSalida({
        ci: parseInt(ci),
        turno_id: parseInt(selectedTurno),
        llave_id: parseInt(selectedLlave),
        observaciones: observaciones || null,
      });
      setMessage({ type: 'success', text: 'Salida registrada exitosamente' });
      await loadRegistrosHoy();
      await loadLlavesDisponibles();
      setTimeout(() => {
        setCI(''); setDocente(null); setSelectedTurno(''); setSelectedLlave(''); setObservaciones(''); setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error registrando salida' });
    } finally {
      setLoading(false);
    }
  };

  const formatTurnoTime = (time) => {
    if (!time) return '';
    if (time.includes('T')) return new Date(time).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    return time.substring(0, 5);
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Registro de Ingreso/Salida</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Docente por CI</label>
                <div className="flex gap-3">
                  <input type="number" value={ci} onChange={(e) => setCI(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && buscarDocente()} placeholder="Ingrese el CI del docente" className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={buscarDocente} disabled={searching || !ci} className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50">{searching ? 'Buscando...' : 'Buscar'}</button>
                </div>
              </div>
              {docente && (<div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5 mb-6"><h3 className="text-lg font-semibold text-blue-900">{docente.nombre_completo}</h3><p className="text-sm text-blue-700">CI: {docente.documento_identidad}</p></div>)}
              {docente && (<div className="space-y-5"><div><label className="block text-sm font-medium text-gray-700 mb-2">Llave *</label><select value={selectedLlave} onChange={(e) => setSelectedLlave(e.target.value)} className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg" required><option value="">-- Seleccione una llave --</option>{llaves.map(llave => (<option key={llave.id} value={llave.id}>{llave.codigo} - {llave.aula_nombre} ({llave.aula_codigo})</option>))}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Turno *</label><select value={selectedTurno} onChange={(e) => setSelectedTurno(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" required><option value="">-- Seleccione un turno --</option>{turnos.map(turno => (<option key={turno.id} value={turno.id}>{turno.nombre} ({formatTurnoTime(turno.hora_inicio)} - {formatTurnoTime(turno.hora_fin)})</option>))}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" rows="3" /></div>{message.text && (<div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>)}<div className="flex gap-4 pt-4"><button onClick={handleIngreso} disabled={loading} className="flex-1 px-6 py-4 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:opacity-50">{loading ? 'Procesando...' : 'REGISTRAR INGRESO'}</button><button onClick={handleSalida} disabled={loading} className="flex-1 px-6 py-4 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50">{loading ? 'Procesando...' : 'REGISTRAR SALIDA'}</button></div></div>)}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Registros de Hoy ({registrosHoy.length})</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {registrosHoy.map((registro) => (<div key={registro.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500"><div className="flex justify-between items-start mb-2"><h3 className="font-semibold text-gray-800 text-sm">{registro.docente_nombre}</h3><span className={`text-xs px-2 py-1 rounded font-bold ${registro.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{registro.tipo === 'ingreso' ? 'INGRESO' : 'SALIDA'}</span></div><div className="grid grid-cols-2 gap-2 text-sm"><div><p className="text-gray-500">Aula:</p><p className="font-medium text-gray-700">{registro.aula_codigo || registro.aula_nombre || 'N/A'}</p></div><div><p className="text-gray-500">Turno:</p><p className="font-medium text-gray-700">{registro.turno_nombre}</p></div><div><p className="text-gray-500">Hora:</p><p className="font-medium text-gray-700">{formatTime(registro.fecha_hora)}</p></div></div></div>))}
                {registrosHoy.length === 0 && (<p className="text-center text-gray-500 py-8">No hay registros hoy</p>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroIngresoTailwind;
