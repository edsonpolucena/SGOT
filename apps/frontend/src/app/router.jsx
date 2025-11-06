import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { UsersProtectedRoute } from '../routes/ProtectedRoute.jsx';
import IndexRedirect from '../routes/IndexRedirect.jsx';
import AppLayout from "./AppLayout.jsx";


import Login from '../modules/auth/view/Login.jsx';
import ForgotPassword from '../modules/auth/view/ForgotPassword.jsx';
import ResetPassword from '../modules/auth/view/ResetPassword.jsx';

import List from '../modules/obligations/view/List.jsx';
import Form from '../modules/obligations/view/Form.jsx';
import Health from '../modules/obligations/view/Health.jsx';

import Dashboard from '../modules/dashboard/view/Dashboard.jsx';

import ClientDashboard from '../modules/client/view/ClientDashboard.jsx';
import CompanyProfile from '../modules/client/view/CompanyProfile.jsx';

import CompanyList from "../modules/company/view/CompanyList.jsx";
import CompanyForm from "../modules/company/view/CompanyForm.jsx";

import UserList from "../modules/users/view/UserList.jsx";
import UserForm from "../modules/users/view/UserForm.jsx";

import AuditLog from "../modules/audit/view/AuditLog.jsx";

import UnviewedDocs from "../modules/notifications/view/UnviewedDocs.jsx";

import DocumentControlDashboard from "../modules/document-control/view/DocumentControlDashboard.jsx";
import CompanyTaxMatrix from "../modules/document-control/view/CompanyTaxMatrix.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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

        {/* Área logada - usuários (bloquear CLIENT_NORMAL) */}
        <Route path="/users" element={<UsersProtectedRoute><AppLayout><UserList /></AppLayout></UsersProtectedRoute>} />
        <Route path="/users/new" element={<UsersProtectedRoute><AppLayout><UserForm /></AppLayout></UsersProtectedRoute>} />
        <Route path="/users/edit/:id" element={<UsersProtectedRoute><AppLayout><UserForm /></AppLayout></UsersProtectedRoute>} />

        {/* Área logada - auditoria (apenas ACCOUNTING_SUPER) */}
        <Route path="/audit/logs" element={<ProtectedRoute><AppLayout><AuditLog /></AppLayout></ProtectedRoute>} />

        {/* Área logada - notificações (contabilidade) */}
        <Route path="/notifications/unviewed" element={<ProtectedRoute><AppLayout><UnviewedDocs /></AppLayout></ProtectedRoute>} />

        {/* Área logada - controle de documentos (contabilidade) */}
        <Route path="/document-control/dashboard" element={<ProtectedRoute><AppLayout><DocumentControlDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/document-control/matrix" element={<ProtectedRoute><AppLayout><CompanyTaxMatrix /></AppLayout></ProtectedRoute>} />

        {/* Opcionais */}
        <Route path="/health" element={<Health />} />
        {/* <Route path="/obligations" element={<Obligations />} /> */}

        {/* Rota fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
