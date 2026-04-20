import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Library, Repeat, Award, Settings as SettingsIcon, Sun, Moon, Bookmark, Target, Activity } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import './Sidebar.css';

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="Logo" className="sidebar-logo" />
        <span className="sidebar-brand">Dictination</span>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={20} />
          <span>Reports</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Library size={20} />
          <span>Library</span>
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Repeat size={20} />
          <span>Review</span>
        </NavLink>
        <NavLink to="/bookmarks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Bookmark size={20} />
          <span>Bookmarks</span>
        </NavLink>
        <NavLink to="/quests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Target size={20} />
          <span>Quests</span>
        </NavLink>
        <NavLink to="/achievements" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Award size={20} />
          <span>Achievements</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item theme-toggle-btn" onClick={toggleTheme} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <SettingsIcon size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
