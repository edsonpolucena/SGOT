import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
`;

export const FormContainer = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 500px;
`;

export const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 22px;
  text-align: center;
  color: #333;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;

  label {
    margin-bottom: 6px;
    font-size: 14px;
    color: #555;
  }

  input, select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus, select:focus {
    border-color: #0077ff;
  }
`;

export const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #0077ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #005fcc;
  }

  &:disabled {
    background: #999;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.p`
  color: red;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;