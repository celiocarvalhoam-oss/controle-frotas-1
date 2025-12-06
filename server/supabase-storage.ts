import { getSupabaseClient, type Database } from "./supabase";
import type { IStorage } from "./storage";
import type {
  Vehicle,
  InsertVehicle,
  Geofence,
  InsertGeofence,
  Alert,
  InsertAlert,
  Trip,
  SpeedViolation,
  VehicleStats,
  LocationPoint,
  RouteEvent,
} from "@shared/schema";

type VehicleUpdateCallback = (vehicles: Vehicle[]) => void;

/**
 * Converte um registro do banco de dados para o formato da aplicação (Vehicle)
 */
function dbVehicleToVehicle(dbVehicle: Database["public"]["Tables"]["vehicles"]["Row"]): Vehicle {
  return {
    id: dbVehicle.id,
    name: dbVehicle.name,
    licensePlate: dbVehicle.license_plate,
    model: dbVehicle.model ?? undefined,
    status: dbVehicle.status,
    ignition: dbVehicle.ignition,
    currentSpeed: dbVehicle.current_speed,
    speedLimit: dbVehicle.speed_limit,
    heading: dbVehicle.heading,
    latitude: dbVehicle.latitude,
    longitude: dbVehicle.longitude,
    accuracy: dbVehicle.accuracy,
    lastUpdate: dbVehicle.last_update,
    batteryLevel: dbVehicle.battery_level ?? undefined,
  };
}

/**
 * Converte dados de InsertVehicle para o formato do banco de dados
 */
function vehicleToDbInsert(vehicle: InsertVehicle): Database["public"]["Tables"]["vehicles"]["Insert"] {
  return {
    name: vehicle.name,
    license_plate: vehicle.licensePlate,
    model: vehicle.model,
    status: vehicle.status,
    ignition: vehicle.ignition,
    current_speed: vehicle.currentSpeed,
    speed_limit: vehicle.speedLimit,
    heading: vehicle.heading,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    accuracy: vehicle.accuracy,
    last_update: vehicle.lastUpdate,
    battery_level: vehicle.batteryLevel,
  };
}

/**
 * Converte um registro do banco de dados para o formato da aplicação (Geofence)
 */
function dbGeofenceToGeofence(dbGeofence: Database["public"]["Tables"]["geofences"]["Row"]): Geofence {
  return {
    id: dbGeofence.id,
    name: dbGeofence.name,
    description: dbGeofence.description ?? undefined,
    type: dbGeofence.type,
    active: dbGeofence.active,
    center: dbGeofence.center ?? undefined,
    radius: dbGeofence.radius ?? undefined,
    points: dbGeofence.points ?? undefined,
    rules: dbGeofence.rules,
    vehicleIds: dbGeofence.vehicle_ids,
    lastTriggered: dbGeofence.last_triggered ?? undefined,
    color: dbGeofence.color ?? undefined,
  };
}

/**
 * Converte dados de InsertGeofence para o formato do banco de dados
 */
function geofenceToDbInsert(geofence: InsertGeofence): Database["public"]["Tables"]["geofences"]["Insert"] {
  return {
    name: geofence.name,
    description: geofence.description,
    type: geofence.type,
    active: geofence.active,
    center: geofence.center,
    radius: geofence.radius,
    points: geofence.points,
    rules: geofence.rules,
    vehicle_ids: geofence.vehicleIds,
    last_triggered: geofence.lastTriggered,
    color: geofence.color,
  };
}

/**
 * Converte um registro do banco de dados para o formato da aplicação (Alert)
 */
function dbAlertToAlert(dbAlert: Database["public"]["Tables"]["alerts"]["Row"]): Alert {
  return {
    id: dbAlert.id,
    type: dbAlert.type,
    priority: dbAlert.priority,
    vehicleId: dbAlert.vehicle_id,
    vehicleName: dbAlert.vehicle_name,
    message: dbAlert.message,
    timestamp: dbAlert.timestamp,
    read: dbAlert.read,
    latitude: dbAlert.latitude ?? undefined,
    longitude: dbAlert.longitude ?? undefined,
    speed: dbAlert.speed ?? undefined,
    speedLimit: dbAlert.speed_limit ?? undefined,
    geofenceName: dbAlert.geofence_name ?? undefined,
  };
}

/**
 * Converte dados de InsertAlert para o formato do banco de dados
 */
function alertToDbInsert(alert: InsertAlert): Database["public"]["Tables"]["alerts"]["Insert"] {
  return {
    type: alert.type,
    priority: alert.priority,
    vehicle_id: alert.vehicleId,
    vehicle_name: alert.vehicleName,
    message: alert.message,
    timestamp: alert.timestamp,
    read: alert.read,
    latitude: alert.latitude,
    longitude: alert.longitude,
    speed: alert.speed,
    speed_limit: alert.speedLimit,
    geofence_name: alert.geofenceName,
  };
}

/**
 * Converte um registro do banco de dados para o formato da aplicação (SpeedViolation)
 */
function dbSpeedViolationToSpeedViolation(
  dbViolation: Database["public"]["Tables"]["speed_violations"]["Row"]
): SpeedViolation {
  return {
    id: dbViolation.id,
    vehicleId: dbViolation.vehicle_id,
    vehicleName: dbViolation.vehicle_name,
    speed: dbViolation.speed,
    speedLimit: dbViolation.speed_limit,
    excessSpeed: dbViolation.excess_speed,
    timestamp: dbViolation.timestamp,
    latitude: dbViolation.latitude,
    longitude: dbViolation.longitude,
    duration: dbViolation.duration,
  };
}

/**
 * Implementação do Storage usando Supabase como backend
 */
export class SupabaseStorage implements IStorage {
  private updateCallbacks: Set<VehicleUpdateCallback> = new Set();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Inicia polling para atualizações de veículos (alternativa ao Realtime)
    this.startPolling();
  }

  /**
   * Registra callback para atualizações de veículos
   */
  onVehicleUpdate(callback: VehicleUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Notifica todos os callbacks registrados sobre atualizações
   */
  private async notifyVehicleUpdate() {
    try {
      const vehicles = await this.getVehicles();
      this.updateCallbacks.forEach((cb) => cb(vehicles));
    } catch (error) {
      console.error("Erro ao notificar atualização de veículos:", error);
    }
  }

  /**
   * Inicia polling para verificar atualizações de veículos
   */
  private startPolling() {
    // Polling a cada 3 segundos para manter compatibilidade com o comportamento anterior
    this.pollingInterval = setInterval(async () => {
      if (this.updateCallbacks.size > 0) {
        await this.notifyVehicleUpdate();
      }
    }, 3000);
  }

  /**
   * Para o polling de atualizações
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // ============================================
  // Vehicles
  // ============================================

  async getVehicles(): Promise<Vehicle[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("name");

    if (error) {
      console.error("Erro ao buscar veículos:", error);
      throw new Error("Falha ao buscar veículos");
    }

    return (data || []).map(dbVehicleToVehicle);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined; // Not found
      }
      console.error("Erro ao buscar veículo:", error);
      throw new Error("Falha ao buscar veículo");
    }

    return data ? dbVehicleToVehicle(data) : undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("vehicles")
      .insert(vehicleToDbInsert(vehicle))
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar veículo:", error);
      throw new Error("Falha ao criar veículo");
    }

    const newVehicle = dbVehicleToVehicle(data);
    await this.notifyVehicleUpdate();
    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const supabase = getSupabaseClient();

    // Converte as atualizações para o formato do banco
    const dbUpdates: Database["public"]["Tables"]["vehicles"]["Update"] = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.ignition !== undefined) dbUpdates.ignition = updates.ignition;
    if (updates.currentSpeed !== undefined) dbUpdates.current_speed = updates.currentSpeed;
    if (updates.speedLimit !== undefined) dbUpdates.speed_limit = updates.speedLimit;
    if (updates.heading !== undefined) dbUpdates.heading = updates.heading;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.accuracy !== undefined) dbUpdates.accuracy = updates.accuracy;
    if (updates.lastUpdate !== undefined) dbUpdates.last_update = updates.lastUpdate;
    if (updates.batteryLevel !== undefined) dbUpdates.battery_level = updates.batteryLevel;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("vehicles")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Erro ao atualizar veículo:", error);
      throw new Error("Falha ao atualizar veículo");
    }

    const updatedVehicle = data ? dbVehicleToVehicle(data) : undefined;
    if (updatedVehicle) {
      await this.notifyVehicleUpdate();
    }
    return updatedVehicle;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error, count } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar veículo:", error);
      throw new Error("Falha ao deletar veículo");
    }

    if (count && count > 0) {
      await this.notifyVehicleUpdate();
      return true;
    }
    return false;
  }

  // ============================================
  // Geofences
  // ============================================

  async getGeofences(): Promise<Geofence[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("geofences")
      .select("*")
      .order("name");

    if (error) {
      console.error("Erro ao buscar geofences:", error);
      throw new Error("Falha ao buscar geofences");
    }

    return (data || []).map(dbGeofenceToGeofence);
  }

  async getGeofence(id: string): Promise<Geofence | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("geofences")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Erro ao buscar geofence:", error);
      throw new Error("Falha ao buscar geofence");
    }

    return data ? dbGeofenceToGeofence(data) : undefined;
  }

  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("geofences")
      .insert(geofenceToDbInsert(geofence))
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar geofence:", error);
      throw new Error("Falha ao criar geofence");
    }

    return dbGeofenceToGeofence(data);
  }

  async updateGeofence(id: string, updates: Partial<Geofence>): Promise<Geofence | undefined> {
    const supabase = getSupabaseClient();

    const dbUpdates: Database["public"]["Tables"]["geofences"]["Update"] = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.center !== undefined) dbUpdates.center = updates.center;
    if (updates.radius !== undefined) dbUpdates.radius = updates.radius;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.rules !== undefined) dbUpdates.rules = updates.rules;
    if (updates.vehicleIds !== undefined) dbUpdates.vehicle_ids = updates.vehicleIds;
    if (updates.lastTriggered !== undefined) dbUpdates.last_triggered = updates.lastTriggered;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("geofences")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Erro ao atualizar geofence:", error);
      throw new Error("Falha ao atualizar geofence");
    }

    return data ? dbGeofenceToGeofence(data) : undefined;
  }

  async deleteGeofence(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error, count } = await supabase
      .from("geofences")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar geofence:", error);
      throw new Error("Falha ao deletar geofence");
    }

    return count !== null && count > 0;
  }

  // ============================================
  // Alerts
  // ============================================

  async getAlerts(): Promise<Alert[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Erro ao buscar alertas:", error);
      throw new Error("Falha ao buscar alertas");
    }

    return (data || []).map(dbAlertToAlert);
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Erro ao buscar alerta:", error);
      throw new Error("Falha ao buscar alerta");
    }

    return data ? dbAlertToAlert(data) : undefined;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("alerts")
      .insert(alertToDbInsert(alert))
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar alerta:", error);
      throw new Error("Falha ao criar alerta");
    }

    return dbAlertToAlert(data);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const supabase = getSupabaseClient();

    const dbUpdates: Database["public"]["Tables"]["alerts"]["Update"] = {};
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.vehicleId !== undefined) dbUpdates.vehicle_id = updates.vehicleId;
    if (updates.vehicleName !== undefined) dbUpdates.vehicle_name = updates.vehicleName;
    if (updates.message !== undefined) dbUpdates.message = updates.message;
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;
    if (updates.read !== undefined) dbUpdates.read = updates.read;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.speed !== undefined) dbUpdates.speed = updates.speed;
    if (updates.speedLimit !== undefined) dbUpdates.speed_limit = updates.speedLimit;
    if (updates.geofenceName !== undefined) dbUpdates.geofence_name = updates.geofenceName;

    const { data, error } = await supabase
      .from("alerts")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Erro ao atualizar alerta:", error);
      throw new Error("Falha ao atualizar alerta");
    }

    return data ? dbAlertToAlert(data) : undefined;
  }

  async markAllAlertsRead(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("alerts")
      .update({ read: true })
      .eq("read", false);

    if (error) {
      console.error("Erro ao marcar alertas como lidos:", error);
      throw new Error("Falha ao marcar alertas como lidos");
    }
  }

  async clearReadAlerts(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("read", true);

    if (error) {
      console.error("Erro ao limpar alertas lidos:", error);
      throw new Error("Falha ao limpar alertas lidos");
    }
  }

  // ============================================
  // Trips
  // ============================================

  async getTrips(vehicleId: string, startDate: string, endDate: string): Promise<Trip[]> {
    const supabase = getSupabaseClient();

    // Busca viagens no período
    const { data: tripsData, error: tripsError } = await supabase
      .from("trips")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .gte("start_time", startDate)
      .lte("end_time", endDate)
      .order("start_time", { ascending: false });

    if (tripsError) {
      console.error("Erro ao buscar viagens:", tripsError);
      throw new Error("Falha ao buscar viagens");
    }

    if (!tripsData || tripsData.length === 0) {
      return [];
    }

    // Para cada viagem, busca os pontos e eventos
    const trips: Trip[] = await Promise.all(
      tripsData.map(async (trip) => {
        const [pointsResult, eventsResult] = await Promise.all([
          supabase
            .from("location_points")
            .select("*")
            .eq("trip_id", trip.id)
            .order("timestamp"),
          supabase
            .from("route_events")
            .select("*")
            .eq("trip_id", trip.id)
            .order("timestamp"),
        ]);

        const points: LocationPoint[] = (pointsResult.data || []).map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
          speed: p.speed,
          heading: p.heading,
          timestamp: p.timestamp,
          accuracy: p.accuracy ?? undefined,
        }));

        const events: RouteEvent[] = (eventsResult.data || []).map((e) => ({
          id: e.id,
          type: e.type,
          latitude: e.latitude,
          longitude: e.longitude,
          timestamp: e.timestamp,
          duration: e.duration ?? undefined,
          speed: e.speed ?? undefined,
          speedLimit: e.speed_limit ?? undefined,
          geofenceName: e.geofence_name ?? undefined,
          address: e.address ?? undefined,
        }));

        return {
          id: trip.id,
          vehicleId: trip.vehicle_id,
          startTime: trip.start_time,
          endTime: trip.end_time,
          totalDistance: trip.total_distance,
          travelTime: trip.travel_time,
          stoppedTime: trip.stopped_time,
          averageSpeed: trip.average_speed,
          maxSpeed: trip.max_speed,
          stopsCount: trip.stops_count,
          points,
          events,
        };
      })
    );

    return trips;
  }

  // ============================================
  // Speed Violations & Stats
  // ============================================

  async getSpeedViolations(startDate: string, endDate: string): Promise<SpeedViolation[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("speed_violations")
      .select("*")
      .gte("timestamp", startDate)
      .lte("timestamp", endDate)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Erro ao buscar violações de velocidade:", error);
      throw new Error("Falha ao buscar violações de velocidade");
    }

    return (data || []).map(dbSpeedViolationToSpeedViolation);
  }

  async getSpeedStats(startDate: string, endDate: string): Promise<VehicleStats> {
    const violations = await this.getSpeedViolations(startDate, endDate);

    // Agrupa por veículo
    const byVehicle = new Map<
      string,
      { count: number; totalExcess: number; lastViolation: string; name: string }
    >();

    violations.forEach((v) => {
      const existing = byVehicle.get(v.vehicleId);
      if (existing) {
        existing.count++;
        existing.totalExcess += v.excessSpeed;
        if (new Date(v.timestamp) > new Date(existing.lastViolation)) {
          existing.lastViolation = v.timestamp;
        }
      } else {
        byVehicle.set(v.vehicleId, {
          count: 1,
          totalExcess: v.excessSpeed,
          lastViolation: v.timestamp,
          name: v.vehicleName,
        });
      }
    });

    // Agrupa por dia
    const byDay = new Map<string, number>();
    violations.forEach((v) => {
      const day = v.timestamp.split("T")[0];
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });

    // Top violadores
    const topViolators = Array.from(byVehicle.entries())
      .map(([vehicleId, data]) => ({
        vehicleId,
        vehicleName: data.name,
        totalViolations: data.count,
        averageExcessSpeed: data.totalExcess / data.count,
        lastViolation: data.lastViolation,
      }))
      .sort((a, b) => b.totalViolations - a.totalViolations)
      .slice(0, 10);

    return {
      totalViolations: violations.length,
      vehiclesWithViolations: byVehicle.size,
      averageExcessSpeed:
        violations.length > 0
          ? violations.reduce((sum, v) => sum + v.excessSpeed, 0) / violations.length
          : 0,
      violationsByDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topViolators,
    };
  }
}

