import styled from 'styled-components';

export const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
`;

export const Title = styled.h1`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 10px;
`;

export const Form = styled.form`
  margin-top: 30px;
`;

export const Field = styled.div`
  margin-bottom: 20px;
`;

export const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  width: 100%;
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

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.6;
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

export const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
`;

export const Button = styled.button`
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

export const CancelButton = styled(Button)`
  background: #e0e0e0;
  color: #555;

  &:hover {
    background: #d0d0d0;
  }
`;

export const ErrorMessage = styled.div`
  background-color: #fee;
  color: #c33;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #c33;
`;

export const InfoBox = styled.div`
  background-color: #e3f2fd;
  padding: 12px 15px;
  border-radius: 8px;
  margin-top: 8px;
  font-size: 0.9rem;
  color: #1565c0;
  border-left: 4px solid #1976d2;

  strong {
    font-weight: 600;
  }
`;



















