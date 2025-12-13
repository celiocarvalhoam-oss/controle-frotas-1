import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Tipos do banco de dados para melhor autocompletion
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          created_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          license_plate: string;
          model: string | null;
          status: "moving" | "stopped" | "idle" | "offline";
          ignition: "on" | "off";
          current_speed: number;
          speed_limit: number;
          heading: number;
          latitude: number;
          longitude: number;
          accuracy: number;
          last_update: string;
          battery_level: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          license_plate: string;
          model?: string | null;
          status?: "moving" | "stopped" | "idle" | "offline";
          ignition?: "on" | "off";
          current_speed?: number;
          speed_limit?: number;
          heading?: number;
          latitude: number;
          longitude: number;
          accuracy?: number;
          last_update?: string;
          battery_level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          license_plate?: string;
          model?: string | null;
          status?: "moving" | "stopped" | "idle" | "offline";
          ignition?: "on" | "off";
          current_speed?: number;
          speed_limit?: number;
          heading?: number;
          latitude?: number;
          longitude?: number;
          accuracy?: number;
          last_update?: string;
          battery_level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      geofences: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: "circle" | "polygon";
          active: boolean;
          center: { latitude: number; longitude: number } | null;
          radius: number | null;
          points: Array<{ latitude: number; longitude: number }> | null;
          rules: Array<{
            type: "entry" | "exit" | "dwell" | "time_violation";
            enabled: boolean;
            dwellTimeMinutes?: number;
            startTime?: string;
            endTime?: string;
            toleranceSeconds?: number;
          }>;
          vehicle_ids: string[];
          last_triggered: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: "circle" | "polygon";
          active?: boolean;
          center?: { latitude: number; longitude: number } | null;
          radius?: number | null;
          points?: Array<{ latitude: number; longitude: number }> | null;
          rules?: Array<{
            type: "entry" | "exit" | "dwell" | "time_violation";
            enabled: boolean;
            dwellTimeMinutes?: number;
            startTime?: string;
            endTime?: string;
            toleranceSeconds?: number;
          }>;
          vehicle_ids?: string[];
          last_triggered?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: "circle" | "polygon";
          active?: boolean;
          center?: { latitude: number; longitude: number } | null;
          radius?: number | null;
          points?: Array<{ latitude: number; longitude: number }> | null;
          rules?: Array<{
            type: "entry" | "exit" | "dwell" | "time_violation";
            enabled: boolean;
            dwellTimeMinutes?: number;
            startTime?: string;
            endTime?: string;
            toleranceSeconds?: number;
          }>;
          vehicle_ids?: string[];
          last_triggered?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: "speed" | "geofence_entry" | "geofence_exit" | "geofence_dwell" | "system";
          priority: "critical" | "warning" | "info";
          vehicle_id: string;
          vehicle_name: string;
          message: string;
          timestamp: string;
          read: boolean;
          latitude: number | null;
          longitude: number | null;
          speed: number | null;
          speed_limit: number | null;
          geofence_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "speed" | "geofence_entry" | "geofence_exit" | "geofence_dwell" | "system";
          priority: "critical" | "warning" | "info";
          vehicle_id: string;
          vehicle_name: string;
          message: string;
          timestamp?: string;
          read?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          speed?: number | null;
          speed_limit?: number | null;
          geofence_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: "speed" | "geofence_entry" | "geofence_exit" | "geofence_dwell" | "system";
          priority?: "critical" | "warning" | "info";
          vehicle_id?: string;
          vehicle_name?: string;
          message?: string;
          timestamp?: string;
          read?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          speed?: number | null;
          speed_limit?: number | null;
          geofence_name?: string | null;
          created_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          vehicle_id: string;
          start_time: string;
          end_time: string;
          total_distance: number;
          travel_time: number;
          stopped_time: number;
          average_speed: number;
          max_speed: number;
          stops_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          start_time: string;
          end_time: string;
          total_distance?: number;
          travel_time?: number;
          stopped_time?: number;
          average_speed?: number;
          max_speed?: number;
          stops_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          start_time?: string;
          end_time?: string;
          total_distance?: number;
          travel_time?: number;
          stopped_time?: number;
          average_speed?: number;
          max_speed?: number;
          stops_count?: number;
          created_at?: string;
        };
      };
      location_points: {
        Row: {
          id: string;
          trip_id: string;
          latitude: number;
          longitude: number;
          speed: number;
          heading: number;
          timestamp: string;
          accuracy: number | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          latitude: number;
          longitude: number;
          speed?: number;
          heading?: number;
          timestamp: string;
          accuracy?: number | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          latitude?: number;
          longitude?: number;
          speed?: number;
          heading?: number;
          timestamp?: string;
          accuracy?: number | null;
        };
      };
      route_events: {
        Row: {
          id: string;
          trip_id: string;
          type: "departure" | "arrival" | "stop" | "speed_violation" | "geofence_entry" | "geofence_exit";
          latitude: number;
          longitude: number;
          timestamp: string;
          duration: number | null;
          speed: number | null;
          speed_limit: number | null;
          geofence_name: string | null;
          address: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          type: "departure" | "arrival" | "stop" | "speed_violation" | "geofence_entry" | "geofence_exit";
          latitude: number;
          longitude: number;
          timestamp: string;
          duration?: number | null;
          speed?: number | null;
          speed_limit?: number | null;
          geofence_name?: string | null;
          address?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          type?: "departure" | "arrival" | "stop" | "speed_violation" | "geofence_entry" | "geofence_exit";
          latitude?: number;
          longitude?: number;
          timestamp?: string;
          duration?: number | null;
          speed?: number | null;
          speed_limit?: number | null;
          geofence_name?: string | null;
          address?: string | null;
        };
      };
      speed_violations: {
        Row: {
          id: string;
          vehicle_id: string;
          vehicle_name: string;
          speed: number;
          speed_limit: number;
          excess_speed: number;
          timestamp: string;
          latitude: number;
          longitude: number;
          duration: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          vehicle_name: string;
          speed: number;
          speed_limit: number;
          excess_speed: number;
          timestamp: string;
          latitude: number;
          longitude: number;
          duration?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          vehicle_name?: string;
          speed?: number;
          speed_limit?: number;
          excess_speed?: number;
          timestamp?: string;
          latitude?: number;
          longitude?: number;
          duration?: number;
          created_at?: string;
        };
      };
    };
  };
};

// Singleton do cliente Supabase
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Obtém o cliente Supabase configurado.
 * Lança erro se as variáveis de ambiente não estiverem configuradas.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env"
    );
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

/**
 * Verifica se o Supabase está configurado (variáveis de ambiente presentes)
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

/**
 * Obtém o cliente Supabase com a service role key para operações administrativas.
 * Use apenas no servidor para operações que precisam bypassar RLS.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase Admin não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}




