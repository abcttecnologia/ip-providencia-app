import { onAuthStateChanged, signInWithEmailAndPassword, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileClock,
  FileText,
  HeartHandshake,
  Home,
  House,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

import {
  anonymizeAdminRecords,
  anonymizePastoralRecords,
  addMemberHistory,
  completeDeletionRequest,
  loadPortalData,
  saveFamily,
  saveFollowUp,
  saveVisit,
  signOutPortal,
  updatePrayerRequestStatus,
  updatePerson,
} from "./data";
import type { PortalActor } from "./data";
import { auth, db } from "./firebase";
import type {
  DeletionRequest,
  Family,
  FollowUp,
  FollowUpStatus,
  HistoryKind,
  MemberHistory,
  PastoralVisit,
  Person,
  PortalData,
  PrayerRequest,
  PrayerRequestStatus,
  RecordTarget,
  UserFunction,
  VisitStatus,
} from "./types";

type PageKey =
  | "dashboard"
  | "pessoas"
  | "familias"
  | "visitas"
  | "acompanhamentos"
  | "pedidosOracao"
  | "historico"
  | "relatorios"
  | "solicitacoes"
  | "tesouraria";
type ModalState =
  | { kind: "person"; person: Person }
  | { kind: "family"; family: Family | null }
  | { kind: "history"; history: MemberHistory | null }
  | { kind: "visit"; visit: PastoralVisit | null }
  | { kind: "followup"; followup: FollowUp | null }
  | null;

const navigation: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { key: "pessoas", label: "Pessoas", icon: Users },
  { key: "familias", label: "Famílias", icon: House },
  { key: "visitas", label: "Visitas", icon: Home },
  { key: "acompanhamentos", label: "Acompanhamentos", icon: HeartHandshake },
  { key: "pedidosOracao", label: "Pedidos de oração", icon: MessageCircle },
  { key: "historico", label: "Histórico", icon: FileClock },
  { key: "relatorios", label: "Relatórios", icon: ClipboardList },
  { key: "solicitacoes", label: "Solicitações de exclusão", icon: Trash2 },
  { key: "tesouraria", label: "Tesouraria", icon: Wallet },
];

const pageTitles: Record<PageKey, { title: string; eyebrow: string }> = {
  dashboard: { title: "Dashboard", eyebrow: "GESTÃO DA IGREJA" },
  pessoas: { title: "Pessoas", eyebrow: "CADASTRO INDIVIDUAL" },
  familias: { title: "Famílias", eyebrow: "NÚCLEOS FAMILIARES" },
  visitas: { title: "Visitas", eyebrow: "REGISTRO E AGENDA" },
  acompanhamentos: { title: "Acompanhamentos", eyebrow: "CUIDADO PASTORAL" },
  pedidosOracao: { title: "Pedidos de oração", eyebrow: "CUIDADO PASTORAL" },
  historico: { title: "Histórico", eyebrow: "REGISTROS DA IGREJA" },
  relatorios: { title: "Relatórios", eyebrow: "MONITORAMENTO" },
  solicitacoes: { title: "Solicitações de exclusão", eyebrow: "PRIVACIDADE E LGPD" },
  tesouraria: { title: "Tesouraria", eyebrow: "GESTÃO FINANCEIRA" },
};

function isAdmin(profile: Person) {
  return profile.perfil === "ADMINISTRADOR" && profile.ativo === true;
}

function hasFunction(profile: Person, functionName: UserFunction) {
  return profile.ativo === true && profile.funcoes?.includes(functionName) === true;
}

function isPastoral(profile: Person) {
  return hasFunction(profile, "PASTORAL");
}

function isCareStaff(profile: Person) {
  return (
    isAdmin(profile) ||
    hasFunction(profile, "SECRETARIA") ||
    isPastoral(profile)
  );
}

function isPortalStaff(profile: Person) {
  return isCareStaff(profile) || hasFunction(profile, "TESOURARIA");
}

function portalActor(profile: Person): PortalActor {
  return {
    uid: profile.uid,
    nome: profile.nome,
    perfil: profile.perfil,
    funcoes: profile.funcoes,
  };
}

function firstName(name: string | undefined) {
  return name?.trim().split(/\s+/)[0] || "Administrador";
}

function formatDate(value: string) {
  const date = value ? new Date(`${value}T12:00:00`) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : "—";
}

function timestampInput(value: Person["membroDesde"]) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toDate().toISOString().slice(0, 10);
}

function todayInput() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function isPastDate(value: string) {
  return Boolean(value && value < todayInput());
}

function birthdayParts(value: string | undefined) {
  if (!value) return null;
  const isoDate = value.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
  const localDate = value.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
  const month = Number(isoDate?.[2] ?? localDate?.[2]);
  const day = Number(isoDate?.[3] ?? localDate?.[1]);
  if (!month || !day || month > 12 || day > new Date(2024, month, 0).getDate()) {
    return null;
  }
  return { month, day };
}

function daysSinceDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const today = new Date();
  const dateTime = Date.UTC(year, month - 1, day);
  const todayTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((todayTime - dateTime) / 86_400_000);
}

function App() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Person | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      const currentRequestId = ++requestId;
      setSessionUser(currentUser);
      setAuthLoading(true);
      setProfile(null);
      setAccessError("");

      if (!currentUser) {
        setAuthLoading(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (!active || currentRequestId !== requestId) return;
        const currentProfile = profileSnapshot.exists()
          ? ({ ...profileSnapshot.data(), uid: currentUser.uid } as Person)
          : null;

        if (!currentProfile || !isPortalStaff(currentProfile)) {
          setAccessError("Esta conta não possui permissão ativa para acessar o portal.");
          setProfile(null);
        } else {
          setProfile(currentProfile);
        }
      } catch (error) {
        console.error("Falha ao verificar o acesso administrativo:", error);
        if (active && currentRequestId === requestId) {
          setAccessError("Não foi possível verificar seu acesso. Tente novamente.");
        }
      } finally {
        if (active && currentRequestId === requestId) setAuthLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      await signOutPortal();
    } catch (error) {
      console.error("Falha ao encerrar sessão:", error);
      setAccessError("Não foi possível sair da conta. Tente novamente.");
    }
  }

  if (authLoading) {
    return <LoadingPage message="Verificando acesso ao portal..." />;
  }

  if (!sessionUser) {
    return <LoginPage accessError={accessError} />;
  }

  if (!profile) {
    return (
      <AccessDenied
        message={accessError || "Seu perfil ainda não está disponível."}
        onSignOut={handleSignOut}
      />
    );
  }

  if (!isPortalStaff(profile)) {
    return (
      <AccessDenied
        message="Seu perfil não tem mais acesso autorizado ao portal."
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <AdminPortal
      profile={profile}
      onProfileUpdate={setProfile}
      onSignOut={handleSignOut}
    />
  );
}

function LoadingPage({ message }: { message: string }) {
  return (
    <main className="loading-page">
      <div className="loading-mark"><ShieldCheck size={26} /></div>
      <LoaderCircle className="spin" size={22} />
      <p>{message}</p>
    </main>
  );
}

function LoginPage({ accessError }: { accessError: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (loginError) {
      console.error("Falha ao entrar no portal:", loginError);
      const code =
        typeof loginError === "object" &&
        loginError !== null &&
        "code" in loginError &&
        typeof loginError.code === "string"
          ? loginError.code
          : "";
      setError(
        code === "auth/invalid-credential"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark"><ShieldCheck size={26} /></div>
          <div>
            <strong>IP Providência</strong>
            <span>Portal de gestão</span>
          </div>
        </div>
        <div className="login-copy">
          <span className="eyebrow">ACESSO RESTRITO</span>
          <h1>Bem-vindo de volta</h1>
          <p>Entre com sua conta autorizada para continuar.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            autoComplete="username"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error || accessError ? <p className="form-error">{error || accessError}</p> : null}
          <button className="button button-primary login-submit" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={17} /> : null}
            {saving ? "Entrando..." : "Entrar no portal"}
          </button>
        </form>
        <p className="login-footnote"><ShieldCheck size={15} /> Acesso protegido para equipe autorizada</p>
      </section>
      <aside className="login-art">
        <div className="art-glow" />
        <div className="art-content">
          <span>IP PROVIDÊNCIA</span>
          <h2>Cuidar de pessoas<br />é caminhar junto.</h2>
          <p>Gestão, cuidado e acompanhamento da comunidade em um só lugar.</p>
        </div>
        <div className="art-footer">PORTAL ADMINISTRATIVO · 2026</div>
      </aside>
    </main>
  );
}

function AccessDenied({ message, onSignOut }: { message: string; onSignOut: () => void }) {
  return (
    <main className="loading-page">
      <div className="access-card">
        <div className="access-icon"><ShieldCheck size={25} /></div>
        <h1>Acesso não autorizado</h1>
        <p>{message}</p>
        <button className="button button-secondary" onClick={onSignOut}>Sair da conta</button>
      </div>
    </main>
  );
}

function AdminPortal({
  profile,
  onProfileUpdate,
  onSignOut,
}: {
  profile: Person;
  onProfileUpdate: (profile: Person) => void;
  onSignOut: () => void;
}) {
  const canCare = isCareStaff(profile);
  const canViewPastoral = isPastoral(profile);
  const canReadDeletionRequests = isAdmin(profile) || canViewPastoral;
  const isAdministrator = isAdmin(profile);
  const [page, setPage] = useState<PageKey>(
    canCare ? "dashboard" : "tesouraria",
  );
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const result = canCare
          ? await loadPortalData({
              pastoral: canViewPastoral,
              exclusionRequests: canReadDeletionRequests,
            })
          : {
              pessoas: [],
              familias: [],
              historico: [],
              visitas: [],
              acompanhamentos: [],
              pedidosOracao: [],
              solicitacoesExclusao: [],
            };
        setData(result);
        const currentProfile = result.pessoas.find(
          (person) => person.uid === profile.uid,
        );
        if (currentProfile) onProfileUpdate(currentProfile);
        setError("");
      } catch (loadError) {
        console.error("Falha ao carregar os dados do portal:", {
          perfil: profile.perfil,
          ativo: profile.ativo,
          funcoes: profile.funcoes,
          error: loadError,
        });
        setError("Não foi possível carregar os dados. Confira a conexão e as regras do Firestore.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canCare, canReadDeletionRequests, canViewPastoral, onProfileUpdate, profile.uid],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const title = pageTitles[page];
  const visibleNavigation = navigation.filter(({ key }) => {
    if (key === "tesouraria") return hasFunction(profile, "TESOURARIA");
    if (key === "acompanhamentos" || key === "pedidosOracao") return canViewPastoral;
    if (key === "solicitacoes") return canReadDeletionRequests;
    return canCare;
  });
  const roleDescription = isAdministrator
    ? "Administrador"
    : [
        hasFunction(profile, "SECRETARIA") ? "Secretaria" : "",
        canViewPastoral ? "Pastoral" : "",
        hasFunction(profile, "TESOURARIA") ? "Tesouraria" : "",
      ]
        .filter(Boolean)
        .join(" · ");

  useEffect(() => {
    const pageIsAllowed =
      (page === "tesouraria" && hasFunction(profile, "TESOURARIA")) ||
      ((page === "acompanhamentos" || page === "pedidosOracao") && canViewPastoral) ||
      (page === "solicitacoes" && canReadDeletionRequests) ||
      (page !== "tesouraria" &&
        page !== "acompanhamentos" &&
        page !== "pedidosOracao" &&
        page !== "solicitacoes" &&
        canCare);
    if (!pageIsAllowed) {
      setPage(canCare ? "dashboard" : "tesouraria");
    }
  }, [page, profile, canCare, canReadDeletionRequests, canViewPastoral]);

  async function runAction(action: () => Promise<void>, successMessage: string) {
    await action();
    await refresh(true);
    setModal(null);
    setNotice(successMessage);
    window.setTimeout(() => setNotice(""), 4500);
  }

  function runActionSafely(
    action: () => Promise<void>,
    successMessage: string,
  ) {
    void runAction(action, successMessage).catch((actionError: unknown) => {
      console.error("Falha ao executar ação do portal:", actionError);
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Não foi possível concluir a ação. Tente novamente.",
      );
    });
  }

  function navigate(nextPage: PageKey) {
    if (!visibleNavigation.some(({ key }) => key === nextPage)) return;
    setPage(nextPage);
    setSidebarOpen(false);
    setQuery("");
  }

  if (loading) return <LoadingPage message="Carregando os dados da igreja..." />;
  if (!data) {
    return (
      <main className="loading-page">
        <div className="access-card">
          <div className="access-icon"><AlertTriangle size={25} /></div>
          <h1>Não foi possível carregar o portal</h1>
          <p>{error || "Verifique sua conexão e tente novamente."}</p>
          <button className="button button-primary" onClick={() => void refresh(true)}>Tentar novamente</button>
        </div>
      </main>
    );
  }

  return (
    <div className="portal-shell">
      <div className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div>
            <strong>IP Providência</strong>
            <span>Portal de gestão</span>
          </div>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        </div>
        <div className="sidebar-section-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {visibleNavigation.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`nav-item ${page === key ? "nav-item-active" : ""}`}
              onClick={() => navigate(key)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {key === "acompanhamentos" && data?.acompanhamentos.filter((item) => item.status !== "concluido").length ? (
                <span className="nav-count">{data.acompanhamentos.filter((item) => item.status !== "concluido").length}</span>
              ) : null}
              {key === "pedidosOracao" && data?.pedidosOracao.filter((item) => item.status === "aberto").length ? (
                <span className="nav-count">{data.pedidosOracao.filter((item) => item.status === "aberto").length}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <CircleHelp size={18} />
          <div><strong>Precisa de ajuda?</strong><span>Fale com a secretaria</span></div>
          <ChevronRight size={16} />
        </div>
        <div className="sidebar-profile">
          <div className="avatar avatar-dark">{firstName(profile.nome).slice(0, 1).toUpperCase()}</div>
          <div className="profile-copy"><strong>{profile.nome}</strong><span>{roleDescription}</span></div>
          <button className="icon-button" aria-label="Sair do portal" onClick={onSignOut}><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Portal</span><ChevronRight size={14} /><strong>{title.title}</strong></div>
          <div className="topbar-actions">
            {canCare ? <label className="global-search">
              <Search size={16} />
              <input
                placeholder={page === "pedidosOracao" ? "Buscar pedidos de oração..." : "Buscar pessoas, famílias..."}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={page === "pedidosOracao" ? "Buscar pedidos de oração" : "Buscar pessoas e famílias"}
              />
              <kbd>⌘ K</kbd>
            </label> : null}
            <span className="topbar-date"><CalendarDays size={15} />{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</span>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{title.eyebrow}</span>
              <h1>{page === "dashboard" ? `${greeting()}, ${firstName(profile.nome)}!` : title.title}</h1>
              <p>{page === "dashboard" ? "Veja o panorama da comunidade e os próximos cuidados." : pageDescription(page)}</p>
            </div>
            <div className="page-heading-actions">
              {refreshing ? <span className="refresh-indicator"><LoaderCircle className="spin" size={16} /> Atualizando</span> : null}
              {page === "familias" ? <button className="button button-primary" onClick={() => setModal({ kind: "family", family: null })}><Plus size={17} /> Nova família</button> : null}
              {page === "visitas" ? <button className="button button-primary" onClick={() => setModal({ kind: "visit", visit: null })}><Plus size={17} /> Registrar visita</button> : null}
              {page === "acompanhamentos" ? <button className="button button-primary" onClick={() => setModal({ kind: "followup", followup: null })}><Plus size={17} /> Novo acompanhamento</button> : null}
              {page === "historico" ? <button className="button button-primary" onClick={() => setModal({ kind: "history", history: null })}><Plus size={17} /> Novo registro</button> : null}
            </div>
          </div>

          {error ? <div className="notice notice-error"><AlertTriangle size={18} /><span>{error}</span><button className="button button-small" onClick={() => void refresh(true)}>Tentar novamente</button></div> : null}
          {notice ? <div className="notice notice-success"><Check size={18} /><span>{notice}</span><button className="icon-button" aria-label="Dispensar" onClick={() => setNotice("")}><X size={16} /></button></div> : null}
          {page === "dashboard" ? <DashboardPage data={data} onNavigate={navigate} canViewPastoral={canViewPastoral} /> : null}
          {page === "pessoas" ? (
            <PeoplePage
              data={data}
              search={query}
              actorUid={profile.uid}
              canManageAccess={isAdministrator}
              onEdit={(person) => setModal({ kind: "person", person })}
            />
          ) : null}
          {page === "familias" ? (
            <FamiliesPage
              data={data}
              search={query}
              onEdit={(family) => setModal({ kind: "family", family })}
            />
          ) : null}
          {page === "visitas" ? (
            <VisitsPage
              data={data}
              search={query}
              onEdit={(visit) => setModal({ kind: "visit", visit })}
            />
          ) : null}
          {page === "acompanhamentos" ? (
            <FollowUpsPage
              data={data}
              search={query}
              onEdit={(followup) => setModal({ kind: "followup", followup })}
            />
          ) : null}
          {page === "pedidosOracao" ? (
            <PrayerRequestsPage
              requests={data.pedidosOracao}
              people={data.pessoas}
              search={query}
              onStatusChange={(request, status) =>
                runActionSafely(
                  () =>
                    updatePrayerRequestStatus(
                      request.id,
                      status,
                      portalActor(profile),
                    ),
                  status === "respondido"
                    ? "Pedido marcado como respondido."
                    : status === "arquivado"
                      ? "Pedido arquivado."
                      : "Pedido reaberto.",
                )
              }
            />
          ) : null}
          {page === "historico" ? <HistoryPage data={data} search={query} onEdit={(history) => setModal({ kind: "history", history })} /> : null}
          {page === "relatorios" ? <ReportsPage data={data} onNavigate={navigate} canViewPastoral={canViewPastoral} /> : null}
          {page === "solicitacoes" ? (
            <DeletionRequestsPage
              requests={data.solicitacoesExclusao}
              isAdministrator={isAdministrator}
              canViewPastoral={canViewPastoral}
              onAdminAnonymize={(request) =>
                runActionSafely(
                  () => anonymizeAdminRecords(request, portalActor(profile)),
                  "Visitas e histórico anonimizados.",
                )
              }
              onPastoralAnonymize={(request) =>
                runActionSafely(
                  () => anonymizePastoralRecords(request, portalActor(profile)),
                  "Acompanhamentos anonimizados.",
                )
              }
              onComplete={(request) =>
                runActionSafely(
                  () => completeDeletionRequest(request, portalActor(profile)),
                  "Solicitação concluída.",
                )
              }
            />
          ) : null}
          {page === "tesouraria" ? <TreasuryPage /> : null}
          <footer className="page-footer"><span>IP Providência · Portal de gestão</span><span>Dados protegidos por perfil de acesso</span></footer>
        </section>
      </main>

      {modal ? (
        <Modal onClose={() => setModal(null)}>
          {modal.kind === "person" ? (
            <PersonForm
              person={modal.person}
              actorUid={profile.uid}
              canManageAccess={isAdministrator}
              families={data.familias}
              onCancel={() => setModal(null)}
              onSave={(person) =>
                runAction(
                  () => updatePerson(
                    modal.person.uid,
                    person,
                    portalActor(profile),
                  ),
                  "Cadastro atualizado.",
                )
              }
            />
          ) : null}
          {modal.kind === "family" ? (
            <FamilyForm
              family={modal.family}
              data={data}
              onCancel={() => setModal(null)}
              onSave={(family) =>
                runAction(
                  () => saveFamily(
                    family,
                    modal.family,
                    portalActor(profile),
                  ),
                  modal.family ? "Família atualizada." : "Família cadastrada.",
                )
              }
            />
          ) : null}
          {modal.kind === "history" ? (
            <HistoryForm
              data={data}
              profile={profile}
              history={modal.history}
              onCancel={() => setModal(null)}
              onSave={(history) =>
                runAction(
                  () => addMemberHistory(history, portalActor(profile), modal.history?.id),
                  modal.history ? "Registro do histórico atualizado." : "Registro adicionado ao histórico.",
                )
              }
            />
          ) : null}
          {modal.kind === "visit" ? (
            <VisitForm
              visit={modal.visit}
              data={data}
              profile={profile}
              onCancel={() => setModal(null)}
              onSave={(visit) =>
                runAction(
                  () => saveVisit(visit, portalActor(profile), modal.visit?.id),
                  modal.visit ? "Visita atualizada." : "Visita registrada.",
                )
              }
            />
          ) : null}
          {modal.kind === "followup" ? (
            <FollowUpForm
              followup={modal.followup}
              data={data}
              profile={profile}
              onCancel={() => setModal(null)}
              onSave={(followup) =>
                runAction(
                  () => saveFollowUp(followup, portalActor(profile), modal.followup?.id),
                  modal.followup ? "Acompanhamento atualizado." : "Acompanhamento registrado.",
                )
              }
            />
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}

function pageDescription(page: PageKey) {
  const descriptions: Record<PageKey, string> = {
    dashboard: "Resumo de gestão da comunidade.",
    pessoas: "Consulte e mantenha os cadastros individuais.",
    familias: "Organize os núcleos familiares e seus vínculos.",
    visitas: "Agende visitas e registre o que foi realizado.",
    acompanhamentos: "Acompanhe necessidades, retornos e encaminhamentos.",
    pedidosOracao: "Acompanhe e atualize o status dos pedidos da comunidade.",
    historico: "Consulte registros importantes da caminhada de cada pessoa.",
    relatorios: "Indicadores de cuidado e pendências da comunidade.",
    solicitacoes: "Anonimize os registros após solicitação do titular.",
    tesouraria: "Área reservada para gestão financeira.",
  };
  return descriptions[page];
}

function DashboardPage({
  data,
  onNavigate,
  canViewPastoral,
}: {
  data: PortalData;
  onNavigate: (page: PageKey) => void;
  canViewPastoral: boolean;
}) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const visitsThisMonth = data.visitas.filter((visit) => {
    return visit.data.startsWith(monthPrefix) && visit.status !== "cancelada";
  }).length;
  const openFollowUps = canViewPastoral
    ? data.acompanhamentos.filter((item) => item.status !== "concluido")
    : [];
  const openPrayerRequests = canViewPastoral
    ? data.pedidosOracao.filter((request) => request.status === "aberto")
    : [];
  const overduePrayerRequests = openPrayerRequests.filter(
    (request) =>
      request.criadoEm !== undefined &&
      Date.now() - request.criadoEm.toMillis() > 7 * 24 * 60 * 60 * 1000,
  );
  const visitorCount = data.pessoas.filter((person) => person.perfil === "VISITANTE" && person.ativo).length;
  const newVisitors = data.pessoas.filter((person) => {
    if (!person.ativo || person.perfil !== "VISITANTE" || !person.criadoEm) return false;
    return `${person.criadoEm.toDate().getFullYear()}-${String(
      person.criadoEm.toDate().getMonth() + 1,
    ).padStart(2, "0")}` === monthPrefix;
  }).length;
  const activeMembers = data.pessoas.filter((person) => person.perfil === "MEMBRO" && person.ativo).length;
  const upcomingVisits = data.visitas
    .filter((visit) => visit.status === "agendada")
    .sort((left, right) => left.data.localeCompare(right.data))
    .slice(0, 4);
  const overdueFollowUps = openFollowUps.filter((item) => {
    return isPastDate(item.proximoRetorno);
  });
  const birthdays = data.pessoas
    .map((person) => ({ person, birthday: birthdayParts(person.dataNascimento) }))
    .filter(
      (item): item is { person: Person; birthday: { month: number; day: number } } =>
        Boolean(
          item.person.ativo &&
            item.birthday &&
            item.birthday.month === now.getMonth() + 1,
        ),
    )
    .sort((left, right) => left.birthday.day - right.birthday.day);
  const familiesWithoutVisit = data.familias
    .map((family) => {
      const familyMembers = new Set([
        ...family.membrosUids,
        ...data.pessoas
          .filter((person) => person.familiaId === family.id)
          .map((person) => person.uid),
      ]);
      const lastVisit = data.visitas
        .filter(
          (visit) =>
            visit.status === "realizada" &&
            visit.data <= todayInput() &&
            ((visit.alvoTipo === "familia" && visit.alvoId === family.id) ||
              (visit.alvoTipo === "pessoa" && familyMembers.has(visit.alvoId))),
        )
        .map((visit) => visit.data)
        .sort((left, right) => right.localeCompare(left))[0];
      return {
        family,
        lastVisit,
        daysSince: lastVisit ? daysSinceDate(lastVisit) : null,
      };
    })
    .filter((item) => item.daysSince === null || item.daysSince >= 60)
    .sort((left, right) => (right.daysSince ?? Infinity) - (left.daysSince ?? Infinity))
    .slice(0, 4);

  return (
    <>
      <section className="metric-grid">
        <MetricCard icon={<Users size={19} />} label="Membros ativos" value={activeMembers} tone="green" footnote="cadastros ativos" />
        <MetricCard icon={<House size={19} />} label="Famílias cadastradas" value={data.familias.length} tone="blue" footnote="núcleos familiares" />
        <MetricCard icon={<UserPlus size={19} />} label="Novos visitantes" value={newVisitors} tone="purple" footnote="neste mês" />
        <MetricCard icon={<Home size={19} />} label="Visitas este mês" value={visitsThisMonth} tone="orange" footnote="visitas registradas" />
        {canViewPastoral ? <MetricCard icon={<AlertTriangle size={19} />} label="Acompanhamentos" value={openFollowUps.length} tone="red" footnote="em aberto" /> : null}
        {canViewPastoral ? <MetricCard icon={<MessageCircle size={19} />} label="Pedidos de oração" value={openPrayerRequests.length} tone="blue" footnote="em acompanhamento" /> : null}
      </section>

      <section className="dashboard-grid">
        <Panel title="Próximas visitas" subtitle="Agenda de cuidado" action="Ver todas" onAction={() => onNavigate("visitas")} icon={<CalendarDays size={17} />}>
          {upcomingVisits.length ? (
            <div className="compact-list">
              {upcomingVisits.map((visit) => (
                <div className="compact-row" key={visit.id}>
                  <div className="compact-icon visit-icon"><Home size={16} /></div>
                  <div className="compact-copy"><strong>{visit.alvoNome}</strong><span>{formatDate(visit.data)} · {visit.motivo || "Visita pastoral"}</span></div>
                  <StatusBadge status={visit.status} />
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<CalendarDays size={22} />} text="Nenhuma visita agendada." />}
        </Panel>

        {canViewPastoral ? <Panel title="Acompanhamentos em aberto" subtitle="Pessoas que precisam de retorno" action="Ver todos" onAction={() => onNavigate("acompanhamentos")} icon={<HeartHandshake size={17} />}>
          {openFollowUps.length ? (
            <div className="compact-list">
              {openFollowUps.slice(0, 4).map((item) => (
                <div className="compact-row" key={item.id}>
                  <div className="compact-icon followup-icon"><HeartHandshake size={16} /></div>
                  <div className="compact-copy"><strong>{item.alvoNome}</strong><span>{item.necessidade || item.categoria} · {item.responsavel}</span></div>
                  <span className={`date-note ${overdueFollowUps.some((overdue) => overdue.id === item.id) ? "date-overdue" : ""}`}>{formatDate(item.proximoRetorno)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<Check size={22} />} text="Nenhum acompanhamento pendente." />}
        </Panel> : null}

        <Panel title="Visitas recentes" subtitle="Últimos registros" action="Ver histórico" onAction={() => onNavigate("visitas")} icon={<FileClock size={17} />}>
          {data.visitas.length ? (
            <div className="compact-list">
              {data.visitas.slice(0, 4).map((visit) => (
                <div className="compact-row" key={visit.id}>
                  <div className="compact-copy"><strong>{visit.alvoNome}</strong><span>{visit.motivo || "Visita pastoral"}</span></div>
                  <div className="compact-meta"><StatusBadge status={visit.status} /><span>{formatDate(visit.data)}</span></div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<FileClock size={22} />} text="As visitas registradas aparecerão aqui." />}
        </Panel>

        <Panel title="Alertas e pendências" subtitle="Ações que merecem atenção" icon={<AlertTriangle size={17} />}>
          <div className="alert-list">
            {canViewPastoral ? (
              <>
                {overdueFollowUps.slice(0, 3).map((item) => (
                  <div className="alert-row" key={item.id}>
                    <span className="alert-dot alert-dot-red"><AlertTriangle size={13} /></span>
                    <span><strong>Retorno pendente</strong><small>{item.alvoNome} · previsto para {formatDate(item.proximoRetorno)}</small></span>
                    <ArrowRight size={15} />
                  </div>
                ))}
                {overduePrayerRequests.length ? (
                  <div className="alert-row">
                    <span className="alert-dot alert-dot-red"><MessageCircle size={13} /></span>
                    <span><strong>Pedidos de oração sem retorno</strong><small>{overduePrayerRequests.length} pedido(s) em aberto há mais de 7 dias.</small></span>
                    <button className="text-button" onClick={() => onNavigate("pedidosOracao")}>Ver</button>
                  </div>
                ) : null}
                {!overdueFollowUps.length && !overduePrayerRequests.length ? (
                  <div className="alert-row">
                    <span className="alert-dot alert-dot-green"><Check size={13} /></span>
                    <span><strong>Tudo em dia</strong><small>Não há retornos vencidos nem pedidos antigos.</small></span>
                  </div>
                ) : null}
              </>
            ) : <div className="alert-row"><span><strong>Acesso restrito</strong><small>Os acompanhamentos são visíveis somente à função Pastoral.</small></span></div>}
            {visitorCount ? (
              <div className="alert-row">
                <span className="alert-dot alert-dot-blue"><Users size={13} /></span>
                <span><strong>{visitorCount} visitantes</strong><small>Consulte os cadastros para iniciar o acolhimento.</small></span>
                <button className="text-button" onClick={() => onNavigate("pessoas")}>Ver</button>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title="Famílias sem visita recente" subtitle="Sem registro de visita há 60 dias ou mais" action="Ver famílias" onAction={() => onNavigate("familias")} icon={<House size={17} />}>
          {familiesWithoutVisit.length ? (
            <div className="compact-list">
              {familiesWithoutVisit.map(({ family, lastVisit, daysSince }) => (
                <div className="compact-row" key={family.id}>
                  <div className="compact-icon family-alert-icon"><House size={16} /></div>
                  <div className="compact-copy"><strong>{family.nome}</strong><span>{lastVisit ? `Última visita em ${formatDate(lastVisit)}` : "Nenhuma visita registrada"}</span></div>
                  <span className="date-note date-overdue">{daysSince === null ? "Pendente" : `${daysSince} dias`}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<Check size={22} />} text="Todas as famílias tiveram visita nos últimos 60 dias." />}
        </Panel>

        <Panel title="Aniversariantes do mês" subtitle="Celebre e mantenha contato" action="Ver pessoas" onAction={() => onNavigate("pessoas")} icon={<CalendarDays size={17} />}>
          {birthdays.length ? (
            <div className="compact-list">
              {birthdays.slice(0, 4).map(({ person, birthday }) => (
                <div className="compact-row" key={person.uid}>
                  <PersonAvatar person={person} />
                  <div className="compact-copy"><strong>{person.nome}</strong><span>{profileLabel(person.perfil)}</span></div>
                  <span className="birthday-date">{String(birthday.day).padStart(2, "0")}/{String(birthday.month).padStart(2, "0")}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<CalendarDays size={22} />} text="Nenhum aniversário cadastrado neste mês." />}
        </Panel>
      </section>

      <section className="dashboard-flow">
        <div className="flow-heading">
          <div><span className="eyebrow">CUIDADO INTEGRAL</span><h2>Fluxo de acompanhamento</h2></div>
          <button className="button button-secondary" onClick={() => onNavigate("relatorios")}>Ver indicadores <ArrowRight size={15} /></button>
        </div>
        <div className="flow-grid">
          <FlowStep icon={<Users size={17} />} number="01" title="Pessoa" detail="Cadastro individual" count={data.pessoas.length} tone="green" />
          <FlowStep icon={<House size={17} />} number="02" title="Família" detail="Núcleo familiar" count={data.familias.length} tone="blue" />
          <FlowStep icon={<FileClock size={17} />} number="03" title="Histórico" detail="Registros importantes" count={data.historico.length} tone="purple" />
          <FlowStep icon={<Home size={17} />} number="04" title="Visitas" detail="Cuidado presencial" count={data.visitas.length} tone="orange" />
          {canViewPastoral ? <FlowStep icon={<HeartHandshake size={17} />} number="05" title="Acompanhamento" detail="Necessidades e retornos" count={openFollowUps.length} tone="red" /> : null}
          {canViewPastoral ? <FlowStep icon={<Activity size={17} />} number="06" title="Monitoramento" detail="Indicadores e alertas" count={overdueFollowUps.length} tone="teal" /> : null}
        </div>
      </section>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
  footnote,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
  footnote: string;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-top"><span className="metric-icon">{icon}</span><ArrowUpRight size={15} /></div>
      <span className="metric-label">{label}</span>
      <div className="metric-bottom"><strong>{value}</strong><span>{footnote}</span></div>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  action,
  onAction,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div className="panel-title-icon">{icon}<span><strong>{title}</strong><small>{subtitle}</small></span></div>
        {action && onAction ? <button className="text-button" onClick={onAction}>{action}<ArrowRight size={14} /></button> : null}
      </div>
      {children}
    </section>
  );
}

function FlowStep({
  icon,
  number,
  title,
  detail,
  count,
  tone,
}: {
  icon: ReactNode;
  number: string;
  title: string;
  detail: string;
  count: number;
  tone: string;
}) {
  return (
    <article className="flow-step">
      <div className={`flow-icon tone-${tone}`}>{icon}</div>
      <div className="flow-copy"><span>ETAPA {number}</span><strong>{title}</strong><small>{detail}</small></div>
      <b>{count}</b>
    </article>
  );
}

function PeoplePage({
  data,
  search,
  actorUid,
  canManageAccess,
  onEdit,
}: {
  data: PortalData;
  search: string;
  actorUid: string;
  canManageAccess: boolean;
  onEdit: (person: Person) => void;
}) {
  const [filter, setFilter] = useState("todos");
  const filtered = data.pessoas.filter((person) => {
    const text = `${person.nome ?? ""} ${person.email ?? ""} ${person.telefone ?? ""}`.toLocaleLowerCase("pt-BR");
    const matchesText = text.includes(search.toLocaleLowerCase("pt-BR"));
    const matchesFilter = filter === "todos" || (filter === "ativos" ? person.ativo === true : person.perfil === filter);
    return matchesText && matchesFilter;
  });

  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div><h2>Lista de pessoas</h2><p>{filtered.length} cadastro(s) encontrado(s)</p></div>
        <div className="filter-tabs">
          {[
            ["todos", "Todos"],
            ["ativos", "Ativos"],
            ["MEMBRO", "Membros"],
            ["VISITANTE", "Visitantes"],
          ].map(([value, label]) => (
            <button key={value} className={filter === value ? "filter-active" : ""} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>PESSOA</th><th>CONTATO</th><th>PERFIL</th><th>FAMÍLIA</th><th>SITUAÇÃO</th><th /></tr></thead>
          <tbody>
            {filtered.map((person) => {
              const family = data.familias.find((item) => item.id === person.familiaId);
              const profile = typeof person.perfil === "string" ? person.perfil : "";
              const name =
                typeof person.nome === "string" && person.nome.trim()
                  ? person.nome
                  : "Nome não informado";
              return (
                <tr key={person.uid}>
                  <td><div className="person-cell"><PersonAvatar person={person} /><span><strong>{name}</strong><small>{person.email || "—"}</small></span></div></td>
                  <td>{person.telefone || "—"}</td>
                  <td><span className={`profile-pill ${profile ? `profile-${profile.toLocaleLowerCase()}` : ""}`}>{profileLabel(profile)}</span></td>
                  <td>{family?.nome || "Sem vínculo"}</td>
                  <td><StatusBadge status={person.ativo === true ? "ativo" : "inativo"} /></td>
                  <td>
                    <button
                      className="button button-small"
                      onClick={() => onEdit(person)}
                      disabled={!canManageAccess && person.uid === actorUid}
                    >
                      {person.uid === actorUid && !canManageAccess ? "Seu cadastro" : "Editar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState icon={<Users size={22} />} text={data.pessoas.length ? "Nenhum cadastro corresponde à busca ou ao filtro." : "Nenhuma pessoa cadastrada ainda."} /> : null}
      </div>
    </section>
  );
}

function FamiliesPage({
  data,
  search,
  onEdit,
}: {
  data: PortalData;
  search: string;
  onEdit: (family: Family) => void;
}) {
  const families = data.familias.filter((family) =>
    family.nome.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <div className="family-grid">
      {families.map((family) => {
        const members = family.membrosUids
          .map((uid) => data.pessoas.find((person) => person.uid === uid))
          .filter((person): person is Person => Boolean(person));
        return (
          <article className="family-card" key={family.id}>
            <div className="family-card-top"><div className="family-icon"><House size={20} /></div><button className="button button-small" onClick={() => onEdit(family)}>Editar</button></div>
            <h2>{family.nome}</h2><p>{members.length} membro(s) vinculado(s)</p>
            <div className="family-members">
              {members.slice(0, 4).map((member) => <PersonAvatar person={member} small key={member.uid} />)}
              {members.length > 4 ? <span className="avatar avatar-small avatar-more">+{members.length - 4}</span> : null}
              {!members.length ? <span className="muted">Sem membros vinculados</span> : null}
            </div>
            <div className="family-card-footer"><span><Users size={14} /> Núcleo familiar</span><ChevronRight size={17} /></div>
          </article>
        );
      })}
      {!families.length ? <EmptyState icon={<House size={22} />} text="Nenhuma família encontrada." /> : null}
    </div>
  );
}

function VisitsPage({
  data,
  search,
  onEdit,
}: {
  data: PortalData;
  search: string;
  onEdit: (visit: PastoralVisit) => void;
}) {
  const visits = data.visitas.filter((visit) =>
    `${visit.alvoNome} ${visit.motivo} ${visit.visitante}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <section className="panel table-panel">
      <div className="table-toolbar"><div><h2>Agenda e registros de visitas</h2><p>{visits.length} registro(s)</p></div><div className="inline-stat"><CalendarDays size={16} /> {visits.filter((visit) => visit.status === "agendada").length} agendada(s)</div></div>
      <div className="table-scroll">
        <table><thead><tr><th>QUEM</th><th>DATA</th><th>MOTIVO</th><th>RESPONSÁVEL</th><th>SITUAÇÃO</th><th /></tr></thead>
          <tbody>{visits.map((visit) => <tr key={visit.id}><td><div className="person-cell"><div className="avatar avatar-light"><Home size={16} /></div><span><strong>{visit.alvoNome}</strong><small>{visit.alvoTipo === "familia" ? "Família" : "Pessoa"}</small></span></div></td><td>{formatDate(visit.data)}</td><td>{visit.motivo || "Visita pastoral"}</td><td>{visit.visitante}</td><td><StatusBadge status={visit.status} /></td><td><button className="button button-small" onClick={() => onEdit(visit)}>Detalhes</button></td></tr>)}</tbody>
        </table>
        {!visits.length ? <EmptyState icon={<Home size={22} />} text="Nenhuma visita registrada." /> : null}
      </div>
    </section>
  );
}

function FollowUpsPage({
  data,
  search,
  onEdit,
}: {
  data: PortalData;
  search: string;
  onEdit: (followup: FollowUp) => void;
}) {
  const followups = data.acompanhamentos.filter((item) =>
    `${item.alvoNome} ${item.necessidade} ${item.responsavel} ${item.categoria}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  const open = followups.filter((item) => item.status !== "concluido").length;
  return (
    <section className="panel table-panel">
      <div className="table-toolbar"><div><h2>Necessidades e encaminhamentos</h2><p>{followups.length} acompanhamento(s)</p></div><div className="inline-stat"><HeartHandshake size={16} /> {open} em aberto</div></div>
      <div className="table-scroll">
        <table><thead><tr><th>PESSOA / FAMÍLIA</th><th>NECESSIDADE</th><th>RESPONSÁVEL</th><th>PRÓXIMO RETORNO</th><th>SITUAÇÃO</th><th /></tr></thead>
          <tbody>{followups.map((item) => <tr key={item.id}><td><div className="person-cell"><div className="avatar avatar-light"><HeartHandshake size={16} /></div><span><strong>{item.alvoNome}</strong><small>{item.categoria}</small></span></div></td><td className="wrap-cell">{item.necessidade}</td><td>{item.responsavel}</td><td>{formatDate(item.proximoRetorno)}</td><td><StatusBadge status={item.status} /></td><td><button className="button button-small" onClick={() => onEdit(item)}>Atualizar</button></td></tr>)}</tbody>
        </table>
        {!followups.length ? <EmptyState icon={<HeartHandshake size={22} />} text="Nenhum acompanhamento cadastrado." /> : null}
      </div>
    </section>
  );
}

function PrayerRequestsPage({
  requests,
  people,
  search,
  onStatusChange,
}: {
  requests: PrayerRequest[];
  people: Person[];
  search: string;
  onStatusChange: (request: PrayerRequest, status: PrayerRequestStatus) => void;
}) {
  const [filter, setFilter] = useState<PrayerRequestStatus>("aberto");
  const filtered = requests.filter((request) =>
    request.status === filter &&
    `${request.titulo} ${request.texto}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const tabs: { status: PrayerRequestStatus; label: string }[] = [
    { status: "aberto", label: "Em acompanhamento" },
    { status: "respondido", label: "Respondidos" },
    { status: "arquivado", label: "Arquivados" },
  ];

  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div>
          <h2>Pedidos recebidos</h2>
          <p>{filtered.length} pedido(s) nesta aba</p>
        </div>
        <div className="filter-tabs">
          {tabs.map(({ status, label }) => (
            <button
              key={status}
              className={filter === status ? "filter-active" : ""}
              onClick={() => setFilter(status)}
            >
              {label} <span className="tab-count">{requests.filter((request) => request.status === status).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="prayer-request-list">
        {filtered.map((request) => (
          <article className="prayer-request-card" key={request.id}>
            <header className="prayer-request-heading">
              <div>
                <h3>{request.titulo}</h3>
                <span className="prayer-request-author">
                  {request.autorUid === null
                    ? "Visitante sem conta"
                    : people.find((person) => person.uid === request.autorUid)?.nome ??
                      "Autor não localizado"}
                </span>
              </div>
              <StatusBadge status={request.status} />
            </header>
            <p className="prayer-request-text">{request.texto}</p>
            <div className="prayer-request-meta">
              <span>{formatPrayerRequestDate(request.criadoEm)}</span>
              <span>
                {request.compartilhadoComPg
                  ? "Compartilhado com o PG"
                  : "Não compartilhado com o PG"}
              </span>
            </div>
            <div className="prayer-request-actions">
              {request.status === "aberto" ? (
                <>
                  <button
                    className="button button-small button-primary"
                    onClick={() => onStatusChange(request, "respondido")}
                  >
                    Marcar como respondido
                  </button>
                  <button
                    className="button button-small"
                    onClick={() => onStatusChange(request, "arquivado")}
                  >
                    Arquivar
                  </button>
                </>
              ) : null}
              {request.status === "respondido" ? (
                <>
                  <button
                    className="button button-small"
                    onClick={() => onStatusChange(request, "aberto")}
                  >
                    Reabrir
                  </button>
                  <button
                    className="button button-small"
                    onClick={() => onStatusChange(request, "arquivado")}
                  >
                    Arquivar
                  </button>
                </>
              ) : null}
              {request.status === "arquivado" ? (
                <button
                  className="button button-small"
                  onClick={() => onStatusChange(request, "aberto")}
                >
                  Reabrir
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {!filtered.length ? (
          <EmptyState
            icon={<MessageCircle size={22} />}
            text={requests.some((request) => request.status === filter)
              ? "Nenhum pedido corresponde ao filtro de texto."
              : "Nenhum pedido nesta aba."}
          />
        ) : null}
      </div>
    </section>
  );
}

function formatPrayerRequestDate(value: PrayerRequest["criadoEm"]) {
  if (!value) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value.toDate());
}

function HistoryPage({
  data,
  search,
  onEdit,
}: {
  data: PortalData;
  search: string;
  onEdit: (history: MemberHistory) => void;
}) {
  const records = data.historico.filter((item) => {
    const person = data.pessoas.find((candidate) => candidate.uid === item.pessoaUid);
    return `${person?.nome ?? ""} ${item.descricao} ${item.tipo}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
  });
  return (
    <section className="panel table-panel">
      <div className="table-toolbar"><div><h2>Histórico da comunidade</h2><p>Admissões, batismos, transferências e observações pastorais.</p></div><span className="inline-stat"><FileClock size={16} /> {records.length} registro(s)</span></div>
      <div className="history-list">
        {records.map((item) => {
          const person = data.pessoas.find((candidate) => candidate.uid === item.pessoaUid);
          return <article className="history-row" key={item.id}><div className="timeline-dot" /><div className="history-date">{formatDate(item.data)}</div><div className="history-copy"><span className={`history-kind kind-${item.tipo}`}>{historyLabel(item.tipo)}</span><strong>{person?.nome ?? "Pessoa não encontrada"}</strong><p>{item.descricao}</p><small>Registrado por {item.criadoPorNome}</small></div><button className="button button-small" onClick={() => onEdit(item)}>Editar</button></article>;
        })}
        {!records.length ? <EmptyState icon={<FileClock size={22} />} text="Nenhum registro de histórico." /> : null}
      </div>
    </section>
  );
}

function DeletionRequestsPage({
  requests,
  isAdministrator,
  canViewPastoral,
  onAdminAnonymize,
  onPastoralAnonymize,
  onComplete,
}: {
  requests: DeletionRequest[];
  isAdministrator: boolean;
  canViewPastoral: boolean;
  onAdminAnonymize: (request: DeletionRequest) => void;
  onPastoralAnonymize: (request: DeletionRequest) => void;
  onComplete: (request: DeletionRequest) => void;
}) {
  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div>
          <h2>Solicitações pendentes</h2>
          <p>As etapas de Administração e Pastoral são independentes.</p>
        </div>
        <span className="inline-stat"><Trash2 size={16} /> {requests.length} pendente(s)</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>TITULAR</th><th>ADMINISTRAÇÃO</th><th>PASTORAL</th><th>AÇÕES</th></tr></thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.uid}>
                <td><div className="person-cell"><div className="avatar avatar-light"><Trash2 size={16} /></div><span><strong>{request.nome}</strong><small>{request.email}</small></span></div></td>
                <td><StatusBadge status={request.anonimizacaoAdminOk ? "concluido" : "pendente"} /></td>
                <td><StatusBadge status={request.anonimizacaoPastoralOk ? "concluido" : "pendente"} /></td>
                <td>
                  <div className="table-action-group">
                    {isAdministrator && !request.anonimizacaoAdminOk ? <button className="button button-small" onClick={() => onAdminAnonymize(request)}>Anonimizar visitas e histórico</button> : null}
                    {canViewPastoral && !request.anonimizacaoPastoralOk ? <button className="button button-small" onClick={() => onPastoralAnonymize(request)}>Anonimizar acompanhamentos</button> : null}
                    {isAdministrator && request.anonimizacaoAdminOk && request.anonimizacaoPastoralOk ? <button className="button button-small button-primary" onClick={() => onComplete(request)}>Concluir</button> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!requests.length ? <EmptyState icon={<Check size={22} />} text="Não há solicitações de exclusão pendentes." /> : null}
      </div>
    </section>
  );
}

function TreasuryPage() {
  return (
    <section className="panel">
      <div className="empty-state">
        <div className="empty-icon"><Wallet size={22} /></div>
        <p><strong>Tesouraria em breve</strong></p>
        <p>Esta área ainda não está disponível. Nenhum dado financeiro foi carregado.</p>
      </div>
    </section>
  );
}

function ReportsPage({ data, onNavigate, canViewPastoral }: { data: PortalData; onNavigate: (page: PageKey) => void; canViewPastoral: boolean }) {
  const openFollowUps = canViewPastoral
    ? data.acompanhamentos.filter((item) => item.status !== "concluido")
    : [];
  const overdue = openFollowUps.filter((item) => {
    return isPastDate(item.proximoRetorno);
  });
  const profiles = [
    { label: "Membros ativos", value: data.pessoas.filter((item) => item.ativo && item.perfil === "MEMBRO").length, color: "green" },
    { label: "Visitantes ativos", value: data.pessoas.filter((item) => item.ativo && item.perfil === "VISITANTE").length, color: "blue" },
    { label: "Cadastros inativos", value: data.pessoas.filter((item) => !item.ativo).length, color: "gray" },
  ];
  return (
    <>
      <section className="report-stat-grid">{profiles.map((item) => <article className={`report-stat report-${item.color}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>)}</section>
      <div className="reports-grid">
        <Panel title="Indicadores de cuidado" subtitle="Registros disponíveis ao seu perfil" icon={<Activity size={17} />}>
          <div className="report-lines">
            <button onClick={() => onNavigate("visitas")}><span><Home size={16} /> Visitas registradas</span><strong>{data.visitas.length}</strong><ChevronRight size={16} /></button>
            {canViewPastoral ? <button onClick={() => onNavigate("acompanhamentos")}><span><HeartHandshake size={16} /> Acompanhamentos em aberto</span><strong>{openFollowUps.length}</strong><ChevronRight size={16} /></button> : null}
            {canViewPastoral ? <button onClick={() => onNavigate("acompanhamentos")}><span><AlertTriangle size={16} /> Retornos vencidos</span><strong className={overdue.length ? "text-danger" : ""}>{overdue.length}</strong><ChevronRight size={16} /></button> : null}
            <button onClick={() => onNavigate("historico")}><span><FileText size={16} /> Registros no histórico</span><strong>{data.historico.length}</strong><ChevronRight size={16} /></button>
          </div>
        </Panel>
        <Panel title="Distribuição de pessoas" subtitle="Cadastros por perfil" icon={<Users size={17} />}>
          <div className="profile-bars">
            {[
              ["Membros", data.pessoas.filter((item) => item.perfil === "MEMBRO").length, "bar-green"],
              ["Visitantes", data.pessoas.filter((item) => item.perfil === "VISITANTE").length, "bar-blue"],
              ["Administradores", data.pessoas.filter((item) => item.perfil === "ADMINISTRADOR").length, "bar-purple"],
            ].map(([label, count, color]) => {
              const numericCount = Number(count);
              const total = Math.max(data.pessoas.length, 1);
              return <div className="profile-bar-row" key={label as string}><span>{label}</span><div className="profile-bar-track"><i className={color as string} style={{ width: `${(numericCount / total) * 100}%` }} /></div><strong>{numericCount}</strong></div>;
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    ativo: "Ativo",
    inativo: "Inativo",
    agendada: "Agendada",
    realizada: "Realizada",
    cancelada: "Cancelada",
    aberto: "Em aberto",
    respondido: "Respondido",
    arquivado: "Arquivado",
    pendente: "Pendente",
    em_andamento: "Em andamento",
    concluido: "Concluído",
  };
  return <span className={`status-badge status-${status}`}>{label[status] ?? status}</span>;
}

function PersonAvatar({ person, small = false }: { person: Person; small?: boolean }) {
  const name =
    typeof person.nome === "string" && person.nome.trim()
      ? person.nome
      : "Nome não informado";
  return (
    <span
      className={`avatar ${small ? "avatar-small" : ""}`}
      title={name}
    >
      {person.fotoUrl ? (
        <img src={person.fotoUrl} alt="" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="empty-state"><span>{icon}</span><p>{text}</p></div>;
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true">
        <button className="icon-button modal-close" aria-label="Fechar janela" onClick={onClose}><X size={18} /></button>
        {children}
      </section>
    </div>
  );
}

function ModalHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="modal-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>;
}

function ModalActions({ onCancel, saving, submitLabel }: { onCancel: () => void; saving: boolean; submitLabel: string }) {
  return <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? "Salvando..." : submitLabel}</button></div>;
}

function PersonForm({
  person,
  actorUid,
  canManageAccess,
  families,
  onCancel,
  onSave,
}: {
  person: Person;
  actorUid: string;
  canManageAccess: boolean;
  families: Family[];
  onCancel: () => void;
  onSave: (value: Pick<Person, "nome" | "telefone" | "endereco" | "dataNascimento" | "estadoCivil" | "familiaId" | "pequenoGrupoId" | "salaEbdId" | "ministerios" | "perfil" | "ativo" | "funcoes"> & { membroDesde: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState(person.nome ?? "");
  const [telefone, setTelefone] = useState(person.telefone ?? "");
  const [endereco, setEndereco] = useState(person.endereco ?? "");
  const [dataNascimento, setDataNascimento] = useState(person.dataNascimento ?? "");
  const [estadoCivil, setEstadoCivil] = useState(person.estadoCivil ?? "");
  const [familiaId, setFamiliaId] = useState(person.familiaId ?? "");
  const [pequenoGrupoId, setPequenoGrupoId] = useState(person.pequenoGrupoId ?? "");
  const [salaEbdId, setSalaEbdId] = useState(person.salaEbdId ?? "");
  const [ministerios, setMinisterios] = useState((person.ministerios ?? []).join(", "));
  const [membroDesde, setMembroDesde] = useState(timestampInput(person.membroDesde));
  const [perfil, setPerfil] = useState<Person["perfil"]>(person.perfil);
  const [ativo, setAtivo] = useState(person.ativo);
  const [funcoes, setFuncoes] = useState<UserFunction[]>(person.funcoes ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const mayChangeFunctions = canManageAccess && person.uid !== actorUid;

  function toggleFunction(functionName: UserFunction) {
    setFuncoes((current) =>
      current.includes(functionName)
        ? current.filter((value) => value !== functionName)
        : [...current, functionName],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        nome: nome.trim(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        dataNascimento,
        estadoCivil,
        familiaId: familiaId || null,
        pequenoGrupoId: pequenoGrupoId || null,
        salaEbdId: salaEbdId || null,
        ministerios: ministerios.split(",").map((value) => value.trim()).filter(Boolean),
        membroDesde,
        perfil: canManageAccess ? perfil : person.perfil,
        ativo: canManageAccess ? ativo : person.ativo,
        funcoes: mayChangeFunctions ? funcoes : person.funcoes ?? [],
      });
    } catch (saveError) {
      console.error("Falha ao salvar cadastro:", saveError);
      const code =
        typeof saveError === "object" &&
        saveError !== null &&
        "code" in saveError &&
        typeof saveError.code === "string"
          ? saveError.code
          : "";
      setError(
        saveError instanceof Error
          ? saveError.message
          : code
            ? `Não foi possível salvar o cadastro (${code}).`
            : "Não foi possível salvar o cadastro.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="portal-form" onSubmit={submit}>
      <ModalHeading eyebrow="CADASTRO INDIVIDUAL" title="Editar pessoa" description="Atualize os dados cadastrais permitidos para este perfil." />
      <div className="form-grid">
        <label className="field field-span"><span>Nome completo</span><input value={nome} onChange={(event) => setNome(event.target.value)} maxLength={120} required /></label>
        <label className="field"><span>E-mail</span><input type="email" value={person.email} disabled /></label>
        <label className="field"><span>Telefone</span><input value={telefone} onChange={(event) => setTelefone(event.target.value)} maxLength={40} /></label>
        <label className="field"><span>Data de nascimento</span><input type="date" value={dataNascimento} onChange={(event) => setDataNascimento(event.target.value)} /></label>
        <label className="field"><span>Estado civil</span><select value={estadoCivil} onChange={(event) => setEstadoCivil(event.target.value)}><option value="">Não informado</option><option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option></select></label>
        <label className="field field-span"><span>Endereço</span><input value={endereco} onChange={(event) => setEndereco(event.target.value)} maxLength={240} /></label>
        <label className="field"><span>Família</span><select value={familiaId} onChange={(event) => setFamiliaId(event.target.value)}><option value="">Sem vínculo</option>{families.map((family) => <option value={family.id} key={family.id}>{family.nome}</option>)}</select></label>
        <label className="field"><span>Pequeno grupo (ID)</span><input value={pequenoGrupoId} onChange={(event) => setPequenoGrupoId(event.target.value)} maxLength={128} /></label>
        <label className="field"><span>Sala EBD (ID)</span><input value={salaEbdId} onChange={(event) => setSalaEbdId(event.target.value)} maxLength={128} /></label>
        <label className="field"><span>Ministérios</span><input value={ministerios} onChange={(event) => setMinisterios(event.target.value)} placeholder="Separados por vírgula" /></label>
        <label className="field"><span>Membro desde</span><input type="date" value={membroDesde} onChange={(event) => setMembroDesde(event.target.value)} /></label>
        {canManageAccess ? (
          <>
            <label className="field"><span>Perfil</span><select value={perfil} onChange={(event) => setPerfil(event.target.value as Person["perfil"])}><option value="VISITANTE">Visitante</option><option value="MEMBRO">Membro</option><option value="ADMINISTRADOR">Administrador</option></select></label>
            <label className="field-check"><input type="checkbox" checked={ativo} onChange={(event) => setAtivo(event.target.checked)} /><span>Cadastro ativo</span></label>
            <fieldset className="field field-span access-functions" disabled={!mayChangeFunctions}>
              <legend>Funções de acesso</legend>
              {(["SECRETARIA", "PASTORAL", "TESOURARIA"] as const).map((functionName) => (
                <label className="field-check" key={functionName}>
                  <input type="checkbox" checked={funcoes.includes(functionName)} onChange={() => toggleFunction(functionName)} />
                  <span>{functionName === "SECRETARIA" ? "Secretaria" : functionName === "PASTORAL" ? "Pastoral" : "Tesouraria"}</span>
                </label>
              ))}
              {!mayChangeFunctions ? <small>Não é permitido alterar as próprias funções.</small> : null}
            </fieldset>
          </>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <ModalActions onCancel={onCancel} saving={saving} submitLabel="Salvar alterações" />
    </form>
  );
}

function FamilyForm({
  family,
  data,
  onCancel,
  onSave,
}: {
  family: Family | null;
  data: PortalData;
  onCancel: () => void;
  onSave: (value: Pick<Family, "nome" | "membrosUids">) => Promise<void>;
}) {
  const [nome, setNome] = useState(family?.nome ?? "");
  const [members, setMembers] = useState<string[]>(family?.membrosUids ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMember(uid: string) {
    setMembers((current) => current.includes(uid) ? current.filter((value) => value !== uid) : [...current, uid]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ nome, membrosUids: members });
    } catch (saveError) {
      console.error("Falha ao salvar núcleo familiar:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar a família. Verifique os vínculos e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="portal-form" onSubmit={submit}>
      <ModalHeading eyebrow="NÚCLEO FAMILIAR" title={family ? "Editar família" : "Nova família"} description="Vincule pessoas do cadastro a este núcleo familiar." />
      <label className="field"><span>Nome da família</span><input value={nome} onChange={(event) => setNome(event.target.value)} maxLength={100} required /></label>
      <div className="member-picker-heading"><strong>Membros</strong><span>{members.length} selecionado(s)</span></div>
      <div className="member-picker">
        {data.pessoas.filter((person) => person.ativo).map((person) => (
          <label className="member-option" key={person.uid}>
            <input type="checkbox" checked={members.includes(person.uid)} onChange={() => toggleMember(person.uid)} />
            <span className="avatar avatar-small">{firstName(person.nome).slice(0, 1).toUpperCase()}</span>
            <span className="member-option-copy"><strong>{person.nome}</strong><small>{person.email}</small></span>
            {person.familiaId && person.familiaId !== family?.id && !members.includes(person.uid) ? <small className="muted">em outra família</small> : null}
          </label>
        ))}
        {!data.pessoas.length ? <p className="muted">Cadastre pessoas antes de criar um núcleo familiar.</p> : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <ModalActions onCancel={onCancel} saving={saving} submitLabel={family ? "Salvar família" : "Criar família"} />
    </form>
  );
}

function HistoryForm({
  data,
  profile,
  history,
  onCancel,
  onSave,
}: {
  data: PortalData;
  profile: Person;
  history: MemberHistory | null;
  onCancel: () => void;
  onSave: (value: Omit<MemberHistory, "id">) => Promise<void>;
}) {
  const [pessoaUid, setPessoaUid] = useState(history?.pessoaUid ?? "");
  const [tipo, setTipo] = useState<HistoryKind>(history?.tipo ?? "observacao");
  const [date, setDate] = useState(history?.data ?? todayInput());
  const [descricao, setDescricao] = useState(history?.descricao ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ pessoaUid, tipo, data: date, descricao: descricao.trim(), criadoPor: profile.uid, criadoPorNome: profile.nome });
    } catch (saveError) {
      console.error("Falha ao salvar histórico:", saveError);
      setError("Não foi possível salvar o registro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="portal-form" onSubmit={submit}>
      <ModalHeading eyebrow="HISTÓRICO" title={history ? "Editar registro" : "Novo registro"} description={history ? "Atualize o tipo, a data ou a descrição. O registro não pode ser excluído." : "Registre um marco importante da caminhada da pessoa."} />
      <label className="field"><span>Pessoa</span><select value={pessoaUid} onChange={(event) => setPessoaUid(event.target.value)} required disabled={Boolean(history)}><option value="">Selecione</option>{data.pessoas.map((person) => <option value={person.uid} key={person.uid}>{person.nome}</option>)}</select></label>
      <div className="form-grid">
        <label className="field"><span>Tipo</span><select value={tipo} onChange={(event) => setTipo(event.target.value as HistoryKind)}><option value="admissao">Admissão</option><option value="batismo">Batismo</option><option value="transferencia">Transferência</option><option value="observacao">Observação</option></select></label>
        <label className="field"><span>Data</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      </div>
      <label className="field"><span>Observações</span><textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} maxLength={2000} rows={4} required /></label>
      {error ? <p className="form-error">{error}</p> : null}
      <ModalActions onCancel={onCancel} saving={saving} submitLabel={history ? "Salvar alterações" : "Adicionar ao histórico"} />
    </form>
  );
}

function VisitForm({
  visit,
  data,
  profile,
  onCancel,
  onSave,
}: {
  visit: PastoralVisit | null;
  data: PortalData;
  profile: Person;
  onCancel: () => void;
  onSave: (value: Omit<PastoralVisit, "id">) => Promise<void>;
}) {
  const [alvoTipo, setAlvoTipo] = useState<RecordTarget>(visit?.alvoTipo ?? "pessoa");
  const [alvoId, setAlvoId] = useState(visit?.alvoId ?? "");
  const [date, setDate] = useState(visit?.data ?? todayInput());
  const [motivo, setMotivo] = useState(visit?.motivo ?? "");
  const [visitante, setVisitante] = useState(visit?.visitante ?? profile.nome);
  const [observacoes, setObservacoes] = useState(visit?.observacoes ?? "");
  const [status, setStatus] = useState<VisitStatus>(visit?.status ?? "agendada");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const targets = alvoTipo === "pessoa" ? data.pessoas.map((item) => ({ id: item.uid, nome: item.nome })) : data.familias.map((item) => ({ id: item.id, nome: item.nome }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const target = targets.find((item) => item.id === alvoId);
    if (!target) { setError("Selecione uma pessoa ou família."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ alvoTipo, alvoId, alvoNome: target.nome, data: date, motivo: motivo.trim(), visitante: visitante.trim(), observacoes: observacoes.trim(), status, criadoPor: visit?.criadoPor ?? profile.uid });
    } catch (saveError) {
      console.error("Falha ao salvar visita:", saveError);
      setError("Não foi possível salvar a visita. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="portal-form" onSubmit={submit}>
      <ModalHeading eyebrow="VISITAS" title={visit ? "Atualizar visita" : "Registrar visita"} description="Agende um cuidado ou registre uma visita realizada." />
      <div className="form-grid">
        <label className="field"><span>Tipo de cadastro</span><select value={alvoTipo} onChange={(event) => { setAlvoTipo(event.target.value as RecordTarget); setAlvoId(""); }}><option value="pessoa">Pessoa</option><option value="familia">Família</option></select></label>
        <label className="field"><span>{alvoTipo === "pessoa" ? "Pessoa" : "Família"}</span><select value={alvoId} onChange={(event) => setAlvoId(event.target.value)} required><option value="">Selecione</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.nome}</option>)}</select></label>
        <label className="field"><span>Data</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="field"><span>Visitante / responsável</span><input value={visitante} onChange={(event) => setVisitante(event.target.value)} maxLength={120} required /></label>
        <label className="field"><span>Motivo</span><input value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Ex.: primeira visita, retorno..." maxLength={160} /></label>
        <label className="field"><span>Situação</span><select value={status} onChange={(event) => setStatus(event.target.value as VisitStatus)}><option value="agendada">Agendada</option><option value="realizada">Realizada</option><option value="cancelada">Cancelada</option></select></label>
      </div>
      <label className="field"><span>Observações</span><textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} maxLength={2000} /></label>
      {error ? <p className="form-error">{error}</p> : null}
      <ModalActions onCancel={onCancel} saving={saving} submitLabel={visit ? "Salvar visita" : "Registrar visita"} />
    </form>
  );
}

function FollowUpForm({
  followup,
  data,
  profile,
  onCancel,
  onSave,
}: {
  followup: FollowUp | null;
  data: PortalData;
  profile: Person;
  onCancel: () => void;
  onSave: (value: Omit<FollowUp, "id">) => Promise<void>;
}) {
  const [alvoTipo, setAlvoTipo] = useState<RecordTarget>(followup?.alvoTipo ?? "pessoa");
  const [alvoId, setAlvoId] = useState(followup?.alvoId ?? "");
  const [categoria, setCategoria] = useState(followup?.categoria ?? "espiritual");
  const [necessidade, setNecessidade] = useState(followup?.necessidade ?? "");
  const [responsavel, setResponsavel] = useState(followup?.responsavel ?? profile.nome);
  const [proximoRetorno, setProximoRetorno] = useState(followup?.proximoRetorno ?? todayInput());
  const [status, setStatus] = useState<FollowUpStatus>(followup?.status ?? "aberto");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const targets = alvoTipo === "pessoa" ? data.pessoas.map((item) => ({ id: item.uid, nome: item.nome })) : data.familias.map((item) => ({ id: item.id, nome: item.nome }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const target = targets.find((item) => item.id === alvoId);
    if (!target) { setError("Selecione uma pessoa ou família."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ alvoTipo, alvoId, alvoNome: target.nome, categoria, necessidade: necessidade.trim(), responsavel: responsavel.trim(), proximoRetorno, status, criadoPor: followup?.criadoPor ?? profile.uid });
    } catch (saveError) {
      console.error("Falha ao salvar acompanhamento:", saveError);
      setError("Não foi possível salvar o acompanhamento. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="portal-form" onSubmit={submit}>
      <ModalHeading eyebrow="CUIDADO PASTORAL" title={followup ? "Atualizar acompanhamento" : "Novo acompanhamento"} description="Registre uma necessidade, ação de cuidado ou retorno previsto." />
      <div className="form-grid">
        <label className="field"><span>Tipo de cadastro</span><select value={alvoTipo} onChange={(event) => { setAlvoTipo(event.target.value as RecordTarget); setAlvoId(""); }}><option value="pessoa">Pessoa</option><option value="familia">Família</option></select></label>
        <label className="field"><span>{alvoTipo === "pessoa" ? "Pessoa" : "Família"}</span><select value={alvoId} onChange={(event) => setAlvoId(event.target.value)} required><option value="">Selecione</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.nome}</option>)}</select></label>
        <label className="field"><span>Categoria</span><select value={categoria} onChange={(event) => setCategoria(event.target.value)}><option value="espiritual">Espiritual</option><option value="saude">Saúde</option><option value="familia">Família</option><option value="social">Social</option><option value="outro">Outro</option></select></label>
        <label className="field"><span>Responsável</span><input value={responsavel} onChange={(event) => setResponsavel(event.target.value)} maxLength={120} required /></label>
        <label className="field"><span>Próximo retorno</span><input type="date" value={proximoRetorno} onChange={(event) => setProximoRetorno(event.target.value)} required /></label>
        <label className="field"><span>Situação</span><select value={status} onChange={(event) => setStatus(event.target.value as FollowUpStatus)}><option value="aberto">Em aberto</option><option value="em_andamento">Em andamento</option><option value="concluido">Concluído</option></select></label>
      </div>
      <label className="field"><span>Necessidade / encaminhamento</span><textarea value={necessidade} onChange={(event) => setNecessidade(event.target.value)} maxLength={2000} rows={4} required /></label>
      {error ? <p className="form-error">{error}</p> : null}
      <ModalActions onCancel={onCancel} saving={saving} submitLabel={followup ? "Salvar acompanhamento" : "Registrar acompanhamento"} />
    </form>
  );
}

function profileLabel(profile: string | undefined) {
  const labels: Record<string, string> = {
    VISITANTE: "Visitante",
    MEMBRO: "Membro",
    ADMINISTRADOR: "Administrador",
  };
  return profile ? labels[profile] ?? "Perfil não informado" : "Perfil não informado";
}

function historyLabel(kind: HistoryKind) {
  const labels: Record<HistoryKind, string> = { admissao: "Admissão", batismo: "Batismo", transferencia: "Transferência", observacao: "Observação" };
  return labels[kind];
}

export default App;
