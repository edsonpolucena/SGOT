import styled from 'styled-components';

export const Page = styled.div`
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

export const MonthSelect = styled.input`
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const ExportButton = styled.button`
  padding: 10px 20px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #059669;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
`;

export const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  max-height: 700px;
  overflow-y: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: white;
  }
`;

export const TableHeader = styled.th`
  padding: 14px 16px;
  text-align: ${props => props.textAlign || 'left'};
  font-weight: 600;
  font-size: 13px;
  color: #1f2937;
  background-color: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;

  ${props => props.sticky && `
    position: sticky;
    left: 0;
    z-index: 11;
    background-color: #f9fafb;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  `}
`;

export const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 13px;
  color: ${props => props.color || '#374151'};
  border-bottom: 1px solid #f3f4f6;
  text-align: ${props => props.textAlign || 'left'};
  font-weight: ${props => props.fontWeight || '400'};

  ${props => props.sticky && `
    position: sticky;
    left: 0;
    background-color: white;
    z-index: 1;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  `}

  tr:hover & {
    background-color: ${props => props.sticky ? '#f9fafb' : '#fafafa'};
  }
`;

export const StatusIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: ${props => props.bgColor || '#e5e7eb'};
  font-size: 16px;
  cursor: help;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.15);
  }
`;

