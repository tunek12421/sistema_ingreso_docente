import React, { useState } from 'react';
import { registroService } from '../../services/api';
import './Registro.css';

const RegistroIngreso = () => {
  const [ci, setCI] = useState('');
  const [llaveID, setLlaveID] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleIngreso = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {
        ci: parseInt(ci),
        llave_id: llaveID ? parseInt(llaveID) : null,
      };

      await registroService.registrarIngreso(data);
      setMessage({ type: 'success', text: 'Ingreso registrado exitosamente' });
      setCI('');
      setLlaveID('');
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
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {
        ci: parseInt(ci),
        llave_id: llaveID ? parseInt(llaveID) : null,
      };

      await registroService.registrarSalida(data);
      setMessage({ type: 'success', text: 'Salida registrada exitosamente' });
      setCI('');
      setLlaveID('');
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
        <div className="form-group">
          <label>CI del Docente</label>
          <input
            type="number"
            value={ci}
            onChange={(e) => setCI(e.target.value)}
            placeholder="Ingrese CI"
            required
          />
        </div>

        <div className="form-group">
          <label>ID de Llave (Opcional)</label>
          <input
            type="number"
            value={llaveID}
            onChange={(e) => setLlaveID(e.target.value)}
            placeholder="Ingrese ID de llave"
          />
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-actions-registro">
          <button
            type="button"
            onClick={handleIngreso}
            disabled={loading || !ci}
            className="btn-ingreso"
          >
            Registrar Ingreso
          </button>

          <button
            type="button"
            onClick={handleSalida}
            disabled={loading || !ci}
            className="btn-salida"
          >
            Registrar Salida
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistroIngreso;
