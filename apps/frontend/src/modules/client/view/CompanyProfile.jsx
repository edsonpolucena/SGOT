import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../../shared/context/AuthContext';
import { FaBuilding, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, FaCode } from 'react-icons/fa';
import http from '../../../shared/services/http';
import WelcomeCard from "../../../shared/ui/WelcomeCard";


const ProfileContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 40px);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 600;
`;

const ProfileCard = styled.div`
  background-color: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
  max-width: 800px;
`;

const Section = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #495057;
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e9ecef;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
`;

const InfoIcon = styled.div`
  color: #007bff;
  font-size: 1.2rem;
  margin-top: 2px;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 4px;
  font-weight: 500;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => props.status === 'ativa' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.status === 'ativa' ? '#155724' : '#721c24'};
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

export default function CompanyProfile() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Se o usuário tem companyId, buscar dados da empresa específica
      if (user?.companyId) {
        const response = await http.get(`/api/empresas/${user.companyId}`);
        setCompany(response.data);
      } else {
        // Se não tem companyId, buscar a primeira empresa (fallback)
        const response = await http.get('/api/empresas');
        if (response.data && response.data.length > 0) {
          setCompany(response.data[0]);
        } else {
          setError('Nenhuma empresa encontrada');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar perfil da empresa:', err);
      setError('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  if (loading) {
    return (
      <ProfileContainer>
        <Title>Perfil da Empresa</Title>
        <LoadingMessage>Carregando dados da empresa...</LoadingMessage>
      </ProfileContainer>
    );
  }

  if (error) {
    return (
      <ProfileContainer>
        <Title>Perfil da Empresa</Title>
        <ErrorMessage>{error}</ErrorMessage>
      </ProfileContainer>
    );
  }

  if (!company) {
    return (
      <ProfileContainer>
        <Title>Perfil da Empresa</Title>
        <ErrorMessage>Empresa não encontrada</ErrorMessage>
      </ProfileContainer>
    );
  }

  return (
        <>
    <WelcomeCard
      variant="client"
      title={`Bem-vindo(a), ${user?.name}`}
      subtitle="Acompanhe suas obrigações tributárias"
      info={[
        `Email: ${user?.email}`,
        `Empresa: ${user?.company?.nome}`,
        `CNPJ: ${user?.company?.cnpj}`,
        `Código: ${user?.company?.codigo}`
      ]}
    />
    <ProfileContainer>
      <Title>Perfil da Empresa</Title>
      
      <ProfileCard>
        {/* Informações Básicas */}
        <Section>
          <SectionTitle>
            <FaBuilding />
            Informações Básicas
          </SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoIcon>
                <FaCode />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Código</InfoLabel>
                <InfoValue>{company.codigo}</InfoValue>
              </InfoContent>
            </InfoItem>
            
            <InfoItem>
              <InfoIcon>
                <FaBuilding />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Nome da Empresa</InfoLabel>
                <InfoValue>{company.nome}</InfoValue>
              </InfoContent>
            </InfoItem>
            
            <InfoItem>
              <InfoIcon>
                <FaIdCard />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>CNPJ</InfoLabel>
                <InfoValue>{formatCNPJ(company.cnpj)}</InfoValue>
              </InfoContent>
            </InfoItem>
            
            <InfoItem>
              <InfoIcon>
                <FaBuilding />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Status</InfoLabel>
                <InfoValue>
                  <StatusBadge status={company.status}>
                    {company.status}
                  </StatusBadge>
                </InfoValue>
              </InfoContent>
            </InfoItem>
          </InfoGrid>
        </Section>

        {/* Informações de Contato */}
        <Section>
          <SectionTitle>
            <FaEnvelope />
            Informações de Contato
          </SectionTitle>
          <InfoGrid>
            {company.email && (
              <InfoItem>
                <InfoIcon>
                  <FaEnvelope />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>E-mail</InfoLabel>
                  <InfoValue>{company.email}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            
            {company.telefone && (
              <InfoItem>
                <InfoIcon>
                  <FaPhone />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Telefone</InfoLabel>
                  <InfoValue>{company.telefone}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>
        </Section>

        {/* Endereço */}
        {company.endereco && (
          <Section>
            <SectionTitle>
              <FaMapMarkerAlt />
              Endereço
            </SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoIcon>
                  <FaMapMarkerAlt />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>Endereço Completo</InfoLabel>
                  <InfoValue>{company.endereco}</InfoValue>
                </InfoContent>
              </InfoItem>
            </InfoGrid>
          </Section>
        )}

        {/* Informações do Sistema */}
        <Section>
          <SectionTitle>
            <FaBuilding />
            Informações do Sistema
          </SectionTitle>
          <InfoGrid>
          
            <InfoItem>
              <InfoIcon>
                <FaBuilding />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Data de Cadastro</InfoLabel>
                <InfoValue>
                  {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                </InfoValue>
              </InfoContent>
            </InfoItem>
            
            <InfoItem>
              <InfoIcon>
                <FaBuilding />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>Última Atualização</InfoLabel>
                <InfoValue>
                  {new Date(company.updatedAt).toLocaleDateString('pt-BR')}
                </InfoValue>
              </InfoContent>
            </InfoItem>
          </InfoGrid>
        </Section>
      </ProfileCard>
    </ProfileContainer>
    </>
  );
}




