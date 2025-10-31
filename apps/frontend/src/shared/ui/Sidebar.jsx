import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaHome, FaBuilding, FaUsers, FaFileInvoice, FaChartBar, FaCog, FaSignOutAlt, FaClipboardList, FaBell } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const SidebarContainer = styled.div`
  width: 220px;
  height: 100vh;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 10px;
  position: fixed;
`;

const MenuSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const LogoutSection = styled.div`
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin: 4px 0;
  border-radius: 8px;
  text-decoration: none;
  color: ${(props) => (props.active ? "#1e293b" : "#fff")};
  background: ${(props) => (props.active ? "#fff" : "transparent")};
  font-weight: ${(props) => (props.active ? "bold" : "normal")};

  &:hover {
    background: #334155;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin: 4px 0;
  border-radius: 8px;
  text-decoration: none;
  color: #fff;
  background: transparent;
  border: none;
  font-weight: normal;
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: #dc3545;
  }
`;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAccounting, isClient, logout } = useAuth();

  // Menu baseado no role do usuário
  const getMenuItems = () => {
    if (isAccounting) {
      // Menu para contabilidade (acesso total)
      const menu = [
        { to: "/dashboard", label: "Dashboard", icon: <FaHome /> },
        { to: "/companies", label: "Empresas", icon: <FaBuilding /> },
        { to: "/users", label: "Usuários", icon: <FaUsers /> },
        { to: "/obligations/new", label: "Obrigações", icon: <FaFileInvoice /> },
        { to: "/notifications/unviewed", label: "Não Visualizados", icon: <FaBell /> },
        // { to: "/settings", label: "Configurações", icon: <FaCog /> },
      ];
      
      // Adiciona "Logs de Auditoria" apenas para ACCOUNTING_SUPER
      if (user?.role === 'ACCOUNTING_SUPER') {
        menu.push({ to: "/audit/logs", label: "Logs de Auditoria", icon: <FaClipboardList /> });
      }
      
      return menu;
    } else if (isClient) {
      // Menu para cliente (acesso limitado)
      const menu = [
        { to: "/dashboard", label: "Dashboard", icon: <FaHome /> },
        { to: "/company/profile", label: "Perfil da Empresa", icon: <FaBuilding /> },
      ];
      
      // Adiciona "Usuários" se for CLIENT_ADMIN
      if (user?.role === 'CLIENT_ADMIN') {
        menu.push({ to: "/users", label: "Usuários", icon: <FaUsers /> });
      }
      
      return menu;
    }
    return [];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menu = getMenuItems();

  return (
    <SidebarContainer>
      <MenuSection>
        {menu.map((item) => (
          <MenuItem
            key={item.to}
            to={item.to}
            active={location.pathname === item.to ? 1 : 0}
          >
            {item.icon} {item.label}
          </MenuItem>
        ))}
      </MenuSection>
      
      <LogoutSection>
        <LogoutButton onClick={handleLogout}>
          <FaSignOutAlt /> Sair
        </LogoutButton>
      </LogoutSection>
    </SidebarContainer>
  );
}
