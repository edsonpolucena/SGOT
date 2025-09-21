import Sidebar from "../shared/ui/Sidebar.jsx";
import styled from "styled-components";

const Layout = styled.div`
  display: flex;
`;

const Content = styled.div`
  margin-left: 220px; /* largura da sidebar */
  padding: 20px;
  flex: 1;
  background: transparent; /* cor de fundo para diferenciar */
  min-height: 100vh;
`;

export default function AppLayout({ children }) {
  return (
    <Layout>
      <Sidebar />
      <Content>{children}</Content>
    </Layout>
  );
}
