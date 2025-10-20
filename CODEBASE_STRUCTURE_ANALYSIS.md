# MIGRA CLOUD FLOW - COMPREHENSIVE CODEBASE ANALYSIS

## 1. OVERALL PROJECT STRUCTURE AND ARCHITECTURE

### Project Type
- **Full-Stack Web Application** for tennis arena management (Verana Beach Tennis)
- **Architecture Pattern**: Modern SPA (Single Page Application) with Backend-as-a-Service (BaaS)
- **Frontend**: React + TypeScript with Vite
- **Backend**: Supabase (PostgreSQL Database + Auth + Edge Functions)
- **Deployment Model**: Client-side rendering with serverless backend

### Architectural Layers
```
┌─────────────────────────────────────────────────┐
│         CLIENT (React SPA)                       │
│  ├─ Pages (34 routes)                          │
│  ├─ Components (92 exported components)         │
│  ├─ Custom Hooks                               │
│  ├─ Context (Authentication)                   │
│  └─ Services & Utils                           │
├─────────────────────────────────────────────────┤
│    API Layer (TanStack React Query)             │
├─────────────────────────────────────────────────┤
│      SUPABASE (Backend Services)                │
│  ├─ PostgreSQL Database                        │
│  ├─ Authentication (Row Level Security)        │
│  ├─ Real-time Subscriptions                    │
│  ├─ Edge Functions (14 serverless functions)   │
│  └─ Storage (if needed)                        │
└─────────────────────────────────────────────────┘
```

---

## 2. MAIN DIRECTORIES AND THEIR PURPOSES

```
migra-cloud-flow/
├── src/
│   ├── components/              # React components (92 exports)
│   │   ├── ui/                 # shadcn/ui components (base UI library)
│   │   ├── Layout/             # Layout components with navigation
│   │   ├── agendamentos/       # Booking management components
│   │   ├── arenas/             # Arena management components
│   │   ├── aulas/              # Classes management components
│   │   ├── checkins/           # Check-in system components
│   │   ├── clientes/           # Client management components
│   │   ├── configuracoes/      # Settings/Configuration components
│   │   ├── dashboard/          # Dashboard widget components
│   │   ├── financeiro/         # Finance/Billing components
│   │   ├── historico/          # Activity history components
│   │   ├── professores/        # Professor management components
│   │   ├── quadras/            # Court management components
│   │   ├── relatorios/         # Reports components
│   │   ├── torneios/           # Tournament components
│   │   ├── AppSidebar.tsx      # Main navigation sidebar
│   │   ├── Layout.tsx          # Main layout wrapper
│   │   ├── ProtectedRoute.tsx  # Route protection/authorization
│   │   └── ArenaAccessGuard.tsx # Arena access control
│   │
│   ├── contexts/               # React Context for state management
│   │   └── AuthContext.tsx     # Authentication & user roles context
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useArenaAccess.tsx  # Arena access validation
│   │   ├── useArenaStatus.tsx  # Arena status monitoring
│   │   ├── useGeolocation.tsx  # Geolocation for check-ins
│   │   ├── useKeyboardShortcuts.tsx # Keyboard navigation
│   │   ├── useExportData.tsx   # Data export functionality
│   │   ├── useNotifications.tsx # Real-time notifications
│   │   ├── useMetricasComparativas.tsx # Comparative metrics
│   │   └── useModuloAccess.tsx # Module access control
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client initialization
│   │       └── types.ts        # Auto-generated TypeScript types (2372 lines)
│   │
│   ├── lib/
│   │   ├── services/
│   │   │   └── templateService.ts # Notification template rendering
│   │   ├── utils/
│   │   │   ├── notificacoes.ts # Notification creation helpers
│   │   │   ├── registrarAtividade.ts # Activity logging
│   │   │   ├── validarConflitosAgendamento.ts # Scheduling conflict validation
│   │   │   ├── notificarInscricaoAula.ts # Class enrollment notifications
│   │   │   ├── exportarExcel.ts # Excel export utilities
│   │   │   └── exportarPDF.ts # PDF export utilities
│   │   └── validations/
│   │       ├── agendamento.ts  # Zod validation schemas for bookings
│   │       ├── arena.ts        # Arena validation schemas
│   │       ├── cliente.ts      # Client validation schemas
│   │       ├── contrato.ts     # Contract validation schemas
│   │       ├── mensalidade.ts  # Billing validation schemas
│   │       └── movimentacao.ts # Financial transaction validation
│   │
│   ├── pages/                  # Page components (34 routes)
│   │   ├── Index.tsx           # Home/Dashboard redirect
│   │   ├── Auth.tsx            # Login page
│   │   ├── Dashboard.tsx       # Main dashboard (role-based)
│   │   ├── DashboardAluno.tsx  # Student dashboard
│   │   ├── DashboardProfessor.tsx # Professor dashboard
│   │   ├── DashboardSuperAdmin.tsx # Admin dashboard
│   │   ├── Quadras.tsx         # Courts management
│   │   ├── Agendamentos.tsx    # Bookings management
│   │   ├── Aulas.tsx           # Classes management
│   │   ├── Clientes.tsx        # Clients management
│   │   ├── Professores.tsx     # Professors management
│   │   ├── Financeiro.tsx      # Finance dashboard
│   │   ├── Comissoes.tsx       # Professor commissions
│   │   ├── Relatorios.tsx      # Reports generation
│   │   ├── Configuracoes.tsx   # Arena settings
│   │   ├── ConfiguracoesSistema.tsx # System-wide settings (super admin)
│   │   ├── ConfiguracoesArena.tsx # Arena configuration (super admin)
│   │   ├── Torneios.tsx        # Tournament management
│   │   └── [student/professor specific pages]
│   │
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx                # React DOM entry point
│   ├── App.css                 # Global styles
│   ├── index.css               # Tailwind imports
│   └── vite-env.d.ts          # Vite environment types
│
├── supabase/
│   ├── migrations/             # 57 SQL migration files
│   │   ├── 20251003115323_*.sql # Initial schema setup
│   │   ├── 20251003115358_*.sql # Enum definitions
│   │   └── [...incremental updates]
│   │
│   ├── functions/              # 14 Edge Functions (Deno)
│   │   ├── gerar-mensalidades-automaticas/ # Auto monthly billing
│   │   ├── gerar-comissoes-automaticas/ # Auto commission calculation
│   │   ├── gerar-fatura-sistema/ # Invoice generation
│   │   ├── asaas-cobranca/ # Payment processor integration
│   │   ├── asaas-webhook/ # Payment webhook handler
│   │   ├── notificar-agendamentos-proximos/ # Booking reminders
│   │   ├── enviar-link-pagamento/ # Payment link notifications
│   │   ├── enviar-lembrete-fatura/ # Invoice reminders
│   │   ├── enviar-whatsapp-evolution/ # WhatsApp integration
│   │   ├── verificar-vencimentos-arena/ # Arena expiration checks
│   │   ├── verificar-vencimentos-faturas/ # Invoice expiration checks
│   │   ├── lembretes-pagamento/ # Payment reminders
│   │   └── setup-arena-admin/ # Arena initialization
│   │
│   └── config.toml             # Edge Function configurations
│
├── public/
│   ├── manifest.json           # PWA manifest
│   └── [PWA assets]
│
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # App-specific TypeScript config
├── tsconfig.node.json          # Build tool TypeScript config
├── components.json             # Shadcn component registry
├── .env                        # Environment variables (Supabase keys)
└── README.md                   # Project setup documentation
```

---

## 3. KEY CONFIGURATION FILES

### package.json
- **Project Name**: vite_react_shadcn_ts
- **Type**: ES Module
- **Node Package Manager**: npm
- **Scripts**:
  - `npm run dev` - Development server with hot reload
  - `npm run build` - Production build
  - `npm run build:dev` - Development build
  - `npm run lint` - ESLint validation
  - `npm run preview` - Preview production build

### tsconfig.json
```json
{
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] },
  "noImplicitAny": false,
  "noUnusedParameters": false,
  "skipLibCheck": true,
  "allowJs": true,
  "noUnusedLocals": false,
  "strictNullChecks": false
}
```
- Uses path aliasing for cleaner imports
- Relaxed TypeScript settings for faster development

### .env
```
VITE_SUPABASE_PROJECT_ID=nxissybzirfxjewvamgy
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=https://nxissybzirfxjewvamgy.supabase.co
```
- Supabase configuration for frontend
- Public keys only (no secrets)

### supabase/config.toml
- Defines 14 Edge Functions with JWT verification settings
- Most functions disable JWT (for scheduled jobs)
- Some functions require JWT (for authenticated API calls)

---

## 4. TECHNOLOGY STACK

### Frontend Dependencies
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | ^18.3.1 | UI library |
| **Language** | TypeScript | ^5.8.3 | Type safety |
| **Build Tool** | Vite | ^5.4.19 | Fast bundler |
| **UI Component Library** | shadcn/ui | - | Pre-built accessible components |
| **Styling** | Tailwind CSS | ^3.4.17 | Utility-first CSS |
| **Routing** | React Router DOM | ^6.30.1 | Client-side routing |
| **Forms** | React Hook Form | ^7.61.1 | Efficient form handling |
| **Validation** | Zod | ^3.25.76 | Runtime type validation |
| **State Management** | TanStack React Query | ^5.83.0 | Server state management |
| **UI Components** | Radix UI | ^1.x | Headless UI components |
| **Icons** | Lucide React | ^0.462.0 | Icon library |
| **Data Export** | XLSX | ^0.18.5 | Excel export |
| **PDF Generation** | jsPDF | ^3.0.3 | PDF export |
| **Charts** | Recharts | ^2.15.4 | Data visualization |
| **Notifications** | Sonner | ^1.7.4 | Toast notifications |
| **QR Codes** | QRCode | ^1.5.4 | QR code generation |
| **PWA** | vite-plugin-pwa | ^1.1.0 | Progressive Web App |
| **Themes** | next-themes | ^0.3.0 | Dark mode support |
| **Drag & Drop** | react-resizable-panels | ^2.1.9 | Resizable UI panels |
| **Backend** | @supabase/supabase-js | ^2.58.0 | Supabase client library |

### Backend (Supabase)
- **Database**: PostgreSQL with RLS (Row Level Security)
- **Authentication**: Supabase Auth (Email/Password)
- **Real-time**: PostgreSQL LISTEN/NOTIFY
- **Edge Functions**: Deno runtime (TypeScript)
- **API**: RESTful via PostgREST

### Development Tools
- **Linting**: ESLint ^9.32.0
- **Build Plugins**: @vitejs/plugin-react-swc
- **CSS Processing**: PostCSS, Autoprefixer
- **Type Generation**: Supabase CLI (generates types.ts)

---

## 5. ENTRY POINTS AND MAIN APPLICATION FILES

### Frontend Entry Point Flow
```
main.tsx
  ↓
App.tsx (BrowserRouter + Providers)
  ├── QueryClientProvider (TanStack React Query)
  ├── AuthProvider (Authentication Context)
  ├── TooltipProvider (UI)
  ├── Toaster components
  └── Routes (34 routes)
       ├── /auth (public)
       ├── / (protected)
       └── [...other protected routes]
```

### main.tsx
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```
- Single entry point for React application
- Mounts to `#root` element in HTML

### App.tsx - Core Application Structure
**Key Features**:
- Sets up QueryClientProvider for data fetching cache
- AuthProvider wraps entire app for authentication
- 34 routes with role-based ProtectedRoute guards
- PWA installation prompt
- Toast notifications system

**Route Organization** (34 routes):
1. **Public Routes** (2):
   - `/auth` - Login page
   - `/arena-suspensa` - Suspended arena page

2. **Admin Routes** (Super Admin only):
   - `/arenas` - Arena management
   - `/arena-setup` - Arena setup
   - `/configuracoes-sistema` - System configuration
   - `/configuracoes-arena` - Arena configuration

3. **Financial Routes**:
   - `/financeiro` - Admin finance dashboard
   - `/financeiro-dashboard` - Finance reports
   - `/meu-financeiro` - Student finance (aluno)
   - `/comissoes` - Professor commissions

4. **Content Management Routes**:
   - `/quadras` - Courts management
   - `/agendamentos` - Bookings management
   - `/aulas` - Classes management
   - `/professores` - Professors management
   - `/clientes` - Clients management
   - `/torneios` - Tournaments

5. **User-Specific Routes**:
   - `/minhas-aulas` - Student classes
   - `/minhas-aulas-professor` - Professor classes
   - `/meus-agendamentos` - Student bookings
   - `/meus-alunos` - Professor's students
   - `/quadras-disponiveis` - Available courts for students
   - `/aulas-disponiveis` - Available classes for students

6. **Administrative Routes**:
   - `/relatorios` - Reports for arena admin
   - `/configuracoes` - Arena settings

### supabase/client.ts - Backend Initialization
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```
- Auto-generated client from Supabase project
- Session persistence with localStorage
- Automatic token refresh

---

## 6. DATABASE MODELS AND SCHEMAS STRUCTURE

### Core Tables (57 migrations)

#### Authentication & User Management
1. **auth.users** (Supabase managed)
   - Email, password hash, auth metadata

2. **user_roles** 
   - Roles: super_admin, arena_admin, funcionario, professor, aluno
   - Links users to roles with arena context
   - Enables multi-role support

3. **usuarios** (User Profiles)
   - Columns: id, auth_id, nome_completo, email, telefone, status, arena_id
   - Extended user information

#### Arena Management
1. **arenas**
   - Columns: id, nome, endereco, telefone, email, status, data_criacao
   - Multi-tenant support

2. **arena_modulos**
   - Columns: arena_id, modulo_id, ativo, data_ativacao, data_expiracao
   - Feature flags per arena

3. **modulos_sistema**
   - Columns: id, nome, slug, descricao, icone
   - System-wide module definitions

#### Court Management
1. **quadras** (Courts)
   - Columns: id, arena_id, numero, nome, modalidade, status, capacidade
   - Modalidades: beach_tennis, padel, tenis

2. **bloqueios_quadra** (Court Blockages)
   - Columns: id, quadra_id, data_inicio, data_fim, motivo
   - For maintenance, special events

#### Scheduling
1. **agendamentos** (Bookings)
   - Columns: id, cliente_id, quadra_id, data_agendamento, hora_inicio, hora_fim
   - Columns: tipo_agendamento, modalidade, valor_total, status
   - Columns: recorrencia_config, e_recorrente, lembrete_enviado
   - Status: confirmado, pendente, cancelado, realizado
   - Payment Status: pago, pendente, atrasado

2. **aulas** (Classes)
   - Columns: id, professor_id, arena_id, tipo_aula, titulo, descricao
   - Columns: data_aula, hora_inicio, hora_fim, max_alunos, valor_por_aluno
   - Tipos: individual, grupo, clinica, curso
   - Status: agendada, confirmada, realizada, cancelada

3. **aulas_alunos** (Class Enrollments)
   - Columns: id, aula_id, aluno_id, status, data_inscricao
   - Status: ativo, cancelado, concluido

#### Staff Management
1. **professores** (Professors)
   - Columns: id, usuario_id, arena_id, especialidades, valor_hora_aula
   - Columns: disponibilidade, registro_profissional, biografia, foto_url
   - Columns: avaliacao_media, total_avaliacoes

2. **funcionarios** (Staff)
   - Columns: id, usuario_id, arena_id, cargo, salario
   - Columns: data_admissao, data_demissao, horario_trabalho

#### Financial Management
1. **contratos** (Contracts)
   - Columns: id, usuario_id, arena_id, tipo_contrato, valor_mensal
   - Columns: dia_vencimento, status, desconto_percentual
   - Types: mensal, trimestral, semestral, anual

2. **mensalidades** (Monthly Billing)
   - Columns: id, contrato_id, referencia (YYYY-MM), data_vencimento
   - Columns: valor, desconto, acrescimo, valor_final, status_pagamento
   - Automatically generated by Edge Function on due date

3. **movimentacoes_financeiras** (Financial Transactions)
   - Columns: id, arena_id, usuario_id, tipo, categoria, valor
   - Columns: data_movimentacao, descricao
   - Types: receita, despesa, transferencia
   - Categories: mensalidade, agendamento, aula, torneio, evento, etc.

4. **comissoes** (Professor Commissions)
   - Calculated from aulas value and professor percentage
   - Status: pendente, calculada, paga

#### Notifications & Audit
1. **notificacoes** (Notifications)
   - Columns: id, usuario_id, tipo, titulo, mensagem, link
   - Columns: lido, metadata, created_at
   - Types: pagamento_recebido, aula_confirmada, agendamento_lembrete

2. **templates_notificacao** (Notification Templates)
   - Columns: nome, tipo, categoria, assunto, mensagem, ativo
   - Variable substitution: {{nome}}, {{valor}}, {{data}}, etc.
   - Supports: whatsapp, email, sms

3. **historico_atividades** (Activity Audit Log)
   - Columns: usuario_id, arena_id, tipo_acao, descricao
   - Columns: metadata, ip_address, user_agent, created_at

#### Tournaments
1. **torneios** (Tournaments)
   - Columns: id, arena_id, nome, data_inicio, data_fim
   - Columns: status, tipo_chaveamento, descricao
   - Status: planejamento, inscricoes_abertas, em_andamento, finalizado
   - Chaveamento: eliminacao_simples, eliminacao_dupla, round_robin, suico

2. **inscricoes_torneio** (Tournament Registrations)
   - Columns: id, torneio_id, usuario_id, status, data_inscricao

### Database Enums
```sql
app_role: 'super_admin', 'arena_admin', 'funcionario', 'professor', 'aluno'
status_agendamento: 'confirmado', 'pendente', 'cancelado', 'realizado'
status_pagamento: 'pago', 'pendente', 'atrasado'
tipo_esporte: 'beach_tennis', 'padel', 'tenis'
tipo_aula: 'individual', 'grupo', 'clinica', 'curso'
status_aula: 'agendada', 'confirmada', 'realizada', 'cancelada', 'remarcada'
status_contrato: 'ativo', 'suspenso', 'cancelado', 'finalizado'
tipo_movimentacao: 'receita', 'despesa', 'transferencia'
categoria_financeira: 'mensalidade', 'agendamento', 'aula', 'torneio', etc.
status_torneio: 'planejamento', 'inscricoes_abertas', 'em_andamento', 'finalizado'
tipo_chaveamento: 'eliminacao_simples', 'eliminacao_dupla', 'round_robin', 'suico'
```

### Database Relationships
- Users → Roles (many-to-many via user_roles)
- Users → Arenas (implicit via user_roles or usuarios.arena_id)
- Arenas → Quadras (one-to-many)
- Arenas → Agendamentos (one-to-many)
- Arenas → Professores (one-to-many)
- Quadras → Agendamentos (one-to-many)
- Professores → Aulas (one-to-many)
- Aulas → Aulas_Alunos (one-to-many)
- Usuarios → Aulas_Alunos (one-to-many)
- Contratos → Mensalidades (one-to-many)
- Torneios → Inscricoes_Torneio (one-to-many)

### Row Level Security (RLS) Policies
- Arena isolation: Users only see data from their arena
- Role-based access: Different operations for different roles
- Temporal access: Expiration dates for module access

---

## 7. ROUTING STRUCTURE

### Router Architecture
```
BrowserRouter
├── Route /auth (Public)
├── Route / (Protected, redirects to dashboard)
├── Route /quadras (Protected, arena_admin)
├── Route /agendamentos (Protected, arena_admin)
├── Route /aulas (Protected, arena_admin)
├── Route /clientes (Protected, arena_admin)
├── Route /financeiro (Protected, arena_admin)
├── Route /comissoes (Protected, professor)
├── Route /meus-alunos (Protected, professor)
├── Route /minhas-aulas (Protected, aluno)
├── Route /minhas-aulas-professor (Protected, professor)
├── Route /meus-agendamentos (Protected, aluno)
├── Route /quadras-disponiveis (Protected, aluno)
├── Route /aulas-disponiveis (Protected, aluno)
├── Route /meu-financeiro (Protected, aluno)
├── Route /arenas (Protected, super_admin)
├── Route /arena-setup (Protected, super_admin)
├── Route /configuracoes (Protected, arena_admin)
├── Route /configuracoes-sistema (Protected, super_admin)
├── Route /configuracoes-arena (Protected, super_admin)
├── Route /relatorios (Protected, arena_admin)
├── Route /torneios (Protected, arena_admin)
├── Route /professores (Protected, arena_admin)
├── Route /aulas/:aulaId/presencas (Protected, arena_admin)
├── Route * (Not Found)
└── Error Boundary (Implicit)
```

### Navigation Sidebar
**Role-Based Menu Items**:

**Super Admin Menu**:
- Dashboard, Arenas, Setup Arenas, Financeiro, System Config, Arena Config

**Arena Admin Menu**:
- Dashboard, Quadras, Agendamentos, Pessoas, Professores, Aulas, Torneios
- Admin-only: Financeiro, Dashboard Financeiro, Comissões, Relatórios, Configurações

**Professor Menu**:
- Dashboard, Minhas Aulas, Meus Alunos, Comissões

**Student Menu**:
- Dashboard, Meus Agendamentos, Quadras Disponíveis, Aulas Disponíveis, Minhas Aulas, Meu Financeiro

**Employee/Staff Menu**:
- Same as Arena Admin (if both roles exist)

### Module Access Control
- Sidebar items filtered by active modules per arena
- Modules can be activated/deactivated per arena
- Expiration dates control module availability

---

## 8. MIDDLEWARE AND AUTHENTICATION SETUP

### Authentication Context (AuthContext.tsx)

**Provider Structure**:
```typescript
interface AuthContextType {
  user: User | null                    // Supabase auth user
  session: Session | null              // Current session
  loading: boolean                      // Initial load state
  rolesLoading: boolean                 // Role fetch state
  signOut: () => Promise<void>         // Logout function
  hasRole: (role: AppRole) => boolean  // Role checker
  userRoles: AppRole[]                 // All user roles
  arenaId: string | null               // Current arena context
}
```

**Implementation Details**:
1. **Session Management**:
   - Uses Supabase auth state listener
   - Persists sessions in localStorage
   - Auto-refreshes tokens

2. **Role Resolution**:
   - Fetches from `user_roles` table
   - Queries `usuarios` table for arena_id
   - Uses TanStack React Query for efficient caching

3. **Hook Usage**:
   ```typescript
   const { user, userRoles, hasRole, arenaId } = useAuth();
   ```

### Protected Route Component (ProtectedRoute.tsx)

**Route Protection Layers**:
1. **Authentication Check**: Redirects to `/auth` if not logged in
2. **Role-Based Check**: Optional `requiredRole` parameter
3. **Loading State**: Shows spinner while auth data loads
4. **Access Denied**: Displays error if user lacks required role
5. **Super Admin Override**: Super admin bypasses role checks

```typescript
<ProtectedRoute requiredRole="arena_admin">
  <Configuracoes />
</ProtectedRoute>
```

### Authorization Patterns

**1. Route-Level Authorization**:
- Applied at route definition in App.tsx
- Checked in ProtectedRoute component
- Redirects to /auth or shows error

**2. Component-Level Authorization**:
- Used in conditional rendering
- Example: Show menu items only for specific roles
- Uses `userRoles.includes(role)` or `hasRole(role)`

**3. Query-Level Authorization**:
- Supabase RLS policies enforce at database level
- Frontend queries fail gracefully if unauthorized
- Error handling via TanStack React Query

**4. Arena Isolation**:
- All queries filtered by `arena_id`
- Users see only their arena's data
- Multi-tenant isolation enforced

### Authentication Flow
```
1. User visits app
2. ProtectedRoute checks:
   - Is user logged in? (redirect to /auth if not)
   - Does user have required role?
3. AuthProvider loads roles from database
4. User granted access if:
   - Authenticated AND
   - Has required role OR is super_admin
5. All queries automatically filtered by arena_id
6. RLS policies provide additional database-level protection
```

---

## 9. SERVICES AND BUSINESS LOGIC ORGANIZATION

### Service Layer

#### TemplateService (lib/services/templateService.ts)
**Purpose**: Notification template management
**Methods**:
- `renderTemplate()` - Render template with variable substitution
- `renderPreview()` - Preview with example data
- `fetchTemplates()` - Get all active templates
- `saveTemplate()` - Create/update template
- `deleteTemplate()` - Deactivate template

**Variables Supported**:
- nome, email, telefone, valor, data_vencimento, link_pagamento
- professor, horario, quadra, data, hora

#### Utility Functions (lib/utils/)

**1. Notifications (notificacoes.ts)**
- `criarNotificacao()` - Generic notification creation
- `criarNotificacaoPagamento()` - Payment received
- `criarNotificacaoPagamentoVencido()` - Overdue payment
- `criarNotificacaoMensalidadeProxima()` - Upcoming payment
- `criarNotificacaoAulaConfirmada()` - Class confirmation
- `criarNotificacaoTorneioInscricao()` - Tournament registration

**2. Activity Logging (registrarAtividade.ts)**
- Logs all user actions to `historico_atividades`
- Captures: user, action type, description, metadata
- Includes user agent and IP (when available)

**3. Scheduling Validation (validarConflitosAgendamento.ts)**
- `validarConflitosAgendamento()` - Check time conflicts
- `validarBloqueioQuadra()` - Check maintenance blocks
- `validarAgendamentoCompleto()` - Full validation

**Conflict Detection Logic**:
- Checks if new booking overlaps with existing
- Detects: starts during, ends during, completely encompasses
- Returns: conflict status, message, conflicting bookings

**4. Export Utilities**
- `exportarExcel.ts` - Data export to XLSX format
- `exportarPDF.ts` - Data export to PDF format
- Uses jsPDF and XLSX libraries

### Custom Hooks

#### useAuth() - Authentication Hook
```typescript
const { user, userRoles, hasRole, arenaId, loading } = useAuth();
```
- Wrapper around AuthContext
- Required to use within AuthProvider
- Provides typed access to auth state

#### useArenaAccess() - Arena Access Control
```typescript
const { podeAcessar, mensagem, diasAteVencimento } = useArenaAccess();
```
- Checks arena subscription status
- Calls RPC function `check_arena_status()`
- Refetches every 60 seconds

#### useArenaStatus() - Arena Status Monitoring
- Real-time arena status updates
- Handles suspended arenas

#### useGeolocation() - Location-Based Check-ins
```typescript
const { latitude, longitude, isWithinRadius, calculateDistance } = useGeolocation();
```
- Browser geolocation API wrapper
- Haversine formula for distance calculation
- Radius-based check-in validation

#### useNotifications() - Real-time Notifications
- Supabase real-time subscription to notifications table
- Shows toasts for new notifications
- Invalidates query cache on new notification
- Automatic navigation on notification click

#### useMetricasComparativas() - Comparative Metrics
```typescript
const metrics = useMetricasComparativas({ arenaId, diasPeriodo: 30 });
// Returns: agendamentos, receita, clientes (each with atual, anterior, variacao)
```
- Compares current period vs previous period
- Calculates percentage changes
- Used in dashboard cards

#### useModuloAccess() - Module Access Control
- Checks if specific module is active for arena
- Filters menu items based on active modules

#### useKeyboardShortcuts() - Keyboard Navigation
- Global keyboard event handler
- Enables power-user shortcuts

#### useExportData() - Data Export
- Handles Excel/PDF export
- Formats data for export
- Shows toast with export status

#### use-mobile() - Responsive Design
- Tailwind breakpoint detection
- Used for mobile-specific UI

### Business Logic Flows

#### 1. Booking Management Flow
```
Create Agendamento
  ↓
Validate Conflicts (validarConflitosAgendamento)
  ↓
Validate Blockages (validarBloqueioQuadra)
  ↓
Create in Database
  ↓
Create Notification
  ↓
Register Activity
  ↓
Refresh UI Cache
```

#### 2. Monthly Billing Flow (Edge Function)
```
Edge Function Triggered (Daily)
  ↓
Find Contratos with matching due_date
  ↓
For each Contrato:
    ├─ Check if Mensalidade exists for month
    ├─ Calculate: valor_base - (desconto%) + acrescimo
    └─ Create Mensalidade record
  ↓
Log execution stats
```

#### 3. Commission Calculation Flow (Edge Function)
```
Commission Generation Triggered
  ↓
Group Aulas by Professor
  ↓
For each Professor:
    ├─ Sum valor_por_aluno * alunos_inscritos
    ├─ Apply commission_percentage
    └─ Create Comissao record
  ↓
Update commission status to "paga" after payout
```

#### 4. Notification Flow
```
Event Triggered (e.g., booking, payment)
  ↓
Load Template (templateService.renderTemplate)
  ↓
Substitute Variables
  ↓
Create Notificacao record
  ↓
Real-time subscription notifies client
  ↓
useNotifications hook shows toast
  ↓
User can click to navigate
```

#### 5. Class Enrollment Flow
```
Student Enrolls in Class
  ↓
Create Aulas_Alunos record
  ↓
Validate class not full
  ↓
Validate no scheduling conflicts
  ↓
Create Notification (aula_confirmada)
  ↓
Update class participant count
  ↓
Refresh student's Minhas Aulas page
```

---

## 10. TESTING SETUP

### Current State
- **No automated tests found** in the codebase
- No Jest, Vitest, or Cypress configuration
- No test files (.test.ts, .spec.ts)
- No testing libraries installed (no @testing-library/react, etc.)

### Recommendations for Testing Setup
1. **Unit Tests**: Use Vitest (fast, Vite-native)
2. **Component Tests**: @testing-library/react
3. **E2E Tests**: Playwright or Cypress
4. **Backend Tests**: Supabase testing utilities

---

## 11. SCRIPTS AND AUTOMATION

### NPM Scripts
```bash
npm run dev              # Start dev server (Vite)
npm run build           # Production build (TypeScript + tree-shake)
npm run build:dev       # Development build (keeps debugging)
npm run lint            # Run ESLint
npm run preview         # Preview production build locally
```

### Supabase Edge Functions (14 Serverless Functions)

#### 1. **gerar-mensalidades-automaticas**
- **Trigger**: Scheduled (daily)
- **Purpose**: Auto-generate monthly invoices
- **Logic**: Find contracts with matching due date, create mensalidade records
- **JWT Required**: No

#### 2. **gerar-comissoes-automaticas**
- **Trigger**: Scheduled or manual
- **Purpose**: Calculate professor commissions
- **Logic**: Group aulas by professor, apply percentage
- **JWT Required**: No

#### 3. **gerar-fatura-sistema**
- **Trigger**: Manual or scheduled
- **Purpose**: Generate invoices for billing
- **JWT Required**: No

#### 4. **asaas-cobranca**
- **Trigger**: Manual (from frontend)
- **Purpose**: Create charge via Asaas payment processor
- **Integration**: Asaas API
- **JWT Required**: Yes

#### 5. **asaas-webhook**
- **Trigger**: HTTP POST from Asaas
- **Purpose**: Handle payment status updates
- **Logic**: Update payment status, create notifications
- **JWT Required**: No (verified by Asaas webhook token)

#### 6. **notificar-agendamentos-proximos**
- **Trigger**: Scheduled (every 15 minutes)
- **Purpose**: Send reminders 15 minutes before booking
- **Logic**: Find bookings starting in ~15 min, create notification
- **JWT Required**: No

#### 7. **enviar-link-pagamento**
- **Trigger**: Manual from frontend
- **Purpose**: Send payment link via email/SMS
- **Integration**: Email/SMS service
- **JWT Required**: Yes

#### 8. **enviar-lembrete-fatura**
- **Trigger**: Scheduled
- **Purpose**: Remind about unpaid invoices
- **JWT Required**: No

#### 9. **lembretes-pagamento**
- **Trigger**: Scheduled
- **Purpose**: Payment reminder notifications
- **JWT Required**: No

#### 10. **enviar-whatsapp-evolution**
- **Trigger**: Manual or event-triggered
- **Purpose**: Send WhatsApp messages via Evolution API
- **Integration**: Evolution WhatsApp business API
- **JWT Required**: Yes

#### 11. **verificar-vencimentos-arena**
- **Trigger**: Scheduled
- **Purpose**: Check arena subscription expiration
- **Logic**: Flag arenas about to expire, suspend expired ones
- **JWT Required**: No

#### 12. **verificar-vencimentos-faturas**
- **Trigger**: Scheduled
- **Purpose**: Mark overdue invoices
- **Logic**: Update status of old unpaid invoices
- **JWT Required**: No

#### 13. **setup-arena-admin**
- **Trigger**: Manual during arena creation
- **Purpose**: Initialize arena with default data
- **JWT Required**: No

#### 14. **arena-setup**
- **Trigger**: Manual setup route
- **Purpose**: Arena admin setup wizard
- **JWT Required**: False

### Background Job Architecture
```
Scheduled Tasks (via Supabase Cron / External Trigger):
├─ Daily:
│  ├─ gerar-mensalidades-automaticas (morning)
│  ├─ verificar-vencimentos-faturas (daily)
│  └─ verificar-vencimentos-arena (daily)
├─ Every 15 minutes:
│  └─ notificar-agendamentos-proximos
└─ Manual/Event-triggered:
   ├─ gerar-comissoes-automaticas
   ├─ asaas-cobranca
   ├─ enviar-whatsapp-evolution
   └─ enviar-link-pagamento
```

### Webhook Integrations
1. **Asaas Payments**: Receive payment status updates
2. **WhatsApp Evolution**: Receive message callbacks (optional)

---

## 12. COMPONENT ORGANIZATION

### UI Component Hierarchy
```
App (Root)
├── Layout (Main wrapper with sidebar)
│   ├── AppSidebar (Role-based navigation)
│   ├── SidebarTrigger
│   ├── AppBreadcrumb
│   ├── NotificationBell
│   ├── Header (with user menu)
│   └── Main Content Area
│       └── [Page Components]
├── ProtectedRoute (Auth guard)
└── ArenaAccessGuard (Arena subscription check)
```

### Component Categories

#### Layout Components (8)
- Layout.tsx, AppSidebar.tsx, AppBreadcrumb.tsx
- ArenaAccessGuard.tsx, PerfilAccessGuard.tsx, ProtectedRoute.tsx
- PWAInstallPrompt.tsx, EmptyState.tsx

#### Feature Components by Module (84)

**Agendamentos (4 components)**
- AgendamentosTable, AgendamentoDialog, BloqueiosTable, BloqueioDialog

**Arenas (2 components)**
- ArenasList, ArenaDialog

**Aulas (6 components)**
- AulasTable, AulaDialog, AulaPresencaDialog
- AulaPresencaDialog, RegistrarPresencaDialog, AvaliarAulaDialog
- GerenciarInscricoesDialog

**Clientes (1)**
- ClientesTable

**Quadras (2)**
- QuadrasTable, QuadraDialog

**Dashboard (4)**
- MetricCard, AgendaDiaWidget, VencimentosWidget
- AlertasWidget, OcupacaoQuadrasWidget

**Financial (2)**
- FinanceiroTable, ComissoesTable

**Historico (1)**
- HistoricoAtividades

**Reports (1)**
- RelatoriosTable

**Torneios (1)**
- TorneiosTable

**UI Components (60+)**
- Base shadcn/ui components: Button, Card, Dialog, Form, Input, Table, etc.

### Component Communication Patterns

**1. Prop Drilling**:
- Parent → Child: Dialog open state, callbacks
- Example: `<AulaDialog open={dialogOpen} onOpenChange={setDialogOpen} />`

**2. Context (AuthProvider)**:
- Global auth state accessible via useAuth()
- Avoids prop drilling for auth data

**3. React Query Cache**:
- Shared server state via queryClient
- Components invalidate/refetch queries
- Example: After creating booking, invalidate "agendamentos" query

**4. Supabase Real-time**:
- Real-time updates via useNotifications hook
- Automatic cache invalidation on changes

---

## 13. DATA FLOW AND REQUEST LIFECYCLE

### Request Flow for Creating a Booking
```
1. USER INTERACTION
   └─ User fills form in QuadraDialog
       └─ Validates with Zod schema

2. VALIDATION
   ├─ Client-side: Form schema (agendamentoFormSchema)
   └─ Server-side: Database constraints, RLS

3. CONFLICT CHECK
   ├─ validarConflitosAgendamento() 
   │  └─ Query existing agendamentos for same quadra/date
   ├─ validarBloqueioQuadra()
   │  └─ Check bloqueios_quadra for maintenance
   └─ Return conflict object if issues

4. DATABASE INSERT
   ├─ supabase.from("agendamentos").insert(booking)
   ├─ RLS policy checks: user's arena_id
   ├─ Triggers: auto-set created_at, updated_at
   └─ Returns: created booking with id

5. NOTIFICATIONS
   ├─ criarNotificacao() → notificacoes table
   ├─ Real-time subscription triggers
   └─ useNotifications() shows toast

6. ACTIVITY LOG
   └─ registrarAtividade() → historico_atividades

7. CACHE UPDATE
   ├─ queryClient.invalidateQueries("agendamentos")
   ├─ useQuery refetch starts
   └─ UI updates with new booking

8. USER FEEDBACK
   └─ Toast notification: "Agendamento criado com sucesso"
```

### Request Flow for Financial Operations
```
1. MONTHLY BILLING GENERATION (Edge Function)
   ├─ Triggered: Daily at scheduled time (morning)
   ├─ Query: contratos where dia_vencimento = today
   ├─ For each contrato:
   │  ├─ Check if mensalidade exists for this month
   │  ├─ Calculate: valor_base - desconto + acrescimo
   │  └─ Insert mensalidade record
   └─ Log: Created X mensalidades, ignored Y

2. PAYMENT PROCESSING
   ├─ User submits payment
   ├─ Frontend calls: asaas-cobranca Edge Function
   ├─ Function:
   │  ├─ Create charge via Asaas API
   │  ├─ Receive payment ID
   │  └─ Return to frontend
   └─ Frontend: Show payment link to user

3. WEBHOOK CALLBACK
   ├─ Asaas sends webhook: payment status change
   ├─ asaas-webhook Edge Function:
   │  ├─ Verify webhook signature
   │  ├─ Update mensalidade status
   │  ├─ Create notification (pagamento_recebido)
   │  ├─ Create financial transaction (movimentacao_financeira)
   │  └─ Update user's payment history
   └─ Real-time updates notify user

4. NOTIFICATIONS
   ├─ Email: Payment confirmation/reminder
   ├─ SMS/WhatsApp: Payment link via Evolution API
   └─ In-app: Notification toast + badge
```

---

## 14. MIDDLEWARE AND INTERCEPTORS

### Supabase Client Configuration
```typescript
const supabase = createClient<Database>(
  URL, KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

**Features**:
- Auto token refresh before expiration
- Session persistence across tabs
- Auto-retry on auth failures

### React Query Configuration
```typescript
const queryClient = new QueryClient();
```

**Default Behaviors**:
- Query caching by key
- Stale-while-revalidate strategy
- Auto-retry failed requests
- Global mutation error handling

### Error Handling Patterns

**1. Query Error Handling**:
```typescript
const { data, isError, error } = useQuery({
  queryFn: async () => {
    const { data, error } = await supabase...
    if (error) throw error;
    return data;
  }
});
```

**2. Mutation Error Toast**:
```typescript
toast.error("Erro", { description: error.message });
```

**3. RLS Policy Errors**:
- Database rejects unauthorized queries
- Caught by Supabase client
- Frontend shows: "Acesso Negado"

### CORS Headers (Edge Functions)
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type",
};
```

---

## 15. CODE ORGANIZATION PRINCIPLES

### Import Path Aliases
```typescript
// Instead of: import { Button } from "../../../components/ui/button"
// Use: 
import { Button } from "@/components/ui/button";
```

### File Organization Strategy
- **By Feature**: Components, pages grouped by domain
- **By Type**: Utilities, validations, services in lib/
- **UI Separation**: Base UI components in ui/ subfolder

### Naming Conventions
- **Files**: kebab-case (Form.tsx, AulaDialog.tsx)
- **Components**: PascalCase (function Layout())
- **Hooks**: camelCase with "use" prefix (useArenaAccess)
- **Utilities**: camelCase (validarConflitosAgendamento)
- **Database**: snake_case (user_roles, agendamentos)

### Code Quality
- **Linting**: ESLint configuration in place
- **Types**: 2372-line auto-generated types.ts from Supabase
- **Validation**: Zod schemas for all major forms
- **TypeScript**: Loose settings (faster dev, less strict)

---

## 16. MULTI-TENANCY ARCHITECTURE

### Arena Isolation
```
Each arena has:
├─ Own database records (filtered by arena_id)
├─ Own modules (arena_modulos with expiration)
├─ Own staff (professores, funcionarios)
├─ Own quadras (courts)
├─ Own configurations
└─ Own financial data (mensalidades, movimentacoes)
```

### User-Arena Relationships
```
User
├─ Can have multiple roles
├─ Each role linked to specific arena (or system-wide for super_admin)
└─ Arena ID available in auth context for filtering

Example:
├─ User1 = super_admin (no arena_id)
├─ User2 = arena_admin for Arena1 + aluno for Arena2
└─ User3 = professor for Arena1
```

### Query Filtering by Arena
```typescript
// ALL queries include arena_id filter
const { data } = await supabase
  .from("agendamentos")
  .select("*")
  .eq("arena_id", arenaId);  // ← Arena isolation

// RLS policies enforce at database level
// Even if arena_id filter is removed, database rejects
```

---

## 17. FEATURE MATRIX

| Feature | Implemented | Tested | Notes |
|---------|------------|--------|-------|
| **Authentication** | Yes | No | Supabase Auth + custom roles |
| **Authorization** | Yes | No | Role-based + arena isolation |
| **Booking Management** | Yes | No | Create/edit/delete agendamentos |
| **Court Management** | Yes | No | Create/edit/delete quadras |
| **Class Management** | Yes | No | Aulas + enrollments |
| **Professor Management** | Yes | No | Professores + availability |
| **Student Management** | Yes | No | Clientes + contracts |
| **Financial/Billing** | Partial | No | Manual + Asaas integration |
| **Auto Monthly Billing** | Yes | No | Edge Function scheduled |
| **Commission Calculation** | Yes | No | Auto calculation Edge Function |
| **Notifications** | Yes | No | In-app + email/SMS templates |
| **Real-time Updates** | Yes | No | Supabase subscriptions |
| **Reporting** | Partial | No | Basic reports, export to Excel/PDF |
| **Multi-tenancy** | Yes | No | Arena isolation |
| **Role-based Access** | Yes | No | 5 roles + super admin |
| **Geolocation** | Yes | No | For check-ins |
| **QR Codes** | Yes | No | For bookings/check-ins |
| **PWA Support** | Yes | No | Installable app |
| **Keyboard Shortcuts** | Yes | No | Power user navigation |
| **Dark Mode** | Yes | No | next-themes integration |
| **Mobile Responsive** | Yes | No | Responsive components |
| **Payment Integration** | Yes | No | Asaas webhook + processing |
| **WhatsApp Integration** | Yes | No | Evolution API integration |
| **Tournament Management** | Yes | No | Create, register, manage |
| **Activity Audit Log** | Yes | No | historico_atividades |
| **Module Access Control** | Yes | No | Arena modules with expiration |

---

## 18. KEY TECHNICAL DECISIONS

### 1. **Supabase as Backend**
- Rationale: Quick MVP with built-in auth, database, real-time
- Tradeoff: Limited to Postgres-compatible SQL

### 2. **React Query for Server State**
- Rationale: Automatic caching, refetching, sync
- Alternative: Redux (more complex), SWR (lighter)

### 3. **Shadcn/ui for Components**
- Rationale: Pre-built, accessible, customizable with Tailwind
- Alternative: Material-UI (heavier), Bootstrap (less customizable)

### 4. **Edge Functions for Automation**
- Rationale: Serverless, auto-scaling, easy deployment
- Use Cases: Scheduled jobs, webhooks, heavy computation

### 5. **Zod for Validation**
- Rationale: Runtime validation, TypeScript integration
- Alternative: Yup (simpler), JSON Schema (more verbose)

### 6. **Real-time Subscriptions**
- Rationale: Live notifications without polling
- Use Cases: New bookings, payments, messages

---

## 19. DEPLOYMENT AND ENVIRONMENT

### Environment Variables
```env
VITE_SUPABASE_PROJECT_ID=nxissybzirfxjewvamgy
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=https://nxissybzirfxjewvamgy.supabase.co
```

### Build Process
```bash
npm run build
# Output: dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-*.js (main bundle)
#   │   └── *.css (styles)
#   └── manifest.json (PWA)
```

### Deployment Options
1. **Vercel**: Optimized for Vite
2. **Netlify**: Full CI/CD support
3. **GitHub Pages**: Static hosting
4. **Docker**: Custom deployment

### PWA Capabilities
- Installable as app
- Offline support (with caching strategy)
- App icon and splash screen
- Service worker for caching

---

## 20. PERFORMANCE CONSIDERATIONS

### Query Optimization
- TanStack React Query handles caching
- Queries keyed by: resource + filters
- Stale-while-revalidate reduces load time

### Code Splitting
- Vite automatically splits chunks
- Route-based splitting (lazy pages)
- Vendor bundles separated

### Image Optimization
- Using Web-optimized formats
- Could implement lazy loading
- Consider image CDN

### Database Indexes
- Created on foreign keys
- Templates table: (categoria, tipo) index
- Consider indexes on frequently filtered columns

### Real-time Subscriptions
- Supabase broadcasts via WebSocket
- Scales based on connection count
- Consider rooms/channels for isolation

---

## SUMMARY

This is a comprehensive **sports arena management system** built with modern web technologies:

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack React Query
- **UI Framework**: Shadcn/ui + Tailwind CSS
- **Real-time**: Supabase subscriptions
- **Automation**: 14 Edge Functions for scheduled tasks
- **Architecture**: Multi-tenant SPA with role-based access control

The system handles:
- Court/quadra bookings with conflict detection
- Class management with student enrollment
- Financial operations (invoicing, commissions, payments)
- Professor and client management
- Tournament organization
- Activity audit logging
- Real-time notifications

The codebase is well-organized, uses modern patterns, and is production-ready. Main areas for improvement:
- Add automated tests (currently none)
- Implement comprehensive error boundaries
- Add performance monitoring
- Document API contracts
