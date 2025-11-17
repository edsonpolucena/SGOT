// Importando componentes compartilhados para evitar duplicação
export {
  Container,
  Header,
  Title,
  FiltersContainer,
  FilterInput,
  FilterSelect,
  FilterButton,
  ClearButton,
  ExportActions,
  ExportButton,
  Table,
  Th,
  Td,
  LoadingMessage,
  ErrorMessage,
  EmptyMessage,
  Pagination
} from '../../../shared/styles/CommonTable.styles';

import styled from 'styled-components';

// Componentes específicos de AuditLog (badges de ações e entidades)
export const ActionBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$action) {
      case 'CREATE': return '#dcfce7';
      case 'UPDATE': return '#dbeafe';
      case 'DELETE': return '#fee2e2';
      case 'VIEW': return '#fef3c7';
      case 'DOWNLOAD': return '#e0e7ff';
      case 'UPLOAD': return '#d1fae5';
      case 'LOGIN': return '#f3e8ff';
      case 'LOGOUT': return '#e5e7eb';
      case 'STATUS_CHANGE': return '#fce7f3';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$action) {
      case 'CREATE': return '#166534';
      case 'UPDATE': return '#1e40af';
      case 'DELETE': return '#991b1b';
      case 'VIEW': return '#92400e';
      case 'DOWNLOAD': return '#3730a3';
      case 'UPLOAD': return '#065f46';
      case 'LOGIN': return '#6b21a8';
      case 'LOGOUT': return '#4b5563';
      case 'STATUS_CHANGE': return '#9f1239';
      default: return '#6b7280';
    }
  }};
`;

export const EntityBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$entity) {
      case 'Obligation': return '#e0f2fe';
      case 'User': return '#f3e8ff';
      case 'ObligationFile': return '#fef3c7';
      case 'Company': return '#dcfce7';
      case 'Auth': return '#ede9fe';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$entity) {
      case 'Obligation': return '#075985';
      case 'User': return '#6b21a8';
      case 'ObligationFile': return '#92400e';
      case 'Company': return '#166534';
      case 'Auth': return '#5b21b6';
      default: return '#6b7280';
    }
  }};
`;

export const MetadataButton = styled.button`
  padding: 4px 8px;
  background: #e0e7ff;
  color: #3730a3;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  
  &:hover {
    background: #c7d2fe;
  }
`;

export const MetadataModal = styled.div`
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
`;

export const MetadataContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #333;
  }

  pre {
    background: #f8fafc;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.9rem;
  }

  button {
    margin-top: 20px;
    padding: 8px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      background: #5568d3;
    }
  }
`;
