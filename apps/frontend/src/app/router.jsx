import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import IndexRedirect from '../routes/IndexRedirect.jsx';
import AppLayout from "./AppLayout.jsx";


import Login from '../modules/auth/view/Login.jsx';
import Register from '../modules/auth/view/Register.jsx';
import ForgotPassword from '../modules/auth/view/ForgotPassword.jsx';

import List from '../modules/obligations/view/List.jsx';
import Form from '../modules/obligations/view/Form.jsx';
import Health from '../modules/obligations/view/Health.jsx';

import Dashboard from '../modules/dashboard/view/Dashboard.jsx';

import ClientDashboard from '../modules/client/view/ClientDashboard.jsx';
import CompanyProfile from '../modules/client/view/CompanyProfile.jsx';

import CompanyList from "../modules/company/view/CompanyList.jsx";
import CompanyForm from "../modules/company/view/CompanyForm.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Dashboard do cliente (legado) */}
        <Route
          path="/dashboard/client"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ClientDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Área logada - obrigações */}
        <Route path="/obligations" element={<ProtectedRoute><AppLayout><List /></AppLayout></ProtectedRoute>} />
        <Route path="/obligations/new" element={<ProtectedRoute><AppLayout><Form /></AppLayout></ProtectedRoute>} />
        <Route path="/obligations/:id/edit" element={<ProtectedRoute><AppLayout><Form /></AppLayout></ProtectedRoute>} />

        {/* Área logada - empresas */}
        <Route path="/companies" element={<ProtectedRoute><AppLayout><CompanyList /></AppLayout></ProtectedRoute>} />
        <Route path="/company/new" element={<ProtectedRoute><AppLayout><CompanyForm /></AppLayout></ProtectedRoute>} />
        <Route path="/company/edit/:id" element={<ProtectedRoute><AppLayout><CompanyForm /></AppLayout></ProtectedRoute>} />
        
        {/* Área logada - perfil da empresa (cliente) */}
        <Route path="/company/profile" element={<ProtectedRoute><AppLayout><CompanyProfile /></AppLayout></ProtectedRoute>} />

        {/* Área logada - logins */}
       <Route path="/auth/register" element={<ProtectedRoute><AppLayout><Register /></AppLayout></ProtectedRoute>}/>


        {/* Opcionais */}
        <Route path="/health" element={<Health />} />
        {/* <Route path="/obligations" element={<Obligations />} /> */}

        {/* Rota fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
