// apps/frontend/src/shared/ui/IconGroup.jsx
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px; /* espaço entre os ícones */
`;

export default function IconGroup({ children }) {
  return <Wrapper>{children}</Wrapper>;
}
