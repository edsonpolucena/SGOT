import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthController } from '../controller/useAuthController';
import AuthLayout from './AuthLayout';
import { FaLock } from "../../../shared/icons";
import { FaCheckCircle } from "react-icons/fa";
import { Title, Subtitle, Form, Field, Label, Box, Input, Submit, Error, Footer, TextLink } from './AuthStyles';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const { validateResetToken, resetPassword, loading, err, setErr } = useAuthController();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [validating, setValidating] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Valida o token assim que a página carregar
    if (!token) {
      setErr('Token não fornecido. Verifique o link no email.');
      setValidating(false);
      return;
    }

    async function checkToken() {
      try {
        const result = await validateResetToken(token);
        if (result.valid) {
          setTokenValid(true);
          setMaskedEmail(result.email || '');
        } else {
          setTokenValid(false);
          setErr(result.reason || 'Token inválido ou expirado');
        }
      } catch (error) {
        setTokenValid(false);
        setErr('Erro ao validar token');
      } finally {
        setValidating(false);
      }
    }

    checkToken();
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);

    // Validações
    if (newPassword.length < 6) {
      setErr('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr('As senhas não coincidem');
      return;
    }

    try {
      await resetPassword({ token, newPassword });
      setSuccess(true);
      
      // Redireciona para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      // Erro já tratado no controller
    }
  }

  // Loading inicial (validando token)
  if (validating) {
    return (
      <AuthLayout>
        <Title>Validando...</Title>
        <Subtitle>Aguarde enquanto verificamos o link de recuperação.</Subtitle>
        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </AuthLayout>
    );
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <AuthLayout>
        <Title>❌ Link Inválido</Title>
        <Subtitle>O link de recuperação não é válido ou já expirou.</Subtitle>
        {err && <Error>{err}</Error>}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          color: '#991b1b'
        }}>
          <p><strong>Possíveis motivos:</strong></p>
          <ul style={{ textAlign: 'left', marginTop: '10px' }}>
            <li>O link expirou (válido por 1 hora)</li>
            <li>O link já foi utilizado</li>
            <li>O link está incompleto ou incorreto</li>
          </ul>
        </div>
        <Footer style={{ marginTop: '30px' }}>
          <TextLink to="/forgot-password">Solicitar novo link</TextLink>
          <span style={{ margin: '0 10px', color: '#d1d5db' }}>|</span>
          <TextLink to="/login">Voltar ao login</TextLink>
        </Footer>
      </AuthLayout>
    );
  }

  // Sucesso
  if (success) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center' }}>
          <FaCheckCircle style={{ fontSize: '64px', color: '#10b981', marginBottom: '20px' }} />
          <Title>✅ Senha Alterada!</Title>
          <Subtitle>Sua senha foi redefinida com sucesso.</Subtitle>
          <div style={{ 
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#d1fae5',
            borderRadius: '8px',
            color: '#065f46'
          }}>
            <p><strong>Você será redirecionado para o login em instantes...</strong></p>
          </div>
        </div>
        <Footer style={{ marginTop: '30px' }}>
          <TextLink to="/login">Ir para login agora</TextLink>
        </Footer>
      </AuthLayout>
    );
  }

  // Formulário de nova senha
  return (
    <AuthLayout>
      <Title>🔐 Nova Senha</Title>
      <Subtitle>
        Defina uma nova senha para sua conta
        {maskedEmail && <div style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '8px' }}>{maskedEmail}</div>}
      </Subtitle>
      
      {err && <Error>{err}</Error>}

      <Form onSubmit={onSubmit}>
        <Field>
          <Label>Nova Senha</Label>
          <Box>
            <FaLock />
            <Input 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </Box>
        </Field>

        <Field>
          <Label>Confirmar Senha</Label>
          <Box>
            <FaLock />
            <Input 
              type="password" 
              placeholder="Digite a senha novamente" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </Box>
        </Field>

        <div style={{ 
          fontSize: '13px', 
          color: '#6b7280', 
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px'
        }}>
          <strong>Dica de segurança:</strong> Use uma senha forte com letras, números e caracteres especiais.
        </div>

        <Submit disabled={loading}>
          {loading ? 'Redefinindo...' : 'Redefinir Senha'}
        </Submit>
      </Form>

      <Footer>
        <TextLink to="/login">Voltar ao login</TextLink>
      </Footer>
    </AuthLayout>
  );
}

