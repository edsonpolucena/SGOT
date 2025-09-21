import { Navigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, user } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
