import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <div className="header">
      <Link className="link" to="/app/obligations">Obrigações</Link>
      <Link className="link" to="/app/obligations/new">Nova</Link>
      <div className="spacer" />
      <span style={{opacity:.8, fontSize:14}}>{user?.email}</span>
      <button className="btn secondary" onClick={logout}>Sair</button>
    </div>
  );
}
