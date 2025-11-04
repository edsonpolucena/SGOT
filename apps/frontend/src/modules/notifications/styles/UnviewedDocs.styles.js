// Importando componentes compartilhados para evitar duplicação
export {
  Container,
  Header,
  Title,
  SubTitle,
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
  ActionButton,
  LoadingMessage,
  ErrorMessage,
  SuccessMessage,
  EmptyMessage,
  Badge
} from '../../../shared/styles/CommonTable.styles';

import styled from 'styled-components';

// Componentes específicos de UnviewedDocs (não duplicados)
export const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

export const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.$color || '#667eea'};

  h4 {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 0;
    font-size: 2rem;
    font-weight: bold;
    color: ${props => props.$color || '#333'};
  }
`;
