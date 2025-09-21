import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
`;

const FormContainer = styled.div`
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h2`
  margin-bottom: 8px;
  font-size: 24px;
  text-align: center;
  color: #333;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin-bottom: 30px;
  font-size: 14px;
  text-align: center;
  color: #666;
  line-height: 1.4;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 6px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #0077ff;
    box-shadow: 0 0 0 3px rgba(0, 119, 255, 0.1);
  }

  svg {
    position: absolute;
    left: 12px;
    color: #999;
    font-size: 16px;
    z-index: 1;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: transparent;

  &::placeholder {
    color: #999;
  }
  &[type="password"], &[type="text"] {
  padding-right: 40px; 
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 25px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.2s;

  &:hover {
    color: #666;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: #0077ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 10px;

  &:hover {
    background: #005fcc;
  }

  &:disabled {
    background: #999;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  text-align: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
`;

const InfoBox = styled.div`
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.4;

  strong {
    color: #0c4a6e;
  }
`;

const WarningText = styled.div`
  color: #059669;
  font-weight: bold;
  margin-top: 4px;
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DropdownItem = styled.div`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CompanyCode = styled.div`
  font-weight: bold;
  color: #374151;
`;

const CompanyName = styled.div`
  color: #6b7280;
  font-size: 12px;
`;

const Footer = styled.div`
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
`;

const StyledLink = styled.a`
  color: #0077ff;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

export default function RegisterLayout({ children }) {
  return (
    <Wrapper>
      <FormContainer>
        {children}
      </FormContainer>
    </Wrapper>
  );
}

export {
  Title,
  Subtitle,
  Form,
  Field,
  Label,
  InputContainer,
  Input,
  ToggleButton,
  SubmitButton,
  ErrorMessage,
  InfoBox,
  WarningText,
  DropdownContainer,
  Dropdown,
  DropdownItem,
  CompanyCode,
  CompanyName,
  Footer,
  StyledLink
};
