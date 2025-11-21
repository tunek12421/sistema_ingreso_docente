import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import DocentesList from '../Docentes/DocentesList';
import RegistroIngresoTailwind from '../Registro/RegistroIngresoTailwind';
import RegistrosHoy from '../Registro/RegistrosHoy';
import MisRegistros from '../Registro/MisRegistros';
import TurnosList from '../Turnos/TurnosList';
import AmbientesList from '../Ambientes/AmbientesList';
import LlavesList from '../Llaves/LlavesList';
import AsignacionesList from '../Asignaciones/AsignacionesList';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(() => {
    // Determinar sección inicial según el rol
    if (user?.rol === 'jefe_carrera') return 'docentes';
    if (user?.rol === 'bibliotecario') return 'registro';
    if (user?.rol === 'docente') return 'mis-registros';
    return 'inicio';
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      // Jefe de Carrera
      case 'docentes':
        return <DocentesList />;
      case 'turnos':
        return <TurnosList />;
      case 'ambientes':
        return <AmbientesList />;
      case 'llaves':
        return <LlavesList />;
      case 'asignaciones':
        return <AsignacionesList />;
      case 'reportes':
        return <div className="placeholder"><h3>Reportes y Estadísticas</h3><p>En desarrollo...</p></div>;

      // Bibliotecario
      case 'registro':
        return <RegistroIngresoTailwind />;
      case 'registros-hoy':
        return <RegistrosHoy />;

      // Docente
      case 'mis-registros':
        return <MisRegistros />;
      case 'mi-horario':
        return <div className="placeholder"><h3>Mi Horario</h3><p>En desarrollo...</p></div>;

      default:
        return <div className="placeholder"><h3>Bienvenido al Sistema</h3><p>Seleccione una opción del menú</p></div>;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="dashboard-main">
        <nav className="navbar">
          <div className="navbar-brand">Sistema de Ingreso Docente</div>
          <div className="navbar-user">
            <span>{user?.username} ({user?.rol})</span>
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </nav>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
