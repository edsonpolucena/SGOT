import { useEffect, useState } from "react";

export default function Health() {
  const [status, setStatus] = useState<"loading" | "up" | "down">("loading");
  const [payload, setPayload] = useState<string>("");

  useEffect(() => {
    const url = `${import.meta.env.VITE_API_URL}/health`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setStatus(d?.ok ? "up" : "down");
        setPayload(JSON.stringify(d, null, 2));
      })
      .catch((err) => {
        setStatus("down");
        setPayload(String(err));
      });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Health</h1>
      <p>API: {import.meta.env.VITE_API_URL}</p>
      <p>Status: <strong>{status}</strong></p>
      <pre style={{ background: "#f6f8fa", padding: 12, borderRadius: 8 }}>
        {payload}
      </pre>
    </div>
  );
}
