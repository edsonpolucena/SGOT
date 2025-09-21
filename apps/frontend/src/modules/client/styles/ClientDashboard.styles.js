import styled from "styled-components";

export const Wrapper = styled.div`
  padding: 20px;
  font-family: sans-serif;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const CompanyInfo = styled.div`
  h2 { margin: 0; }
  p { margin: 4px 0; }
`;

export const LogoutBtn = styled.button`
  background: #e74c3c;
  color: #fff;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;

export const Dashboard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 colunas na primeira linha */
  grid-gap: 15px;
  margin-bottom: 20px;

  /* Segunda linha */
  & > :nth-child(4) {
    grid-column: span 2; /* histórico ocupa 2 colunas */
  }
  & > :nth-child(5) {
    grid-column: span 1; /* calendário ocupa 1 coluna */
  }
`;


export const Card = styled.div`
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
`;

export const Calendar = styled.div`
  margin-bottom: 20px;
  background: #fff;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
`;

export const Filters = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
  }

  th {
    background: #f1f1f1;
    text-align: left;
  }
`;

export const Extras = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
