export type ScreenId = 'onboarding' | 'dashboard' | 'feed' | 'stats' | 'settings';

export type RoleId =
  | 'cyclist'
  | 'escooter'
  | 'pedestrian'
  | 'wheelchair'
  | 'visually_impaired'
  | 'driver';

export interface RoleOption {
  id: RoleId;
  name: string;
  description: string;
  icon: string;
  accent: string;
  highlight?: boolean;
}

export type HazardSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Hazard {
  id: string;
  title: string;
  summary: string;
  category: string;
  distance: string;
  severity: HazardSeverity;
  status: 'active' | 'resolved' | 'watch';
  recommendation: string;
  createdAt: string;
  confidence: number;
  position: { top: string; left: string };
}

export interface AlertItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

export interface StatsSnapshot {
  avoidedHazards: number;
  saferKm: number;
  reportsSent: number;
  accuracy: number;
  liveCommuters: number;
  weeklyReports: number[];
}

export interface SettingsState {
  highContrast: boolean;
  audioAlerts: boolean;
  screenReader: boolean;
  liveBroadcast: boolean;
  interfaceScale: 'S' | 'M' | 'L' | 'XL';
  voiceVolume: number;
  speechSpeed: 'slow' | 'normal' | 'fast';
  detectionRadius: 25 | 50 | 100 | 200;
  cadence: 'immediate' | 'thirty' | 'critical';
}

export interface BootstrapResponse {
  profile: {
    name: string;
    role: string;
    status: string;
  };
  selectedRoleId: RoleId | null;
  selectedScreen: ScreenId;
  roles: RoleOption[];
  hazards: Hazard[];
  alerts: AlertItem[];
  stats: StatsSnapshot;
  settings: SettingsState;
}
