import { NavLink, Outlet } from 'react-router-dom';

export function AppLayout(): JSX.Element {
  return (
    <div className="container">
      <h1>FGO Viewer</h1>
      <p className="muted">Spring Boot backend + Vite/React/TypeScript frontend.</p>

      <nav className="nav">
        <NavLink to="/servants" className={({ isActive }) => (isActive ? 'active' : '')}>Servants</NavLink>
        <NavLink to="/party" className={({ isActive }) => (isActive ? 'active' : '')}>Party</NavLink>
        <NavLink to="/enemies" className={({ isActive }) => (isActive ? 'active' : '')}>Enemies</NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
