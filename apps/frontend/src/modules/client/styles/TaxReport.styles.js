import styled from 'styled-components';

export const Page = styled.div`
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
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

export const PeriodSelect = styled.select`
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  option {
    color: #374151;
    background: white;
    padding: 8px;
  }

  option:hover,
  option:checked {
    background: #6b7280;
    color: white;
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

export const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.$color || '#667eea'};
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

export const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
`;

export const TaxTypeCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 30px;
`;

export const TaxTypeCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border-top: 3px solid #667eea;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  }
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  margin-top: 16px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

export const Th = styled.th`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
`;

export const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #374151;

  tr:hover & {
    background: #f9fafb;
  }
`;

export const VariationBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.$positive ? '#d1fae5' : '#fee2e2'};
  color: ${props => props.$positive ? '#065f46' : '#991b1b'};
`;

export const ExportActions = styled.div`
  display: flex;
  gap: 12px;
  margin: 20px 0;
  justify-content: flex-end;
`;

export const ExportButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$variant === 'pdf' && `
    background: #ef4444;
    color: white;

    &:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
    }
  `}

  ${props => props.$variant === 'excel' && `
    background: #10b981;
    color: white;

    &:hover {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
    }
  `}
`;

export const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 1.1rem;
`;

export const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #dc2626;
  font-size: 1.1rem;
  background: #fee2e2;
  border-radius: 8px;
  border: 1px solid #fca5a5;
`;


