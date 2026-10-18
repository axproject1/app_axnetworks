import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { ClientesPage } from '@/features/clientes/ClientesPage';
import { EquiposPage } from '@/features/equipos/EquiposPage';
import { OrdenesPage } from '@/features/ordenes/OrdenesPage';
import { NuevaOrdenWizard } from '@/features/ordenes/NuevaOrdenWizard';
import { OrdenDetailPage } from '@/features/ordenes/OrdenDetailPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { FinanzasPage } from '@/features/finanzas/FinanzasPage';
import { AgendaPage } from '@/features/agenda/AgendaPage';
import { TicketsPage } from '@/features/tickets/TicketsPage';
import { ConfiguracionPage } from '@/features/configuracion/ConfiguracionPage';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, isLoading, isDueno } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg text-slate-400 text-xs">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'dueno' && !isDueno) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="equipos" element={<EquiposPage />} />

              <Route path="ordenes" element={<OrdenesPage />} />
              <Route path="ordenes/nueva" element={<NuevaOrdenWizard />} />
              <Route path="ordenes/:id" element={<OrdenDetailPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route
                path="finanzas"
                element={
                  <ProtectedRoute requiredRole="dueno">
                    <FinanzasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="configuracion"
                element={
                  <ProtectedRoute requiredRole="dueno">
                    <ConfiguracionPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
