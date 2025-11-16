import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import http from '../../../shared/services/http';
import WelcomeCard from '../../../shared/ui/WelcomeCard';
import { FaCalendarAlt } from "react-icons/fa";
import {
  Page,
  Header,
  Title,
  Card,
  Table,
  Th,
  Td,
  Input,
  SaveButton,
  Message
} from '../styles/TaxCalendarManagement.styles';

const TAX_TYPES = [
  { code: 'DAS', name: 'DAS' },
  { code: 'ISS_RETIDO', name: 'ISS Retido' },
  { code: 'FGTS', name: 'FGTS' },
  { code: 'DCTFWeb', name: 'DCTFWeb' }
];

export default function TaxCalendarManagement() {
  const { user } = useAuth();
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCalendar();
  }, []);

  async function loadCalendar() {
    try {
      setLoading(true);
      const response = await http.get('/api/tax-calendar');
      
      // Merge com tipos padrão
      const calendarMap = {};
      response.data.forEach(item => {
        calendarMap[item.taxType] = item;
      });

      const merged = TAX_TYPES.map(tax => ({
        taxType: tax.code,
        taxName: tax.name,
        dueDay: calendarMap[tax.code]?.dueDay || '',
        description: calendarMap[tax.code]?.description || ''
      }));

      setCalendar(merged);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
      setError('Erro ao carregar calendário fiscal');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(taxType, dueDay, description) {
    try {
      if (!dueDay || dueDay < 1 || dueDay > 31) {
        setError(`Dia inválido para ${taxType}. Use 1-31.`);
        return;
      }

      await http.post('/api/tax-calendar', {
        taxType,
        dueDay: parseInt(dueDay),
        description
      });

      setSuccess(`Vencimento de ${taxType} salvo com sucesso!`);
      setError('');
      
      setTimeout(() => setSuccess(''), 3000);
      loadCalendar();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar vencimento');
    }
  }

  const handleDayChange = (taxType, value) => {
    setCalendar(prev => prev.map(item => 
      item.taxType === taxType 
        ? { ...item, dueDay: value }
        : item
    ));
  };

  const handleDescriptionChange = (taxType, value) => {
    setCalendar(prev => prev.map(item => 
      item.taxType === taxType 
        ? { ...item, description: value }
        : item
    ));
  };

  if (loading) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Calendário Fiscal"
        />
        <Page>
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Carregando...
          </div>
        </Page>
      </>
    );
  }

  return (
    <>
      <WelcomeCard
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle="Configure os dias de vencimento de cada imposto"
      />
      <Page>
        <Header>
          <Title> <FaCalendarAlt/> Calendário Fiscal - Vencimentos</Title>
        </Header>

        {success && <Message $type="success">{success}</Message>}
        {error && <Message $type="error">{error}</Message>}

        <Card>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Configure o dia do mês em que cada imposto vence. O sistema usará essas informações para:
          </p>
          <ul style={{ color: '#6b7280', marginBottom: '20px', paddingLeft: '20px' }}>
            <li>Calcular automaticamente a data de vencimento ao criar obrigações</li>
            <li>Identificar impostos atrasados</li>
            <li>Enviar alertas de vencimentos próximos</li>
          </ul>

          <Table>
            <thead>
              <tr>
                <Th>Imposto</Th>
                <Th>Dia do Vencimento</Th>
                <Th>Descrição</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {calendar.map(item => (
                <tr key={item.taxType}>
                  <Td style={{ fontWeight: '600' }}>{item.taxName}</Td>
                  <Td>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={item.dueDay}
                      onChange={(e) => handleDayChange(item.taxType, e.target.value)}
                      placeholder="Ex: 20"
                    />
                  </Td>
                  <Td>
                    <Input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleDescriptionChange(item.taxType, e.target.value)}
                      placeholder="Ex: Vence todo dia 20"
                    />
                  </Td>
                  <Td>
                    <SaveButton 
                      onClick={() => handleSave(item.taxType, item.dueDay, item.description)}
                      disabled={!item.dueDay}
                    >
                      Salvar
                    </SaveButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            background: '#fef3c7', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#92400e'
          }}>
            <strong>💡 Observação:</strong> O tipo "OUTRO" não tem vencimento fixo, pois cada documento pode ter vencimentos diferentes.
          </div>
        </Card>
      </Page>
    </>
  );
}


