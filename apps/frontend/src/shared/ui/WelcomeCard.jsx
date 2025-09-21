import styled from "styled-components";

const Card = styled.div`
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  font-size: 14px;

  h1, p, span {
    margin: 0;
  }
`;


const DefaultLayout = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  font-size: 14px;

  h1, p, span { margin: 0; }
`;

const ClientLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    h1 {
      font-size: 1.2rem;
      font-weight: bold;
    }
    p {
      font-size: 0.95rem;
      opacity: 0.9;
    }
  }

  .info {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 0.9rem;
    opacity: 0.95;

    span { white-space: nowrap; }
  }
`;

export default function WelcomeCard({ title, subtitle, info = [], variant = "default" }) {
  if (variant === "client") {
    return (
      <Card>
        <ClientLayout>
          <div className="top">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {info.length > 0 && (
            <div className="info">
              {info.map((item, idx) => (
                <span key={idx}>{item}</span>
              ))}
            </div>
          )}
        </ClientLayout>
      </Card>
    );
  }

  return (
    <Card>
      <DefaultLayout>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {info.map((item, idx) => (
          <span key={idx}>{item}</span>
        ))}
      </DefaultLayout>
    </Card>
  );
}
