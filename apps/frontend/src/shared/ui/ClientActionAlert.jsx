import { useEffect } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
`;

const Icon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fef3c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Message = styled.p`
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 20px;
  line-height: 1.6;
`;

const HistoryList = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
`;

const HistoryItem = styled.div`
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 3px solid ${props => props.$action === 'DOWNLOAD' ? '#3b82f6' : '#10b981'};

  &:last-child {
    margin-bottom: 0;
  }
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 0.95rem;
`;

const ActionBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 8px;
  background: ${props => props.$action === 'DOWNLOAD' ? '#dbeafe' : '#d1fae5'};
  color: ${props => props.$action === 'DOWNLOAD' ? '#1e40af' : '#065f46'};
`;

const DateTime = styled.div`
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function ClientActionAlert({ 
  isOpen, 
  onClose, 
  history = [],
  actionType = 'VIEW' // VIEW ou DOWNLOAD
}) {
  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actionLabel = actionType === 'DOWNLOAD' ? 'baixado' : 'visualizado';
  const actionLabelPlural = actionType === 'DOWNLOAD' ? 'baixados' : 'visualizados';

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (action) => {
    return action === 'DOWNLOAD' ? 'Download' : 'Visualização';
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Icon>ℹ️</Icon>
          <Title>Documento já {actionLabel}</Title>
        </Header>

        <Message>
          Este documento já foi {actionLabel} anteriormente por outro usuário cliente:
        </Message>

        {history.length > 0 ? (
          <HistoryList>
            {history.map((item) => (
              <HistoryItem key={item.id} $action={item.action}>
                <UserName>
                  <ActionBadge $action={item.action}>
                    {getActionLabel(item.action)}
                  </ActionBadge>
                  {item.userName}
                </UserName>
                <DateTime>
                  {formatDateTime(item.viewedAt)}
                </DateTime>
              </HistoryItem>
            ))}
          </HistoryList>
        ) : (
          <Message style={{ fontStyle: 'italic', color: '#9ca3af' }}>
            Nenhum histórico encontrado.
          </Message>
        )}

        <Button onClick={onClose}>
          OK
        </Button>
      </Modal>
    </Overlay>
  );
}

