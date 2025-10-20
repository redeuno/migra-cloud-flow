import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Quadras from "./pages/Quadras";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Financeiro from "./pages/Financeiro";
import FinanceiroDashboard from "./pages/FinanceiroDashboard";
import MeuFinanceiro from "./pages/MeuFinanceiro";
import Aulas from "./pages/Aulas";
import Torneios from "./pages/Torneios";
import Arenas from "./pages/Arenas";
import Configuracoes from "./pages/Configuracoes";
import ConfiguracoesSistema from "./pages/ConfiguracoesSistema";
import ArenaSuspensa from "./pages/ArenaSuspensa";
import Relatorios from "./pages/Relatorios";
import MinhasAulas from "./pages/MinhasAulas";
import MinhasAulasProfessor from "./pages/MinhasAulasProfessor";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import DashboardAluno from "./pages/DashboardAluno";
import SetupArenaAdmin from "./pages/SetupArenaAdmin";
import AulaPresencas from "./pages/AulaPresencas";
import ArenaSetup from "./pages/ArenaSetup";
import Comissoes from "./pages/Comissoes";
import MeusAlunos from "./pages/MeusAlunos";
import QuadrasDisponiveis from "./pages/QuadrasDisponiveis";
import AulasDisponiveis from "./pages/AulasDisponiveis";
import Professores from "./pages/Professores";
import ConfiguracoesArena from "./pages/ConfiguracoesArena";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/arena-suspensa" element={<ArenaSuspensa />} />
            <Route path="/setup-arena-admin" element={<SetupArenaAdmin />} />
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
              path="/financeiro-dashboard" 
              element={
                <ProtectedRoute>
                  <FinanceiroDashboard />
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
              path="/aulas/:aulaId/presencas"
              element={
                <ProtectedRoute>
                  <AulaPresencas />
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
            {/* ============================================================ */}
            {/* CONFIGURAÇÕES - 3 ROTAS DISTINTAS */}
            {/* ============================================================ */}
            {/* 1. /configuracoes-sistema (Super Admin) - Planos, Módulos globais, Categorias */}
            {/* 2. /configuracoes-arena (Super Admin) - Config específica de cada arena (com selector) */}
            {/* 3. /configuracoes (Arena Admin) - Config da própria arena (sem selector) */}
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute requiredRole="arena_admin">
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
              path="/configuracoes-arena"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <ConfiguracoesArena />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes-arena/:id"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <ConfiguracoesArena />
                </ProtectedRoute>
              }
            />
            <Route
              path="/arena-setup"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <ArenaSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute requiredRole="arena_admin">
                  <Relatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissoes"
              element={
                <ProtectedRoute requiredRole="professor">
                  <Comissoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-alunos"
              element={
                <ProtectedRoute requiredRole="professor">
                  <MeusAlunos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quadras-disponiveis"
              element={
                <ProtectedRoute requiredRole="aluno">
                  <QuadrasDisponiveis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aulas-disponiveis"
              element={
                <ProtectedRoute requiredRole="aluno">
                  <AulasDisponiveis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professores"
              element={
                <ProtectedRoute requiredRole="arena_admin">
                  <Professores />
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
            <Route
              path="/minhas-aulas-professor"
              element={
                <ProtectedRoute requiredRole="professor">
                  <MinhasAulasProfessor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-agendamentos"
              element={
                <ProtectedRoute requiredRole="aluno">
                  <MeusAgendamentos />
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
