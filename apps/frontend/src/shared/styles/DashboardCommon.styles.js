import styled from 'styled-components';

/**
 * Styled Components compartilhados entre Dashboard.jsx e ClientDashBoard.jsx
 * Evita duplicação de código
 */

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

export const StatCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${(props) => props.color || "#667eea"};
`;

export const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${(props) => props.color || "#333"};
  margin-bottom: 10px;
`;

export const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

export const Th = styled.th`
  padding: 12px;
  text-align: left;
  background: #f9fafb;
  cursor: pointer;
`;

export const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
`;

export const Pagination = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;

  button {
    padding: 6px 12px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 6px;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
