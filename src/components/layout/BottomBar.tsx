import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Library, Repeat, Award, BarChart3 } from 'lucide-react';
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
      <NavLink to="/progress" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <BarChart3 size={24} />
        <span className="bottom-nav-label">Progress</span>
      </NavLink>
      <NavLink to="/review" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Repeat size={24} />
        <span className="bottom-nav-label">Review</span>
      </NavLink>
      <NavLink to="/achievements" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Award size={24} />
        <span className="bottom-nav-label">Achieve</span>
      </NavLink>
    </nav>
  );
}
