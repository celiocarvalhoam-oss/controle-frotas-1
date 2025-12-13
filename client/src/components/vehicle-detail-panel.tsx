import { 
  X, MapPin, Gauge, Navigation, Radio, Battery, Clock, 
  History, Shield, AlertTriangle, Bell, Activity, Settings,
  Target, Zap, Navigation2, TrendingUp, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Vehicle, Alert } from "@shared/schema";
import { Link } from "wouter";

interface VehicleDetailPanelProps {
  vehicle: Vehicle;
  alerts: Alert[];
  onClose: () => void;
  onFollowVehicle: () => void;
  isFollowing: boolean;
}

export function VehicleDetailPanel({ vehicle, alerts, onClose, onFollowVehicle, isFollowing }: VehicleDetailPanelProps) {
  const vehicleAlerts = alerts.filter(a => a.vehicleId === vehicle.id);
  const unreadAlerts = vehicleAlerts.filter(a => !a.read);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s atrás`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min atrás`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const getStatusConfig = (status: Vehicle["status"]) => {
    switch (status) {
      case "moving": 
        return { 
          color: "bg-green-500", 
          label: "Em Movimento",
          textColor: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/30"
        };
      case "stopped": 
        return { 
          color: "bg-amber-500", 
          label: "Parado",
          textColor: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-950/30"
        };
      case "idle": 
        return { 
          color: "bg-amber-500", 
          label: "Ocioso",
          textColor: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-950/30"
        };
      case "offline": 
        return { 
          color: "bg-slate-400 dark:bg-slate-600", 
          label: "Offline",
          textColor: "text-muted-foreground",
          bgColor: "bg-muted/50"
        };
    }
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "speed": return <Gauge className="h-4 w-4" />;
      case "geofence_entry":
      case "geofence_exit":
      case "geofence_dwell": return <Shield className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (priority: Alert["priority"]) => {
    switch (priority) {
      case "critical": return "text-red-500";
      case "warning": return "text-amber-500";
      default: return "text-primary";
    }
  };

  const statusConfig = getStatusConfig(vehicle.status);
  const hasSpeedAlert = vehicle.currentSpeed > vehicle.speedLimit;

  return (
    <div className="flex flex-col h-full bg-sidebar animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-lg truncate">{vehicle.name}</h2>
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                statusConfig.color,
                vehicle.status === "moving" && "animate-pulse"
              )} />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{vehicle.licensePlate}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="rounded-xl hover:bg-muted"
            data-testid="button-close-detail"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Status badge */}
        <div className={cn(
          "mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
          statusConfig.bgColor,
          statusConfig.textColor
        )}>
          <Activity className="h-3.5 w-3.5" />
          {statusConfig.label}
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3 h-10 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="details" className="rounded-lg text-xs font-medium" data-testid="tab-details">
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg text-xs font-medium relative" data-testid="tab-alerts">
            Alertas
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadAlerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-xs font-medium" data-testid="tab-activity">
            Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex-1 mt-0 overflow-auto scrollbar-thin">
          <div className="p-4 space-y-4">
            {/* Speed Card - Hero */}
            <Card className={cn(
              "overflow-hidden border-0",
              hasSpeedAlert 
                ? "bg-gradient-to-br from-red-500 to-red-600 text-white" 
                : "bg-gradient-to-br from-primary to-blue-600 text-white"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide opacity-80 flex items-center gap-1 mb-1">
                      <Gauge className="h-3.5 w-3.5" /> Velocidade Atual
                    </div>
                    <div className="text-4xl font-bold font-mono tracking-tight">
                      {vehicle.currentSpeed}
                      <span className="text-lg font-normal ml-1 opacity-80">km/h</span>
                    </div>
                    {hasSpeedAlert && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Acima do limite ({vehicle.speedLimit} km/h)</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                      <Navigation2 
                        className="h-8 w-8 transition-transform duration-500" 
                        style={{ transform: `rotate(${vehicle.heading}deg)` }}
                      />
                    </div>
                    <div className="text-xs mt-2 opacity-80 font-mono">{vehicle.heading}° Direção</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card/50 border-card-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-medium">Precisão GPS</span>
                  </div>
                  <div className="text-xl font-bold font-mono">
                    ±{vehicle.accuracy}<span className="text-sm font-normal text-muted-foreground ml-0.5">m</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-card-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Radio className="h-4 w-4" />
                    <span className="text-xs font-medium">Ignição</span>
                  </div>
                  <Badge 
                    variant={vehicle.ignition === "on" ? "default" : "secondary"}
                    className={cn(
                      "text-sm",
                      vehicle.ignition === "on" && "bg-green-500 hover:bg-green-600"
                    )}
                  >
                    {vehicle.ignition === "on" ? "Ligada" : "Desligada"}
                  </Badge>
                </CardContent>
              </Card>
              
              {vehicle.batteryLevel !== undefined && (
                <Card className="bg-card/50 border-card-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Battery className="h-4 w-4" />
                      <span className="text-xs font-medium">Bateria</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            vehicle.batteryLevel > 50 ? "bg-green-500" :
                            vehicle.batteryLevel > 20 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${vehicle.batteryLevel}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold font-mono">{vehicle.batteryLevel}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="bg-card/50 border-card-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Target className="h-4 w-4" />
                    <span className="text-xs font-medium">Limite</span>
                  </div>
                  <div className="text-xl font-bold font-mono">
                    {vehicle.speedLimit}<span className="text-sm font-normal text-muted-foreground ml-0.5">km/h</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Last update */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Última atualização: <span className="font-medium text-foreground">{formatTime(vehicle.lastUpdate)}</span></span>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={onFollowVehicle}
                variant={isFollowing ? "default" : "outline"}
                className={cn(
                  "w-full justify-start gap-3 h-11 rounded-xl font-medium",
                  isFollowing && "bg-primary shadow-md"
                )}
                data-testid="button-follow-vehicle"
              >
                <Navigation className="h-4 w-4" />
                {isFollowing ? "Seguindo veículo..." : "Seguir veículo"}
                {isFollowing && <Zap className="h-4 w-4 ml-auto animate-pulse text-yellow-300" />}
              </Button>
              
              <Link href={`/history?vehicleId=${vehicle.id}`}>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 rounded-xl" data-testid="button-view-history">
                  <History className="h-4 w-4" />
                  Ver histórico de trajetos
                </Button>
              </Link>
              
              <Link href={`/geofences?vehicleId=${vehicle.id}`}>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 rounded-xl" data-testid="button-create-geofence">
                  <Shield className="h-4 w-4" />
                  Criar cerca virtual
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full justify-start gap-3 h-11 rounded-xl" data-testid="button-set-speed-limit">
                <Settings className="h-4 w-4" />
                Configurar limite de velocidade
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 mt-0">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-4 space-y-2">
              {vehicleAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Nenhum alerta</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Este veículo está operando normalmente</p>
                </div>
              ) : (
                vehicleAlerts.map((alert, index) => (
                  <Card 
                    key={alert.id} 
                    className={cn(
                      "animate-fade-in border-card-border",
                      !alert.read && "border-l-4 border-l-primary bg-primary/5"
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 p-1.5 rounded-lg",
                          getAlertColor(alert.priority),
                          "bg-current/10"
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(alert.timestamp)}
                          </p>
                        </div>
                        {!alert.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 mt-0">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-4">
              <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Últimas atividades registradas
              </div>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
                
                <div className="space-y-4">
                  {[
                    { status: "moving", text: "Iniciou movimento", time: "5 minutos", color: "bg-green-500" },
                    { status: "stopped", text: "Parou por 12 minutos", time: "17 minutos", color: "bg-amber-500" },
                    { status: "geofence", text: "Entrou em área 'Depósito'", time: "30 minutos", color: "bg-blue-500" },
                    { status: "alert", text: "Excesso de velocidade: 85 km/h", time: "45 minutos", color: "bg-red-500" },
                    { status: "ignition", text: "Ignição ligada", time: "1 hora", color: "bg-green-500" },
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center z-10 ring-4 ring-sidebar",
                        item.color
                      )}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{item.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Há {item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
