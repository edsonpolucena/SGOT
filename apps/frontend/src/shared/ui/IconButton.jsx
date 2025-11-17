import styled from "styled-components";

const StyledButton = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ variant }) => (variant === "danger" ? "#DC2626" : "#1E3A8A")};
  font-size: 18px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: ${({ variant }) => (variant === "danger" ? "#991B1B" : "#374151")};
  }
`;

export default function IconButton({ icon: Icon, title, onClick, variant = "default" }) {
  return (
    <StyledButton onClick={onClick} title={title} variant={variant}>
      <Icon />
    </StyledButton>
  );
}
