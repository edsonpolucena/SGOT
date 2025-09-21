import { useState } from "react";
import styled from "styled-components";
import AuthLayout from "./AuthLayout";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/context/AuthContext";
import {FaEnvelope, FaLock} from "../../../shared/icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {Title, Subtitle, Form, Field, Label, Box, Input, Toggle, Error, Submit, TextLink} from "./AuthStyles";


const Row = styled.div` display: flex; justify-content: space-between; align-items: center; `;
const Remember = styled.label`
  display: flex; gap: 8px; align-items: center; color: ${({theme}) => theme.colors.muted};
  input { accent-color: ${({theme}) => theme.colors.action}; }
`;

const Footer = styled.div` margin-top: 10px; display: flex; justify-content: center; `;


export default function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function onSubmit(e){
    e.preventDefault();
    setErr(null); 
    setLoading(true);
    try{
      await login({ email: email.trim().toLowerCase(), password: pwd, remember });
      navigate("/dashboard");
    }catch(error){
      const msg = error?.response?.data?.message || "Falha ao entrar. Verifique suas credenciais.";
      setErr(msg);
    }finally{ 
      setLoading(false); 
    }
  }

  return (
    <AuthLayout>
      <Title>Bem Vindo ao SGOT</Title>
      <Subtitle>Acesse sua Conta.</Subtitle>

      {err && <Error>{err}</Error>}

      <Form onSubmit={onSubmit}>
        <Field>
          <Label htmlFor="email">Email</Label>
          <Box>
            <FaEnvelope />
            <Input id="email" type="email" value={email}
              onChange={(e)=>setEmail(e.target.value)} placeholder="nome@exemplo.com" autoComplete="email" required />
          </Box>
        </Field>

        <Field>
          <Label htmlFor="pwd">Senha</Label>
          <Box>
            <FaLock />
            <Input id="pwd" type={show ? "text" : "password"} value={pwd}
              onChange={(e)=>setPwd(e.target.value)} placeholder="Sua senha" autoComplete="current-password" required />
            <Toggle type="button" onClick={()=>setShow(s=>!s)}>{show ? <FaEyeSlash /> : <FaEye />}</Toggle>
          </Box>
        </Field>

        <Row>
          <Remember>
            <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
            Lembrar de mim
          </Remember>
          <TextLink to="/forgot-password">Esqueceu a senha?</TextLink>
        </Row>

        <Submit disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Submit>
      </Form>

    </AuthLayout>
  );
}
