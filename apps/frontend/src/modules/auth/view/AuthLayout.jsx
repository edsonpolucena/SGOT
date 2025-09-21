import styled from "styled-components";

const Shell = styled.div`
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 600px 1fr;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6 50%, #60a5fa 100%);
`;

const FormSide = styled.div`
  display: flex;
  justify-content: center; /* centraliza horizontal */
  align-items: center;     /* centraliza vertical */
  padding: 40px 60px;
`;


const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: ${({theme}) => theme.radius}px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 40px 36px;
`;

const Hero = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto; /* topo cresce, rodapé fica embaixo */
  justify-items: center; /* centraliza conteúdo horizontalmente */
  padding: 56px 64px;
  max-width: 700px; /* limita a largura */
  @media (max-width: 900px) { display: none; }
`;

const HeroTop = styled.div`
  margin: auto 0; /* mantém o slogan centralizado verticalmente */
`;



const HeroBottom = styled.div`
  margin-top: auto;
  padding-top: 20px;
  align-self: flex-end;
  justify-self: flex-end;
  border-top: 1px solid rgba(255,255,255,0.15); /* separador visual */
`;



const Brand = styled.div`
  display: flex; align-items: center; gap: 10px;
  font-weight: 700; letter-spacing: .2px;
  color: #ffffff;
  font-size: 3rem;
`;

const H1 = styled.h1`
  margin: 24px 0 8px;
  font-size: 2rem;
  line-height: 1.1;
  color: ${({theme}) => theme.colors.primary};
`;

const P = styled.p`
  margin: 0;
  color: #f1f5f9;
`;

const Info = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  font-size: 0.9rem;
  color: #ffffff;
  
  div { line-height: 1.5; }
  strong { display: block; margin-bottom: 4px; font-weight: 600; }
  a { color: #bfdbfe; text-decoration: none; }
`;

const FooterMobile = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: block;
    text-align: center;
    padding: 20px;
    font-size: 0.8rem;
    color: ${({theme}) => theme.colors.contrast};
    background: rgba(255,255,255,0.1);
    line-height: 1.4;
  }

  a {
    color: ${({theme}) => theme.colors.action};
    text-decoration: none;
    margin: 0 6px;
  }
`;

const Loops = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
  }

  &::before {
    width: 800px;
    height: 800px;
    right: -250px;
    top: -200px;
    background: radial-gradient(circle at 30% 30%, rgba(12, 13, 15, 0.5), transparent 90%);
  }

  &::after {
    width: 650px;
    height: 650px;
    left: -180px;
    bottom: -160px;
    background: radial-gradient(circle at 70% 70%, rgba(2, 17, 42, 0.35), transparent 70%);
  }
`;

export default function AuthLayout({ children, hideInfo = false }) {
  return (
    <Shell>
      <Loops />
      <FormSide>
        <Card>{children}</Card>
      </FormSide>

      {!hideInfo && (
        <>
          <Hero>
            <HeroTop>
              <Brand>SGOT</Brand>
              <H1>Organize seus tributos<br/>com mais clareza</H1>
              <P>Gerencie obrigações, prazos e documentos em um só lugar.</P>
            </HeroTop>

            <HeroBottom>
              <Info>
                <div>
                  <strong>📞 Precisa de ajuda?</strong>
                  Suporte técnico de segunda a sexta, das 8h às 18h.<br/>
                  📧 <a href="mailto:suporte@sgot.com.br">suporte@sgot.com.br</a><br/>
                  ☎️ (47) 99999-9999
                </div>

                <div>
                  <strong>🧠 Informações institucionais</strong>
                  SGOT v2.3.1 – Atualizado em 18/09/2025<br/>
                  © 2025 SGOT. Todos os direitos reservados.<br/>
                  🔒 Conexão segura via HTTPS<br/>
                  📄 <a href="/privacidade">Política de Privacidade</a> |{" "}
                  <a href="/termos">Termos de Uso</a>
                </div>
              </Info>
            </HeroBottom>
          </Hero>

          <FooterMobile>
            SGOT v2.3.1 – © 2025<br/>
            🔒 Conexão segura via HTTPS<br/>
            <a href="/privacidade">Política de Privacidade</a> |{" "}
            <a href="/termos">Termos de Uso</a>
          </FooterMobile>
        </>
      )}
    </Shell>
  );
}
