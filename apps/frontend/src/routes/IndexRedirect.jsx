import { Navigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';

export default function IndexRedirect() {
  const { token, user } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ACCOUNTING_SUPER') {
    return <Navigate to="/dashboard" replace />;
  } else if (user?.role === 'CLIENT_NORMAL') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}