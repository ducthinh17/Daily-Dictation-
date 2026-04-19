import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Library, Repeat, Award, Settings as SettingsIcon } from 'lucide-react';
import './BottomBar.css';

export function BottomBar() {
  return (
    <nav className="bottom-bar">
      <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={24} />
        <span className="bottom-nav-label">Home</span>
      </NavLink>
      <NavLink to="/library" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Library size={24} />
        <span className="bottom-nav-label">Library</span>
      </NavLink>
      <NavLink to="/review" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Repeat size={24} />
        <span className="bottom-nav-label">Review</span>
      </NavLink>
      <NavLink to="/achievements" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Award size={24} />
        <span className="bottom-nav-label">Achieve</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <SettingsIcon size={24} />
        <span className="bottom-nav-label">Settings</span>
      </NavLink>
    </nav>
  );
}
