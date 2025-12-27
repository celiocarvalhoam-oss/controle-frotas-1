import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Map, History, Shield, Bell, BarChart3, Truck, LogOut, CarFront, Activity, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

import { AuthProvider } from "@/components/auth-provider";
import { AuthGuard, PublicOnly } from "@/components/auth-guard";
import { useAuth } from "@/hooks/use-auth";

import Dashboard from "@/pages/dashboard";
import HistoryPage from "@/pages/history";
import GeofencesPage from "@/pages/geofences";
import AlertsPage from "@/pages/alerts";
import ReportsPage from "@/pages/reports";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

import type { Alert } from "@shared/schema";

function Navigation() {
  const [location] = useLocation();
  
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 10000,
  });
  
  const unreadAlerts = alerts.filter(a => !a.read).length;

  const navItems = [
    { path: "/", label: "Dashboard", icon: Map, description: "Mapa em tempo real" },
    { path: "/vehicles", label: "Veículos", icon: CarFront, description: "Gerenciar frota" },
    { path: "/history", label: "Histórico", icon: History, description: "Trajetos passados" },
    { path: "/geofences", label: "Geofences", icon: Shield, description: "Áreas monitoradas" },
    { path: "/alerts", label: "Alertas", icon: Bell, badge: unreadAlerts > 0 ? unreadAlerts : undefined, description: "Notificações" },
    { path: "/reports", label: "Relatórios", icon: BarChart3, description: "Análises e dados" },
  ];

  return (
    <header className="h-16 border-b border-border/50 bg-card/95 backdrop-blur-xl flex items-center px-4 md:px-6 gap-2 md:gap-4 sticky top-0 z-50 shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group mr-2 md:mr-4">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card animate-pulse-slow" />
        </div>
        <div className="hidden md:block">
          <span className="font-bold text-lg tracking-tight">FleetTrack</span>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Activity className="h-3 w-3 text-green-500" />
            <span>Tempo real</span>
          </div>
        </div>
      </Link>
      
      {/* Navigation */}
      <nav className="flex items-center gap-1 flex-1">
        {navItems.map(item => {
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Link href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2 relative transition-all duration-200",
                      isActive 
                        ? "shadow-md" 
                        : "hover:bg-accent/80"
                    )}
                    data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                    <span className="hidden lg:inline font-medium">{item.label}</span>
                    {item.badge !== undefined && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 min-w-5 px-1.5 text-[10px] font-bold absolute -top-2 -right-2 animate-pulse shadow-sm"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="lg:hidden">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      
      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">Live</span>
        </div>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, signOut, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return null;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden md:block">
        {user?.username || user?.email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut()}
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ProtectedRoutes() {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <Navigation />
        <main className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/history" component={HistoryPage} />
            <Route path="/geofences" component={GeofencesPage} />
            <Route path="/alerts" component={AlertsPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </AuthGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicOnly>
          <LoginPage />
        </PublicOnly>
      </Route>
      <Route>
        <ProtectedRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
