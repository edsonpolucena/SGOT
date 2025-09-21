import styled from "styled-components";

export const Page = styled.div`
  flex: 1;
  min-height: 100vh;
  padding: 30px;
  background: ${({ theme }) => theme.colors.pageBackground};
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;


export const Title = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #1a1a1a; /* preto ou cinza escuro */
  position: relative;
  z-index: 2;     /* fica acima do Card */
`;

export const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 720px;
`;

export const FormStyled = styled.form`
  display: grid;
  gap: 16px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.row {
    display: grid;
    grid-template-columns: 120px 1fr; /* código pequeno, CNPJ ocupa o resto */
    gap: 12px;
  }
`;

export const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
   color: #333;
`;

export const Input = styled.input`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  max-width: ${props => props.small ? "120px" : "100%"};
`;

export const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
`;

export const Submit = styled.button`
  padding: 10px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background: #1d4ed8;
  }
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

export const FieldSmall = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 150px; /* campo menor, ideal para Código ou Valor */
`;



