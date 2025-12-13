import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Vehicle } from "@shared/schema";

const createVehicleIcon = (heading: number, status: Vehicle["status"], isSelected: boolean) => {
  const colors = {
    moving: { main: "#22c55e", ring: "#86efac" },
    stopped: { main: "#f59e0b", ring: "#fcd34d" },
    idle: { main: "#f59e0b", ring: "#fcd34d" },
    offline: { main: "#94a3b8", ring: "#cbd5e1" }
  };
  
  const { main, ring } = colors[status];
  const size = isSelected ? 48 : 40;
  const ringOpacity = status === "moving" ? "0.4" : "0.2";
  
  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${status}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${main}" flood-opacity="0.4"/>
        </filter>
        <linearGradient id="grad-${status}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${main};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${main};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      
      ${status === "moving" ? `
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="${ring}" opacity="${ringOpacity}">
          <animate attributeName="r" values="${size/2 - 8};${size/2 - 2};${size/2 - 8}" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${ringOpacity};0;${ringOpacity}" dur="2s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
      
      <g transform="rotate(${heading}, ${size/2}, ${size/2})" filter="url(#shadow-${status})">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" fill="url(#grad-${status})" stroke="white" stroke-width="2.5" />
        <polygon points="${size/2},${size/4 + 2} ${size/2 + 6},${size/2 + 4} ${size/2},${size/2} ${size/2 - 6},${size/2 + 4}" fill="white" opacity="0.95"/>
      </g>
      
      ${isSelected ? `
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="none" stroke="${main}" stroke-width="2" stroke-dasharray="4,3" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 ${size/2} ${size/2}" to="360 ${size/2} ${size/2}" dur="8s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "vehicle-marker",
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2 + 4],
  });
};

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected?: boolean;
  onClick?: () => void;
}

export function VehicleMarker({ vehicle, isSelected, onClick }: VehicleMarkerProps) {
  const icon = createVehicleIcon(vehicle.heading, vehicle.status, !!isSelected);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s atrás`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min atrás`;
    return `${Math.floor(diffSeconds / 3600)}h atrás`;
  };

  const statusLabels = {
    moving: { label: "Em Movimento", color: "#22c55e" },
    stopped: { label: "Parado", color: "#f59e0b" },
    idle: { label: "Ocioso", color: "#f59e0b" },
    offline: { label: "Offline", color: "#94a3b8" }
  };

  const statusInfo = statusLabels[vehicle.status];

  return (
    <Marker
      position={[vehicle.latitude, vehicle.longitude]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <div className="min-w-[220px] -m-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="font-bold text-base">{vehicle.name}</div>
              <div className="text-sm text-muted-foreground">{vehicle.licensePlate}</div>
            </div>
            <div 
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: statusInfo.color }}
            >
              {statusInfo.label}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <div className="text-muted-foreground text-xs">Velocidade</div>
              <div className="font-mono font-semibold">{vehicle.currentSpeed} km/h</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground text-xs">Direção</div>
              <div className="font-mono font-semibold">{vehicle.heading}°</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground text-xs">Precisão GPS</div>
              <div className="font-mono">±{vehicle.accuracy}m</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground text-xs">Atualização</div>
              <div>{formatTime(vehicle.lastUpdate)}</div>
            </div>
          </div>
          
          {vehicle.currentSpeed > vehicle.speedLimit && (
            <div className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
              <div className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Acima do limite de {vehicle.speedLimit} km/h
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
