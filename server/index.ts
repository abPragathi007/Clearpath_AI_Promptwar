import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { alerts as initialAlerts, defaultSettings, hazards as initialHazards, roles, stats as initialStats } from './data.js';
import type { Hazard, RoleId, SettingsState } from '../src/types.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const isProduction = process.env.NODE_ENV === 'production';
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const clientDir = path.resolve(currentDir, '..', 'client');

const state = {
  profile: {
    name: 'Sentinel Overseer',
    role: 'System Administrator',
    status: 'Connected',
  },
  selectedRoleId: null as RoleId | null,
  selectedScreen: 'onboarding' as 'onboarding' | 'dashboard',
  hazards: [...initialHazards],
  alerts: [...initialAlerts],
  stats: { ...initialStats },
  settings: { ...defaultSettings },
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'clearpath-ai-api' });
});

app.get('/api/bootstrap', (_req, res) => {
  res.json({
    profile: state.profile,
    selectedRoleId: state.selectedRoleId,
    selectedScreen: state.selectedRoleId ? 'dashboard' : 'onboarding',
    roles,
    hazards: state.hazards,
    alerts: state.alerts,
    stats: state.stats,
    settings: state.settings,
  });
});

app.post('/api/role-select', (req, res) => {
  const { roleId } = req.body as { roleId?: RoleId };

  if (!roleId || !roles.some((role) => role.id === roleId)) {
    return res.status(400).json({ error: 'Invalid roleId' });
  }

  state.selectedRoleId = roleId;
  state.selectedScreen = 'dashboard';
  state.profile = {
    ...state.profile,
    role: roles.find((role) => role.id === roleId)?.name ?? state.profile.role,
  };
  state.alerts = [
    {
      id: `alert-${Date.now()}`,
      title: 'Profile updated',
      detail: `Commuter mode switched to ${roles.find((role) => role.id === roleId)?.name ?? 'selected role'}.`,
      time: 'Now',
      tone: 'success',
    },
    ...state.alerts.slice(0, 3),
  ];

  res.json({ ok: true, selectedRoleId: roleId });
});

app.patch('/api/settings', (req, res) => {
  const nextSettings = req.body as Partial<SettingsState>;
  state.settings = {
    ...state.settings,
    ...nextSettings,
  };

  res.json({ ok: true, settings: state.settings });
});

app.post('/api/reports', (req, res) => {
  const payload = req.body as Partial<Hazard> & {
    title?: string;
    category?: string;
    summary?: string;
    recommendation?: string;
    severity?: Hazard['severity'];
  };

  if (!payload.title || !payload.category || !payload.summary || !payload.recommendation || !payload.severity) {
    return res.status(400).json({ error: 'Missing required report fields' });
  }

  const newHazard: Hazard = {
    id: `haz-${Date.now()}`,
    title: payload.title,
    summary: payload.summary,
    category: payload.category,
    distance: 'Just reported',
    severity: payload.severity,
    status: 'active',
    recommendation: payload.recommendation,
    createdAt: 'Now',
    confidence: 100,
    position: { top: '40%', left: '48%' },
  };

  state.hazards = [newHazard, ...state.hazards];
  state.stats = {
    ...state.stats,
    reportsSent: state.stats.reportsSent + 1,
    avoidedHazards: state.stats.avoidedHazards + 1,
  };
  state.alerts = [
    {
      id: `alert-${Date.now()}`,
      title: 'Report submitted',
      detail: payload.title,
      time: 'Now',
      tone: 'success',
    },
    ...state.alerts.slice(0, 4),
  ];

  res.status(201).json({ ok: true });
});

app.post('/api/actions/view-map', (req, res) => {
  const { location } = req.body as { location?: string };
  const targetLocation = location && location.trim().length > 0 ? location.trim() : 'MG Road, Bengaluru';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetLocation)}`;

  state.alerts = [
    {
      id: `alert-${Date.now()}`,
      title: 'Map opened',
      detail: `Opened map for ${targetLocation}.`,
      time: 'Now',
      tone: 'neutral',
    },
    ...state.alerts.slice(0, 4),
  ];

  res.json({ ok: true, mapUrl });
});

app.post('/api/actions/start-journey', (_req, res) => {
  state.stats = {
    ...state.stats,
    saferKm: Number((state.stats.saferKm + 0.2).toFixed(1)),
    liveCommuters: state.stats.liveCommuters + 1,
  };

  state.alerts = [
    {
      id: `alert-${Date.now()}`,
      title: 'Safe journey started',
      detail: 'Navigation is now guiding you through safer segments.',
      time: 'Now',
      tone: 'success',
    },
    ...state.alerts.slice(0, 4),
  ];

  res.json({ ok: true, message: 'Safe journey started successfully.' });
});

if (isProduction && fs.existsSync(path.join(clientDir, 'index.html'))) {
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`ClearPath AI API running on http://localhost:${port}`);
});
