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

export const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

export const SummaryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    switch (props.color) {
      case 'green': return '#10b981';
      case 'orange': return '#f59e0b';
      case 'blue': return '#3b82f6';
      case 'red': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

export const CardValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

export const CardLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
`;

export const CompanyList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
`;

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const CompanyCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid ${props => props.complete ? '#10b981' : '#f59e0b'};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

export const CompanyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`;

export const CompanyName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
`;

export const Badge = styled.span`
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background-color: ${props => props.status === 'COMPLETE' ? '#d1fae5' : '#fef3c7'};
  color: ${props => props.status === 'COMPLETE' ? '#065f46' : '#92400e'};
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background-color: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
`;

export const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: ${props => props.color};
  transition: width 0.3s ease;
`;

export const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
`;

export const Stat = styled.div`
  font-size: 13px;
  color: ${props => {
    switch (props.color) {
      case 'green': return '#065f46';
      case 'orange': return '#92400e';
      case 'red': return '#991b1b';
      default: return '#374151';
    }
  }};
  padding: 6px 10px;
  border-radius: 6px;
  background-color: ${props => {
    switch (props.color) {
      case 'green': return '#d1fae5';
      case 'orange': return '#fef3c7';
      case 'red': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }};

  strong {
    font-weight: 700;
  }
`;

export const ViewButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 12px;

  &:hover {
    background-color: #2563eb;
  }

  &:active {
    transform: scale(0.98);
  }
`;

