import { useState, useMemo } from "react";
import { 
  Search, Truck, Gauge, AlertTriangle, Signal, SignalZero,
  TrendingUp, CircleDot, CircleOff, AlertCircle, Navigation2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@shared/schema";

type FilterType = "all" | "moving" | "stopped" | "alerts" | "offline";

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  onSelectVehicle: (vehicle: Vehicle) => void;
  isLoading?: boolean;
}

export function VehicleList({ vehicles, selectedVehicleId, onSelectVehicle, isLoading }: VehicleListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const stats = useMemo(() => ({
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === "moving").length,
    stopped: vehicles.filter(v => v.status === "stopped" || v.status === "idle").length,
    alerts: vehicles.filter(v => v.currentSpeed > v.speedLimit).length,
    offline: vehicles.filter(v => v.status === "offline").length,
  }), [vehicles]);

  const filters: { key: FilterType; label: string; count: number; icon: typeof Truck; color: string }[] = [
    { key: "all", label: "Todos", count: stats.total, icon: Truck, color: "text-foreground" },
    { key: "moving", label: "Movimento", count: stats.moving, icon: TrendingUp, color: "text-green-500" },
    { key: "stopped", label: "Parados", count: stats.stopped, icon: CircleDot, color: "text-amber-500" },
    { key: "alerts", label: "Alertas", count: stats.alerts, icon: AlertCircle, color: "text-red-500" },
    { key: "offline", label: "Offline", count: stats.offline, icon: CircleOff, color: "text-muted-foreground" },
  ];

  const filteredVehicles = useMemo(() => vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case "moving":
        return vehicle.status === "moving";
      case "stopped":
        return vehicle.status === "stopped" || vehicle.status === "idle";
      case "alerts":
        return vehicle.currentSpeed > vehicle.speedLimit;
      case "offline":
        return vehicle.status === "offline";
      default:
        return true;
    }
  }), [vehicles, searchQuery, activeFilter]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min`;
    return `${Math.floor(diffSeconds / 3600)}h`;
  };

  const getStatusConfig = (status: Vehicle["status"]) => {
    switch (status) {
      case "moving": 
        return { 
          color: "bg-green-500", 
          glow: "shadow-[0_0_8px_rgba(34,197,94,0.5)]",
          label: "Em Movimento",
          textColor: "text-green-600 dark:text-green-400"
        };
      case "stopped": 
        return { 
          color: "bg-amber-500", 
          glow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
          label: "Parado",
          textColor: "text-amber-600 dark:text-amber-400"
        };
      case "idle": 
        return { 
          color: "bg-amber-500", 
          glow: "shadow-[0_0_8px_rgba(245,158,11,0.4)]",
          label: "Ocioso",
          textColor: "text-amber-600 dark:text-amber-400"
        };
      case "offline": 
        return { 
          color: "bg-slate-400 dark:bg-slate-600", 
          glow: "",
          label: "Offline",
          textColor: "text-muted-foreground"
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-sidebar">
        <div className="p-4 space-y-4">
          <div className="h-11 bg-muted animate-pulse rounded-xl" />
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header with search */}
      <div className="p-4 space-y-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar veículo ou placa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-background/50 border-sidebar-border focus:bg-background transition-colors"
            data-testid="input-search-vehicle"
          />
        </div>
        
        {/* Stats/Filters Grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {filters.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-all duration-200",
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              data-testid={`filter-${filter.key}`}
            >
              <filter.icon className={cn(
                "h-4 w-4 mb-1",
                activeFilter === filter.key ? "text-primary-foreground" : filter.color
              )} />
              <span className="text-lg font-bold leading-none">{filter.count}</span>
              <span className="text-[9px] uppercase tracking-wide mt-0.5 opacity-80">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle List */}
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-3 space-y-2">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Truck className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum veículo encontrado</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle, index) => {
              const statusConfig = getStatusConfig(vehicle.status);
              const hasAlert = vehicle.currentSpeed > vehicle.speedLimit;
              
              return (
                <button
                  key={vehicle.id}
                  onClick={() => onSelectVehicle(vehicle)}
                  className={cn(
                    "w-full p-3.5 rounded-xl text-left transition-all duration-200 animate-fade-in group",
                    selectedVehicleId === vehicle.id
                      ? "bg-primary/10 border-2 border-primary shadow-md"
                      : "bg-card border border-card-border hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5",
                    hasAlert && selectedVehicleId !== vehicle.id && "border-red-500/30 bg-red-50 dark:bg-red-950/20"
                  )}
                  style={{ animationDelay: `${index * 0.03}s` }}
                  data-testid={`vehicle-item-${vehicle.id}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status indicator */}
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="relative">
                        <div className={cn(
                          "w-3.5 h-3.5 rounded-full transition-all duration-300",
                          statusConfig.color,
                          statusConfig.glow,
                          vehicle.status === "moving" && "animate-pulse-slow"
                        )} />
                        {vehicle.status === "moving" && (
                          <div className={cn(
                            "absolute inset-0 rounded-full animate-ping",
                            statusConfig.color,
                            "opacity-30"
                          )} />
                        )}
                      </div>
                    </div>
                    
                    {/* Vehicle info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold truncate text-sm group-hover:text-primary transition-colors">
                          {vehicle.name}
                        </span>
                        {hasAlert && (
                          <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2.5 font-medium">
                        {vehicle.licensePlate}
                      </div>
                      
                      {/* Stats row */}
                      <div className="flex items-center gap-3">
                        {/* Speed */}
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                          hasAlert 
                            ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400" 
                            : "bg-muted/50"
                        )}>
                          <Gauge className="h-3.5 w-3.5" />
                          <span className="font-mono font-semibold">
                            {vehicle.currentSpeed}
                          </span>
                          <span className="text-[10px] opacity-70">km/h</span>
                        </div>
                        
                        {/* Direction indicator */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Navigation2 
                            className="h-3.5 w-3.5" 
                            style={{ transform: `rotate(${vehicle.heading}deg)` }}
                          />
                          <span className="font-mono text-[10px]">{vehicle.heading}°</span>
                        </div>
                        
                        {/* Last update */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          {vehicle.status === "offline" ? (
                            <SignalZero className="h-3.5 w-3.5" />
                          ) : (
                            <Signal className="h-3.5 w-3.5 text-green-500" />
                          )}
                          <span className="font-medium">{formatTime(vehicle.lastUpdate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] px-2 py-0.5 flex-shrink-0",
                        statusConfig.textColor,
                        "bg-transparent border border-current/20"
                      )}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer summary */}
      <div className="p-3 border-t border-sidebar-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Mostrando <span className="font-semibold text-foreground">{filteredVehicles.length}</span> de {vehicles.length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Atualização em tempo real
          </span>
        </div>
      </div>
    </div>
  );
}
