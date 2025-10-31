import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

export const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

export const FiltersContainer = styled.div`
  background: #f8fafc; /* box mais claro */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;

  label {
    display: block;
    margin-bottom: 5px;
    color: #555;
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

export const FilterInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #1f2937; 
  color: #f1f5f9; 
  
  &::placeholder {
    color: #cbd5e1; /* placeholder visível no fundo escuro */
  }
  
  /* Ícone do calendário em inputs type=date */
  &::-webkit-calendar-picker-indicator {
    filter: invert(0.9);
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

export const FilterSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  color: #111827; 
  
  & > option {
    color: #111827;
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

export const FilterButton = styled.button`
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-end;
  
  &:hover {
    background: #5568d3;
  }
`;

export const ClearButton = styled.button`
  padding: 8px 20px;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-end;
  
  &:hover {
    background: #cbd5e0;
  }
`;

export const ExportActions = styled.div`
  display: flex;
  gap: 10px;
  margin: 10px 0 20px 0;
`;

export const ExportButton = styled(FilterButton)`
  background: ${props => props.$variant === 'excel' ? '#10b981' : '#ef4444'};
  &:hover {
    background: ${props => props.$variant === 'excel' ? '#0e9670' : '#dc2626'};
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const Th = styled.th`
  padding: 12px;
  text-align: left;
  background: #f8fafc;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
`;

export const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #555;
`;

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

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.1rem;
`;

export const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #fecaca;
`;

export const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 1.1rem;
`;

export const Pagination = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;

  button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 6px;
    font-weight: 500;
    color: #555;

    &:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #667eea;
      color: #667eea;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    color: #555;
    font-weight: 500;
  }
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

