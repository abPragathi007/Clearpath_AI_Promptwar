import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { alerts as initialAlerts, defaultSettings, hazards as initialHazards, roles, stats as initialStats } from './data.js';
import type { Hazard, HazardSeverity, RoleId, SettingsState } from '../src/types.js';

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

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3001'];

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  }),
);
app.use(express.json({ limit: '16kb' }));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

const MAX_HAZARDS = 200;
const MAX_ALERTS = 50;
const MAX_FIELD_LENGTH = 500;
const VALID_SEVERITIES: HazardSeverity[] = ['low', 'medium', 'high', 'critical'];

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
      id: `alert-${crypto.randomUUID()}`,
      title: 'Profile updated',
      detail: `Commuter mode switched to ${roles.find((role) => role.id === roleId)?.name ?? 'selected role'}.`,
      time: 'Now',
      tone: 'success',
    },
    ...state.alerts.slice(0, 3),
  ];

  res.json({ ok: true, selectedRoleId: roleId });
});

const VALID_INTERFACE_SCALES = ['S', 'M', 'L', 'XL'] as const;
const VALID_SPEECH_SPEEDS = ['slow', 'normal', 'fast'] as const;
const VALID_DETECTION_RADII = [25, 50, 100, 200] as const;
const VALID_CADENCES = ['immediate', 'thirty', 'critical'] as const;

app.patch('/api/settings', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const sanitized: Partial<SettingsState> = {};

  if (typeof body.highContrast === 'boolean') sanitized.highContrast = body.highContrast;
  if (typeof body.audioAlerts === 'boolean') sanitized.audioAlerts = body.audioAlerts;
  if (typeof body.screenReader === 'boolean') sanitized.screenReader = body.screenReader;
  if (typeof body.liveBroadcast === 'boolean') sanitized.liveBroadcast = body.liveBroadcast;

  if (typeof body.interfaceScale === 'string' && (VALID_INTERFACE_SCALES as readonly string[]).includes(body.interfaceScale)) {
    sanitized.interfaceScale = body.interfaceScale as SettingsState['interfaceScale'];
  }
  if (typeof body.speechSpeed === 'string' && (VALID_SPEECH_SPEEDS as readonly string[]).includes(body.speechSpeed)) {
    sanitized.speechSpeed = body.speechSpeed as SettingsState['speechSpeed'];
  }
  if (typeof body.cadence === 'string' && (VALID_CADENCES as readonly string[]).includes(body.cadence)) {
    sanitized.cadence = body.cadence as SettingsState['cadence'];
  }
  if (typeof body.voiceVolume === 'number' && body.voiceVolume >= 0 && body.voiceVolume <= 100) {
    sanitized.voiceVolume = Math.round(body.voiceVolume);
  }
  if (typeof body.detectionRadius === 'number' && (VALID_DETECTION_RADII as readonly number[]).includes(body.detectionRadius)) {
    sanitized.detectionRadius = body.detectionRadius as SettingsState['detectionRadius'];
  }

  state.settings = {
    ...state.settings,
    ...sanitized,
  };

  res.json({ ok: true, settings: state.settings });
});

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

app.post('/api/reports', (req, res) => {
  const payload = req.body as Record<string, unknown>;

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const category = typeof payload.category === 'string' ? payload.category.trim() : '';
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const recommendation = typeof payload.recommendation === 'string' ? payload.recommendation.trim() : '';
  const severity = typeof payload.severity === 'string' ? payload.severity : '';

  if (!title || !category || !summary || !recommendation || !severity) {
    return res.status(400).json({ error: 'Missing required report fields' });
  }

  if (!(VALID_SEVERITIES as readonly string[]).includes(severity)) {
    return res.status(400).json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` });
  }

  const newHazard: Hazard = {
    id: `haz-${crypto.randomUUID()}`,
    title: truncate(title, MAX_FIELD_LENGTH),
    summary: truncate(summary, MAX_FIELD_LENGTH),
    category: truncate(category, MAX_FIELD_LENGTH),
    distance: 'Just reported',
    severity: severity as HazardSeverity,
    status: 'active',
    recommendation: truncate(recommendation, MAX_FIELD_LENGTH),
    createdAt: 'Now',
    confidence: 100,
    position: { top: '40%', left: '48%' },
  };

  state.hazards = [newHazard, ...state.hazards].slice(0, MAX_HAZARDS);
  state.stats = {
    ...state.stats,
    reportsSent: state.stats.reportsSent + 1,
    avoidedHazards: state.stats.avoidedHazards + 1,
  };
  state.alerts = [
    {
      id: `alert-${crypto.randomUUID()}`,
      title: 'Report submitted',
      detail: truncate(title, MAX_FIELD_LENGTH),
      time: 'Now',
      tone: 'success',
    },
    ...state.alerts.slice(0, MAX_ALERTS - 1),
  ];

  res.status(201).json({ ok: true });
});

app.post('/api/actions/view-map', (req, res) => {
  const { location } = req.body as { location?: string };
  const targetLocation = location && location.trim().length > 0 ? location.trim() : 'MG Road, Bengaluru';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetLocation)}`;

  state.alerts = [
    {
      id: `alert-${crypto.randomUUID()}`,
      title: 'Map opened',
      detail: `Opened map for ${targetLocation}.`,
      time: 'Now',
      tone: 'neutral',
    },
    ...state.alerts.slice(0, MAX_ALERTS - 1),
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
      id: `alert-${crypto.randomUUID()}`,
      title: 'Safe journey started',
      detail: 'Navigation is now guiding you through safer segments.',
      time: 'Now',
      tone: 'success',
    },
    ...state.alerts.slice(0, MAX_ALERTS - 1),
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
