import { useState } from 'react';
import styled from 'styled-components';
import http from '../services/http';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 2px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

const Content = styled.div`
  padding: 24px;
`;

const Text = styled.p`
  margin: 16px 0;
  line-height: 1.6;
  color: #374151;
  font-size: 15px;
`;

const List = styled.ul`
  margin: 16px 0;
  padding-left: 24px;
  color: #374151;
  line-height: 1.8;
`;

const ListItem = styled.li`
  margin: 8px 0;
`;

const Actions = styled.div`
  padding: 20px 24px;
  border-top: 2px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AcceptButton = styled(Button)`
  background: #10b981;
  color: white;

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
`;

const RejectButton = styled(Button)`
  background: #ef4444;
  color: white;

  &:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
`;

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export default function LGPDConsentModal({ onAccept, onReject }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await http.post(`${PREFIX}/consent`, { consentAccepted: true });
      onAccept();
    } catch (error) {
      console.error('Erro ao salvar consentimento:', error);
      alert('Erro ao salvar consentimento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await http.post(`${PREFIX}/consent`, { consentAccepted: false });
      onReject();
    } catch (error) {
      console.error('Erro ao salvar recusa:', error);
      onReject();
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Tratamento de Dados Pessoais – LGPD</Title>
        </Header>
        <Content>
          <Text>
            Para continuar usando o sistema, você precisa autorizar o uso dos seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD – Lei 13.709/2018).
          </Text>

          <Text>
            <strong>Seus dados serão utilizados para:</strong>
          </Text>
          <List>
            <ListItem>Criar e manter sua conta;</ListItem>
            <ListItem>Controlar obrigações, documentos e atividades dentro do sistema;</ListItem>
            <ListItem>Enviar notificações importantes;</ListItem>
            <ListItem>Garantir segurança, autenticação e auditoria.</ListItem>
          </List>

          <Text>
            Seus dados não serão vendidos, e só serão compartilhados quando necessário para cumprir questões legais ou operacionais.
          </Text>

          <Text>
            Você pode solicitar acesso, correção ou exclusão dos seus dados quando desejar.
          </Text>

          <Text style={{ marginTop: '24px', padding: '16px', background: '#f3f4f6', borderRadius: '8px', fontWeight: '600' }}>
            Ao clicar em "Concordo", você autoriza o tratamento dos dados conforme este termo.
          </Text>
        </Content>
        <Actions>
          <RejectButton onClick={handleReject} disabled={loading}>
            Não concordo
          </RejectButton>
          <AcceptButton onClick={handleAccept} disabled={loading}>
            {loading ? 'Processando...' : 'Concordo'}
          </AcceptButton>
        </Actions>
      </Modal>
    </Overlay>
  );
}

