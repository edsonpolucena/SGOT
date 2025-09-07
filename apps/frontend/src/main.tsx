import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Health from "./pages/Health";
import Obligations from "./pages/Obligations";

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 12 }}>
        <Link to="/">Obrigações</Link> {" | "}
        <Link to="/health">Health</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Obligations />} />
        <Route path="/health" element={<Health />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
