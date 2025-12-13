import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, Trash2, Edit2, Truck, MapPin, Gauge, Battery, 
  Power, Search, Filter, MoreVertical, Navigation2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vehicle, InsertVehicle, VehicleStatus, IgnitionStatus } from "@shared/schema";

const statusLabels: Record<VehicleStatus, string> = {
  moving: "Em Movimento",
  stopped: "Parado",
  idle: "Ocioso",
  offline: "Offline",
};

const statusColors: Record<VehicleStatus, string> = {
  moving: "bg-green-500",
  stopped: "bg-amber-500",
  idle: "bg-blue-500",
  offline: "bg-gray-500",
};

const ignitionLabels: Record<IgnitionStatus, string> = {
  on: "Ligado",
  off: "Desligado",
};

interface VehicleFormData {
  name: string;
  licensePlate: string;
  model: string;
  status: VehicleStatus;
  ignition: IgnitionStatus;
  currentSpeed: number;
  speedLimit: number;
  heading: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel: number | undefined;
}

const defaultFormData: VehicleFormData = {
  name: "",
  licensePlate: "",
  model: "",
  status: "offline",
  ignition: "off",
  currentSpeed: 0,
  speedLimit: 80,
  heading: 0,
  latitude: -23.5505,
  longitude: -46.6333,
  accuracy: 5,
  batteryLevel: undefined,
};

export default function VehiclesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(defaultFormData);

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      return apiRequest("POST", "/api/vehicles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ 
        title: "Veículo criado", 
        description: "O novo veículo foi adicionado à frota com sucesso." 
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Erro", 
        description: "Não foi possível criar o veículo.", 
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertVehicle> }) => {
      return apiRequest("PATCH", `/api/vehicles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ 
        title: "Veículo atualizado", 
        description: "As informações do veículo foram atualizadas com sucesso." 
      });
      setEditingVehicle(null);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Erro", 
        description: "Não foi possível atualizar o veículo.", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ 
        title: "Veículo excluído", 
        description: "O veículo foi removido da frota com sucesso." 
      });
      setDeleteVehicle(null);
    },
    onError: () => {
      toast({ 
        title: "Erro", 
        description: "Não foi possível excluir o veículo.", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setFormData({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      model: vehicle.model || "",
      status: vehicle.status,
      ignition: vehicle.ignition,
      currentSpeed: vehicle.currentSpeed,
      speedLimit: vehicle.speedLimit,
      heading: vehicle.heading,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      accuracy: vehicle.accuracy,
      batteryLevel: vehicle.batteryLevel,
    });
    setEditingVehicle(vehicle);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ 
        title: "Erro", 
        description: "Digite um nome para o veículo.", 
        variant: "destructive" 
      });
      return;
    }
    if (!formData.licensePlate.trim()) {
      toast({ 
        title: "Erro", 
        description: "Digite a placa do veículo.", 
        variant: "destructive" 
      });
      return;
    }

    const vehicleData: InsertVehicle = {
      name: formData.name.trim(),
      licensePlate: formData.licensePlate.trim().toUpperCase(),
      model: formData.model.trim() || undefined,
      status: formData.status,
      ignition: formData.ignition,
      currentSpeed: formData.currentSpeed,
      speedLimit: formData.speedLimit,
      heading: formData.heading,
      latitude: formData.latitude,
      longitude: formData.longitude,
      accuracy: formData.accuracy,
      lastUpdate: new Date().toISOString(),
      batteryLevel: formData.batteryLevel,
    };

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data: vehicleData });
    } else {
      createMutation.mutate(vehicleData);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const vehicleStats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === "moving").length,
    stopped: vehicles.filter(v => v.status === "stopped").length,
    idle: vehicles.filter(v => v.status === "idle").length,
    offline: vehicles.filter(v => v.status === "offline").length,
  };

  return (
    <div className="flex flex-col h-full" data-testid="vehicles-page">
      {/* Header com estatísticas */}
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Veículos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os veículos da sua frota
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} variant="success" className="gap-2" data-testid="button-create-vehicle">
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{vehicleStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{vehicleStats.moving}</p>
                  <p className="text-xs text-muted-foreground">Em Movimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{vehicleStats.stopped}</p>
                  <p className="text-xs text-muted-foreground">Parados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{vehicleStats.idle}</p>
                  <p className="text-xs text-muted-foreground">Ociosos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{vehicleStats.offline}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="p-4 border-b border-border bg-background flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, placa ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VehicleStatus | "all")}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="moving">Em Movimento</SelectItem>
            <SelectItem value="stopped">Parado</SelectItem>
            <SelectItem value="idle">Ocioso</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de veículos */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">Nenhum veículo encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Adicione o primeiro veículo à sua frota"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Veículo
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Velocidade</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Bateria</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            vehicle.status === "offline" ? "bg-muted" : "bg-primary/10"
                          )}>
                            <Truck className={cn(
                              "h-5 w-5",
                              vehicle.status === "offline" ? "text-muted-foreground" : "text-primary"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">{vehicle.name}</p>
                            <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
                            {vehicle.model && (
                              <p className="text-xs text-muted-foreground">{vehicle.model}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit gap-1.5">
                            <div className={cn("h-2 w-2 rounded-full", statusColors[vehicle.status])} />
                            {statusLabels[vehicle.status]}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Power className="h-3 w-3" />
                            {ignitionLabels[vehicle.ignition]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {vehicle.currentSpeed} km/h
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {vehicle.speedLimit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Navigation2 className="h-3 w-3" style={{ transform: `rotate(${vehicle.heading}deg)` }} />
                          {vehicle.heading}°
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Precisão: ±{vehicle.accuracy}m
                        </p>
                      </TableCell>
                      <TableCell>
                        {vehicle.batteryLevel !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Battery className={cn(
                              "h-4 w-4",
                              vehicle.batteryLevel > 50 ? "text-green-500" :
                              vehicle.batteryLevel > 20 ? "text-amber-500" : "text-red-500"
                            )} />
                            <span className="font-mono text-sm">{vehicle.batteryLevel}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(vehicle.lastUpdate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`menu-${vehicle.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(vehicle)} data-testid={`edit-${vehicle.id}`}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteVehicle(vehicle)}
                              className="text-destructive focus:text-destructive"
                              data-testid={`delete-${vehicle.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modal de Criação/Edição */}
      <Dialog 
        open={isCreateOpen || !!editingVehicle} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingVehicle(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle 
                ? "Atualize as informações do veículo abaixo."
                : "Preencha as informações do novo veículo abaixo."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Veículo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Caminhão 01"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">Placa *</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="Ex: ABC-1234"
                  data-testid="input-license-plate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: Mercedes Actros"
                data-testid="input-model"
              />
            </div>

            {/* Status e configurações */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: v as VehicleStatus })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moving">Em Movimento</SelectItem>
                    <SelectItem value="stopped">Parado</SelectItem>
                    <SelectItem value="idle">Ocioso</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ignição</Label>
                <Select 
                  value={formData.ignition} 
                  onValueChange={(v) => setFormData({ ...formData, ignition: v as IgnitionStatus })}
                >
                  <SelectTrigger data-testid="select-ignition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">Ligado</SelectItem>
                    <SelectItem value="off">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Velocidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentSpeed">Velocidade Atual (km/h)</Label>
                <Input
                  id="currentSpeed"
                  type="number"
                  value={formData.currentSpeed}
                  onChange={(e) => setFormData({ ...formData, currentSpeed: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={300}
                  data-testid="input-current-speed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speedLimit">Limite de Velocidade (km/h)</Label>
                <Input
                  id="speedLimit"
                  type="number"
                  value={formData.speedLimit}
                  onChange={(e) => setFormData({ ...formData, speedLimit: parseInt(e.target.value) || 80 })}
                  min={0}
                  max={300}
                  data-testid="input-speed-limit"
                />
              </div>
            </div>

            {/* Localização */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  data-testid="input-latitude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  data-testid="input-longitude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heading">Direção (°)</Label>
                <Input
                  id="heading"
                  type="number"
                  value={formData.heading}
                  onChange={(e) => setFormData({ ...formData, heading: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={360}
                  data-testid="input-heading"
                />
              </div>
            </div>

            {/* Precisão e Bateria */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accuracy">Precisão GPS (metros)</Label>
                <Input
                  id="accuracy"
                  type="number"
                  value={formData.accuracy}
                  onChange={(e) => setFormData({ ...formData, accuracy: parseInt(e.target.value) || 5 })}
                  min={1}
                  max={100}
                  data-testid="input-accuracy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batteryLevel">Nível de Bateria (%)</Label>
                <Input
                  id="batteryLevel"
                  type="number"
                  value={formData.batteryLevel ?? ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    batteryLevel: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  min={0}
                  max={100}
                  placeholder="Opcional"
                  data-testid="input-battery-level"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateOpen(false);
                setEditingVehicle(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-vehicle"
            >
              {(createMutation.isPending || updateMutation.isPending) 
                ? "Salvando..." 
                : editingVehicle ? "Salvar Alterações" : "Criar Veículo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={(open) => !open && setDeleteVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o veículo <strong>{deleteVehicle?.name}</strong> ({deleteVehicle?.licensePlate})?
              <br /><br />
              Esta ação não pode ser desfeita. Todos os dados relacionados a este veículo, incluindo histórico de viagens e alertas, serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVehicle && deleteMutation.mutate(deleteVehicle.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Veículo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




