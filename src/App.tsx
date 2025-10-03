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
import Aulas from "./pages/Aulas";
import Torneios from "./pages/Torneios";
import Arenas from "./pages/Arenas";
import Configuracoes from "./pages/Configuracoes";

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
                <ProtectedRoute requiredRole="arena_admin">
                  <Financeiro />
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
                <ProtectedRoute requiredRole="arena_admin">
                  <Configuracoes />
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
