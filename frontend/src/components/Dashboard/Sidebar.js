import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { user } = useAuth();

  const menuItems = {
    jefe_carrera: [
      { id: 'docentes', label: 'Docentes', icon: '👨‍🏫' },
      { id: 'turnos', label: 'Turnos', icon: '🕐' },
      { id: 'llaves', label: 'Llaves', icon: '🔑' },
      { id: 'reportes', label: 'Reportes', icon: '📊' },
    ],
    bibliotecario: [
      { id: 'registro', label: 'Registro Ingreso/Salida', icon: '✍️' },
      { id: 'registros-hoy', label: 'Registros de Hoy', icon: '📅' },
    ],
    docente: [
      { id: 'mis-registros', label: 'Mis Registros', icon: '📝' },
      { id: 'mi-horario', label: 'Mi Horario', icon: '🗓️' },
    ],
  };

  const items = menuItems[user?.rol] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Menú</h3>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
