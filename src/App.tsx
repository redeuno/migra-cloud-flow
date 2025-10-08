import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Quadras from "./pages/Quadras";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Financeiro from "./pages/Financeiro";
import MeuFinanceiro from "./pages/MeuFinanceiro";
import Aulas from "./pages/Aulas";
import Torneios from "./pages/Torneios";
import Arenas from "./pages/Arenas";
import Configuracoes from "./pages/Configuracoes";
import ConfiguracoesSistema from "./pages/ConfiguracoesSistema";
import ArenaSuspensa from "./pages/ArenaSuspensa";
import Relatorios from "./pages/Relatorios";
import MinhasAulas from "./pages/MinhasAulas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/arena-suspensa" element={<ArenaSuspensa />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quadras"
              element={
                <ProtectedRoute>
                  <Quadras />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agendamentos"
              element={
                <ProtectedRoute>
                  <Agendamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/financeiro" 
              element={
                <ProtectedRoute>
                  <Financeiro />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meu-financeiro" 
              element={
                <ProtectedRoute requiredRole="aluno">
                  <MeuFinanceiro />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/aulas"
              element={
                <ProtectedRoute>
                  <Aulas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/torneios"
              element={
                <ProtectedRoute>
                  <Torneios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/arenas"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <Arenas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes-sistema"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <ConfiguracoesSistema />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/minhas-aulas"
              element={
                <ProtectedRoute requiredRole="aluno">
                  <MinhasAulas />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
