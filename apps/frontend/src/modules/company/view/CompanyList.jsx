import { useEffect, useState } from "react";
import { useCompanyController } from "../controller/useCompanyController";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaBuilding, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "../../../shared/context/AuthContext";
import WelcomeCard from "../../../shared/ui/WelcomeCard"; // 👈 import aqui


const Container = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 40px);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NewButton = styled(Link)`
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

const TableContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: #f8f9fa;
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #dee2e6;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 16px;
  color: #333;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => props.status === 'ativa' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.status === 'ativa' ? '#155724' : '#721c24'};
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  font-size: 1rem;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;

  &:hover {
    color: #007bff;
  }

  &.delete:hover {
    color: #dc3545;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #dc3545;
  font-size: 1.1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
`;

export default function CompanyList() {
  const {user} = useAuth();
  const { getCompanies, loading, error } = useCompanyController();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompanies();
        setEmpresas(data);
      } catch (err) {
        console.error('Erro ao carregar empresas:', err);
      }
    }
    load();
  }, []);

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Carregando empresas...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>Erro ao carregar empresas: {error}</ErrorMessage>
      </Container>
    );
  }

  return (     
    <>
    <WelcomeCard
      title={`Bem-vindo(a), ${user?.name}`}
      subtitle="Gerencie as empresas cadastradas no sistema"
    />
    <Container>
      
      <Header>
        
        <Title>
          <FaBuilding />
          Empresas
        </Title>
        <NewButton to="/company/new">
          <FaPlus />
          Nova Empresa
        </NewButton>
      </Header>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>CNPJ</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {empresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                  Nenhuma empresa cadastrada
                </TableCell>
              </TableRow>
            ) : (
              empresas.map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell>{empresa.codigo}</TableCell>
                  <TableCell>{empresa.nome}</TableCell>
                  <TableCell>{formatCNPJ(empresa.cnpj)}</TableCell>
                  <TableCell>{empresa.email || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={empresa.status}>
                      {empresa.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <Actions>
                      <ActionButton 
                        title="Editar"
                        onClick={() => navigate(`/company/edit/${empresa.id}`)}
                      >
                        <FaEdit />
                      </ActionButton>
                      <ActionButton className="delete" title="Excluir">
                        <FaTrash />
                      </ActionButton>
                    </Actions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
    </>
  );
}
