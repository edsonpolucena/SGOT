import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import LGPDConsentModal from '../shared/ui/LGPDConsentModal';
import http from '../shared/services/http';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export default function ConsentGuard({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkConsent() {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const response = await http.get(`${PREFIX}/consent`);
        const { hasConsent, consentAccepted } = response.data;

        if (!hasConsent || consentAccepted === false || consentAccepted === null) {
          setShowModal(true);
        } else {
          setShowModal(false);
        }
      } catch (error) {
        console.error('Erro ao verificar consentimento:', error);
        setShowModal(true);
      } finally {
        setChecking(false);
      }
    }

    if (user) {
      checkConsent();
    } else {
      setChecking(false);
    }
  }, [user]);

  const handleAccept = () => {
    setShowModal(false);
  };

  const handleReject = () => {
    logout();
    navigate('/login', { 
      state: { 
        message: 'Para utilizar o sistema, é necessário aceitar o Termo de Consentimento conforme a LGPD.' 
      } 
    });
  };

  if (checking) {
    return null;
  }

  if (showModal) {
    return (
      <LGPDConsentModal
        onAccept={handleAccept}
        onReject={handleReject}
      />
    );
  }

  return children;
}

