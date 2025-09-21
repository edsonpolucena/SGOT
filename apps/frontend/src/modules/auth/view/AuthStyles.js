import styled from "styled-components";
import { Link as RouterLink } from "react-router-dom";

const Title = styled.h2` margin: 0 0 6px; font-size: 1.35rem; color: #243146ff`;
const Subtitle = styled.p` margin: 0 0 16px; color: ${({theme}) => theme.colors.muted}; `;
const Form = styled.form` display: grid; gap: 14px; `;
const Field = styled.div` display: grid; gap: 6px; `;
const Label = styled.label` color: ${({theme}) => theme.colors.muted}; font-size: .9rem; `;


const Box = styled.div`
  display: flex;
  align-items: center;
  gap: 8px; /* espaço entre ícone e input */
  background: #f3f4f6; /* cinza claro */
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0 12px;

  svg {
    flex-shrink: 0; /* impede ícone de sumir */
    color: #374151; /* cinza escuro para contraste */
    font-size: 1.1rem;
  }
`;

const Input = styled.input`
  flex: 1; /* ocupa apenas o espaço restante */
  height: 44px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #111827; /* texto escuro */
  font-size: .95rem;
`;


const Toggle = styled.button`
  border: 0; background: transparent; cursor: pointer;
  color: ${({theme}) => theme.colors.muted}; font-size: .85rem;
`;
const Row = styled.div` display: flex; justify-content: space-between; align-items: center; `;
const Remember = styled.label`
  display: flex; gap: 8px; align-items: center; color: ${({theme}) => theme.colors.muted};
  input { accent-color: ${({theme}) => theme.colors.action}; }
`;
const TextLink = styled(RouterLink)`
  border: 0; background: transparent; color: ${({theme}) => theme.colors.action};
  cursor: pointer; text-decoration: none; font: inherit; padding: 0;
`;
const Error = styled.div`
  color: #fca5a5; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25);
  padding: 8px 10px; border-radius: 8px; font-size: .9rem;
`;
const Submit = styled.button`
  margin-top: 6px; width: 100%; height: 60px; border: 0; border-radius: 10px;
  font-weight: 1000; color: #ffffff; background: ${({theme}) => theme.colors.action};
  cursor: pointer; transition: transform .02s ease-in;
  &:active{ transform: translateY(1px); }
  &:disabled{ opacity:.7; cursor: wait; }
`;
const Footer = styled.div` margin-top: 10px; display: flex; justify-content: center; `;


export { Title, Subtitle, Form, Field, Label, Box, Input, Toggle, Row, Remember, TextLink, Error, Submit, Footer };