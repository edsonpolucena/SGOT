import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
  max-width: 1600px;
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

export const SubTitle = styled.p`
  color: #666;
  margin: 5px 0 0 0;
  font-size: 0.95rem;
`;

export const FiltersContainer = styled.div`
  background: white;
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

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: ${props => props.$sending ? '#94a3b8' : '#667eea'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: ${props => props.$sending ? 'not-allowed' : 'pointer'};
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.$sending ? '#94a3b8' : '#5568d3'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    font-size: 0.9rem;
  }
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

export const SuccessMessage = styled.div`
  background: #dcfce7;
  color: #166534;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #bbf7d0;
`;

export const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 1.1rem;

  svg {
    font-size: 4rem;
    margin-bottom: 20px;
    color: #d1d5db;
  }
`;

export const Badge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    if (props.$type === 'late') return '#fee2e2';
    if (props.$type === 'soon') return '#fef3c7';
    return '#dbeafe';
  }};
  color: ${props => {
    if (props.$type === 'late') return '#991b1b';
    if (props.$type === 'soon') return '#92400e';
    return '#1e40af';
  }};
`;

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



