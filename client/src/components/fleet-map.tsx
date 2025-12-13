import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Polyline, Circle, Polygon } from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import { 
  ZoomIn, ZoomOut, Crosshair, Maximize2, Layers, 
  Map as MapIcon, Satellite, Navigation2, Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VehicleMarker } from "./vehicle-marker";
import { cn } from "@/lib/utils";
import type { Vehicle, Geofence } from "@shared/schema";
import "leaflet/dist/leaflet.css";

interface FleetMapProps {
  vehicles: Vehicle[];
  geofences?: Geofence[];
  selectedVehicle?: Vehicle;
  followVehicle?: Vehicle;
  recentTrail?: { latitude: number; longitude: number }[];
  onSelectVehicle: (vehicle: Vehicle) => void;
}

function MapController({ selectedVehicle, followVehicle }: { selectedVehicle?: Vehicle; followVehicle?: Vehicle }) {
  const map = useMap();
  const prevFollowRef = useRef<string | null>(null);

  useEffect(() => {
    if (followVehicle) {
      map.setView([followVehicle.latitude, followVehicle.longitude], map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    } else if (selectedVehicle && prevFollowRef.current !== selectedVehicle.id) {
      map.setView([selectedVehicle.latitude, selectedVehicle.longitude], 15, {
        animate: true,
        duration: 0.5,
      });
      prevFollowRef.current = selectedVehicle.id;
    }
  }, [selectedVehicle, followVehicle, map]);

  return null;
}

function MapControls({ onZoomIn, onZoomOut, onCenter, onFullscreen }: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onFullscreen: () => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-1.5 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="h-9 w-9 rounded-xl hover:bg-muted"
          data-testid="button-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="h-9 w-9 rounded-xl hover:bg-muted"
          data-testid="button-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="h-px bg-border mx-1.5" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onCenter}
          className="h-9 w-9 rounded-xl hover:bg-muted"
          data-testid="button-center"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onFullscreen}
          className="h-9 w-9 rounded-xl hover:bg-muted"
          data-testid="button-fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function GeofenceOverlay({ geofence }: { geofence: Geofence }) {
  const color = geofence.color || "#3b82f6";
  const fillColor = color;

  if (geofence.type === "circle" && geofence.center && geofence.radius) {
    return (
      <Circle
        center={[geofence.center.latitude, geofence.center.longitude]}
        radius={geofence.radius}
        pathOptions={{
          color,
          fillColor,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "8, 4",
        }}
      />
    );
  }

  if (geofence.type === "polygon" && geofence.points && geofence.points.length >= 3) {
    const positions = geofence.points.map(p => [p.latitude, p.longitude] as [number, number]);
    return (
      <Polygon
        positions={positions}
        pathOptions={{
          color,
          fillColor,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "8, 4",
        }}
      />
    );
  }

  return null;
}

export function FleetMap({ 
  vehicles, 
  geofences = [], 
  selectedVehicle, 
  followVehicle,
  recentTrail,
  onSelectVehicle 
}: FleetMapProps) {
  const mapRef = useRef<any>(null);
  const [mapLayer, setMapLayer] = useState<"street" | "satellite">("street");

  const defaultCenter: [number, number] = [-23.5505, -46.6333];
  const defaultZoom = 12;

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleCenter = () => {
    if (mapRef.current && vehicles.length > 0) {
      if (selectedVehicle) {
        mapRef.current.setView([selectedVehicle.latitude, selectedVehicle.longitude], 15);
      } else {
        const bounds = new LatLngBounds(
          vehicles.map(v => new LatLng(v.latitude, v.longitude))
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  const handleFullscreen = () => {
    const mapElement = document.querySelector(".leaflet-container");
    if (mapElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapElement.requestFullscreen();
      }
    }
  };

  const tileUrl = mapLayer === "street"
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  const hasSpeedAlert = selectedVehicle && selectedVehicle.currentSpeed > selectedVehicle.speedLimit;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />
        
        <MapController selectedVehicle={selectedVehicle} followVehicle={followVehicle} />
        
        {geofences.filter(g => g.active).map(geofence => (
          <GeofenceOverlay key={geofence.id} geofence={geofence} />
        ))}
        
        {recentTrail && recentTrail.length > 1 && (
          <Polyline
            positions={recentTrail.map(p => [p.latitude, p.longitude] as [number, number])}
            pathOptions={{
              color: "#3b82f6",
              weight: 4,
              opacity: 0.8,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}
        
        {vehicles.map(vehicle => (
          <VehicleMarker
            key={vehicle.id}
            vehicle={vehicle}
            isSelected={selectedVehicle?.id === vehicle.id}
            onClick={() => onSelectVehicle(vehicle)}
          />
        ))}
      </MapContainer>

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenter={handleCenter}
        onFullscreen={handleFullscreen}
      />

      {/* Layer Toggle */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-1 flex gap-1">
          <Button
            variant={mapLayer === "street" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMapLayer("street")}
            className={cn(
              "gap-2 rounded-xl h-9 px-3",
              mapLayer === "street" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            data-testid="button-map-layer"
          >
            <MapIcon className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-medium">Mapa</span>
          </Button>
          <Button
            variant={mapLayer === "satellite" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMapLayer("satellite")}
            className={cn(
              "gap-2 rounded-xl h-9 px-3",
              mapLayer === "satellite" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            data-testid="button-satellite-layer"
          >
            <Satellite className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-medium">Satélite</span>
          </Button>
        </div>
      </div>

      {/* Selected Vehicle Info Card */}
      {selectedVehicle && (
        <div className="absolute bottom-4 right-4 z-[1000] animate-fade-in">
          <div className={cn(
            "bg-card/95 backdrop-blur-sm rounded-2xl shadow-lg border p-4 min-w-[220px]",
            hasSpeedAlert ? "border-red-500/50" : "border-border/50"
          )}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-semibold text-sm">{selectedVehicle.name}</div>
                <div className="text-xs text-muted-foreground">{selectedVehicle.licensePlate}</div>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px]",
                  selectedVehicle.status === "moving" && "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
                  selectedVehicle.status === "stopped" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                  selectedVehicle.status === "offline" && "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                )}
              >
                {selectedVehicle.status === "moving" ? "Movimento" : 
                 selectedVehicle.status === "stopped" ? "Parado" : "Offline"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  hasSpeedAlert ? "bg-red-100 dark:bg-red-950/50" : "bg-muted"
                )}>
                  <Gauge className={cn(
                    "h-4 w-4",
                    hasSpeedAlert ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <div className={cn(
                    "font-mono font-bold text-sm",
                    hasSpeedAlert && "text-red-600 dark:text-red-400"
                  )}>
                    {selectedVehicle.currentSpeed}
                  </div>
                  <div className="text-[10px] text-muted-foreground">km/h</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Navigation2 
                    className="h-4 w-4 text-muted-foreground" 
                    style={{ transform: `rotate(${selectedVehicle.heading}deg)` }}
                  />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm">{selectedVehicle.heading}°</div>
                  <div className="text-[10px] text-muted-foreground">Direção</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
