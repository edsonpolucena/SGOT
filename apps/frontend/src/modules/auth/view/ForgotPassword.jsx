import { useState } from 'react';
import { useAuthController } from '../controller/useAuthController';
import AuthLayout from './AuthLayout';
import { FaEnvelope } from "../../../shared/icons";
import { Title, Subtitle, Form, Field, Label, Box, Input, Submit, Error, Footer, TextLink } from './AuthStyles';

export default function ForgotPassword() {
  const { forgotPassword, loading, err, setErr } = useAuthController();
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setErr(null); setOk(false);
    try{
      await forgotPassword({ email });
      setOk(true);
    }catch{}
  }

  return (
    <AuthLayout>
      <Title>Recuperar senha</Title>
      <Subtitle>Informe seu e-mail para receber as instruções.</Subtitle>
      {err && <Error>{err}</Error>}
      {ok && <p style={{color:'#22c55e'}}>Se existir uma conta com este e-mail, enviaremos instruções.</p>}

      <Form onSubmit={onSubmit}>
        <Field>
          <Label>Email</Label>
          <Box>
            <FaEnvelope />
            <Input type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </Box>
        </Field>
        <Submit disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</Submit>
      </Form>
      <Footer>
              <TextLink to="/login">Já tem conta? Entrar</TextLink>
            </Footer>
    </AuthLayout>
  );
}
