import { createBrowserRouter } from "react-router-dom";
import Login from "../modules/auth/view/Login";
const Forgot = () => <div style={{padding:24}}>Forgot Password (WIP)</div>;
const Reset  = () => <div style={{padding:24}}>Reset Password (WIP)</div>;
const Dashboard = () => <div style={{padding:24}}>Dashboard</div>;

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <Forgot /> },
  { path: "/reset-password", element: <Reset /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "*", element: <Login /> },
]);
