import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import ConsentGuard from './ConsentGuard';

export default function ProtectedRoute({ children }) {
  const { token, user } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <ConsentGuard>{children}</ConsentGuard>;
}

export function UsersProtectedRoute({ children, requiredRoles }) {
  const { user } = useAuth();
  const nav = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se é CLIENT_NORMAL - bloquear acesso a usuários
  if (user.role === 'CLIENT_NORMAL') {
    return <Navigate to="/dashboard/client" replace />;
  }

  // Verificar roles específicas se fornecidas
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
