import type { BootstrapResponse, RoleId, SettingsState } from '../types';

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getBootstrap() {
  return requestJson<BootstrapResponse>('/api/bootstrap');
}

export function selectRole(roleId: RoleId) {
  return requestJson<{ ok: true; selectedRoleId: RoleId }>('/api/role-select', {
    method: 'POST',
    body: JSON.stringify({ roleId }),
  });
}

export function updateSettings(settings: Partial<SettingsState>) {
  return requestJson<{ ok: true; settings: SettingsState }>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export function submitHazardReport(payload: {
  title: string;
  category: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}) {
  return requestJson<{ ok: true }>('/api/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function viewOnMap(location: string) {
  return requestJson<{ ok: true; mapUrl: string }>('/api/actions/view-map', {
    method: 'POST',
    body: JSON.stringify({ location }),
  });
}

export function startJourney() {
  return requestJson<{ ok: true; message: string }>('/api/actions/start-journey', {
    method: 'POST',
    body: JSON.stringify({ mode: 'safe' }),
  });
}
