import { useEffect, useMemo, useState } from 'react';
import {
  getBootstrap,
  selectRole,
  startJourney,
  submitHazardReport,
  updateSettings,
  viewOnMap,
} from './lib/api';
import type {
  AlertItem,
  BootstrapResponse,
  Hazard,
  RoleId,
  ScreenId,
  SettingsState,
  StatsSnapshot,
} from './types';

const navItems: Array<{ id: ScreenId; label: string; icon: string }> = [
  { id: 'onboarding', label: 'Onboard', icon: '🛡️' },
  { id: 'dashboard', label: 'HUD', icon: '🧭' },
  { id: 'feed', label: 'Feed', icon: '📹' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'settings', label: 'Config', icon: '⚙️' },
];

function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('onboarding');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportDraft, setReportDraft] = useState({
    title: 'Vehicle in Bike Lane',
    category: 'Vehicle',
    summary: 'Temporary obstruction blocking the protected lane.',
    severity: 'high' as Hazard['severity'],
    recommendation: 'Merge left and re-enter after the junction.',
  });
  const [settingsDraft, setSettingsDraft] = useState<SettingsState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getBootstrap()
      .then((data) => {
        setBootstrap(data);
        setActiveScreen(data.selectedScreen);
        setSettingsDraft(data.settings);
      })
      .catch((error: Error) => {
        setMessage(error.message);
      });
  }, []);

  const selectedRole = useMemo(
    () => bootstrap?.roles.find((role) => role.id === bootstrap.selectedRoleId) ?? null,
    [bootstrap],
  );

  const isAccessibilityMode = selectedRole?.id === 'visually_impaired' || Boolean(bootstrap?.settings.highContrast);

  async function handleRoleSelect(roleId: RoleId) {
    setMessage(null);
    try {
      await selectRole(roleId);
      const refreshed = await getBootstrap();
      setBootstrap(refreshed);
      setActiveScreen('dashboard');
      setSettingsDraft(refreshed.settings);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update commuter profile');
    }
  }

  async function handleSaveSettings(nextSettings: SettingsState) {
    setMessage(null);
    setSettingsDraft(nextSettings);
    try {
      const response = await updateSettings(nextSettings);
      if (bootstrap) {
        setBootstrap({ ...bootstrap, settings: response.settings });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save settings');
    }
  }

  async function handleSubmitReport() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      await submitHazardReport(reportDraft);
      const refreshed = await getBootstrap();
      setBootstrap(refreshed);
      setActiveScreen('feed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit report');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleViewOnMap() {
    setMessage(null);
    try {
      const response = await viewOnMap('MG Road, Bengaluru');
      window.open(response.mapUrl, '_blank', 'noopener,noreferrer');
      const refreshed = await getBootstrap();
      setBootstrap(refreshed);
      setActiveScreen('dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open map view');
    }
  }

  async function handleStartJourney() {
    setMessage(null);
    try {
      const response = await startJourney();
      setMessage(response.message);
      const refreshed = await getBootstrap();
      setBootstrap(refreshed);
      setActiveScreen('dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start journey');
    }
  }

  if (!bootstrap || !settingsDraft) {
    return <LoadingState />;
  }

  const hazards = bootstrap.hazards;
  const alerts = bootstrap.alerts;
  const stats = bootstrap.stats;
  const roles = bootstrap.roles;

  return (
    <div className={isAccessibilityMode ? 'min-h-screen bg-black text-white' : 'min-h-screen text-[#d7e3fc]'}>
      <div className="fixed inset-0 pointer-events-none opacity-70">
        <div className="absolute -top-32 left-[-5%] h-72 w-72 rounded-full bg-[#46f1c5]/15 blur-3xl" />
        <div className="absolute top-1/3 right-[-8%] h-80 w-80 rounded-full bg-[#f59e0b]/10 blur-3xl" />
      </div>

      <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#071325]/90 px-5 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#46f1c5]/12 text-[#46f1c5] halo text-xl">
            <span aria-hidden="true">🛡️</span>
          </div>
          <div>
            <div className="font-headline text-lg font-bold tracking-[0.18em] text-[#46f1c5]">CLEARPATH AI</div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#bacac2]">Live safety routing platform</div>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#46f1c5]">
            <span className="h-2 w-2 rounded-full bg-[#46f1c5] animate-pulse" />
            Connected
          </div>
          <div className="glass-panel flex items-center gap-3 rounded-full px-3 py-1.5">
            <div className="text-right">
              <div className="text-xs font-semibold text-white">{bootstrap.profile.name}</div>
              <div className="text-[10px] text-[#bacac2]">{bootstrap.profile.role}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#142032] text-[#46f1c5] text-lg">
              <span aria-hidden="true">👤</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-40 pt-20 md:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:items-stretch">
          <div className="glass-panel rounded-[32px] p-5 md:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#46f1c5]">API linked</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
                  {activeScreen === 'onboarding' ? 'Choose your commute profile' : 'Command center'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#bacac2]">
                  {isAccessibilityMode
                    ? 'High-contrast mode is active. Audio-first cues and larger controls are emphasized.'
                    : 'Live hazards, reports, stats, and settings are all backed by the backend API.'}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#46f1c5]">
                <span className="h-2 w-2 rounded-full bg-[#46f1c5] animate-pulse" />
                {bootstrap.profile.status}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Selected mode" value={selectedRole?.name ?? 'Not selected'} icon="🧭" />
              <MiniStat label="Hazards tracked" value={String(hazards.length)} icon="⚠️" />
              <MiniStat label="Alerts live" value={String(alerts.length)} icon="🔔" />
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#bacac2]">Selected mode</div>
                <div className="mt-1 font-headline text-xl font-semibold text-white">
                  {selectedRole?.name ?? 'Not selected'}
                </div>
                <div className="mt-2 text-sm text-[#bacac2]">
                  {selectedRole
                    ? 'This profile is persisted through the backend session.'
                    : 'Pick a commute profile to personalize routing and alerts.'}
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#46f1c5]/10 text-[#46f1c5] text-lg">
                <span aria-hidden="true">🧭</span>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-[#101c2e] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#bacac2]">Backend state</div>
                  <div className="mt-1 text-sm font-semibold text-white">{bootstrap.stats.liveCommuters} commuters online</div>
                </div>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
                  onClick={() => setActiveScreen('stats')}
                >
                  View stats
                </button>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="mb-5 rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#ffcf96]">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <section className="space-y-6">
            <div className="glass-panel rounded-[32px] p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Commuter profile</div>
                  <div className="mt-1 text-sm text-[#bacac2]">Tap a mode to connect it to the API session.</div>
                </div>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
                  onClick={() => setActiveScreen('onboarding')}
                >
                  Edit profile
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => {
                  const active = role.id === bootstrap.selectedRoleId;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={[
                        'group rounded-3xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                        role.highlight ? 'sm:col-span-2 xl:col-span-1' : '',
                        active
                          ? 'border-[#46f1c5]/60 bg-[#46f1c5]/10 shadow-[0_0_0_1px_rgba(70,241,197,0.24),0_12px_36px_rgba(70,241,197,0.12)]'
                          : 'border-white/8 bg-[#142032]/70 hover:border-white/14',
                      ].join(' ')}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20 text-lg" style={{ color: role.accent }}>
                          <span aria-hidden="true">{role.icon}</span>
                        </div>
                        {active ? <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#46f1c5]">Active</span> : null}
                      </div>
                      <div className="font-headline text-lg font-semibold text-white">{role.name}</div>
                      <p className="mt-1 text-sm text-[#bacac2]">{role.description}</p>
                      {role.highlight ? (
                        <div className="mt-4 rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffcf96]">
                          Audio alerts enabled. Large text mode ready.
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="glass-panel overflow-hidden rounded-[32px]">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Live map</div>
                    <div className="text-sm text-[#bacac2]">Hazard markers are positioned from API data.</div>
                  </div>
                  <button
                    className="rounded-full bg-[#ff6b6b] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                    onClick={() => setActiveScreen('feed')}
                  >
                    Open feed
                  </button>
                </div>

                <div className="relative min-h-[460px] overflow-hidden bg-[#030e20]">
                  <div className="absolute inset-0 bg-grid opacity-35" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(70,241,197,0.08),transparent_25%),radial-gradient(circle_at_60%_42%,rgba(245,158,11,0.08),transparent_18%)]" />
                  <div className="absolute inset-0">
                    <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#46f1c5] shadow-[0_0_24px_rgba(70,241,197,0.7)]" />
                    <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-[#46f1c5]/30" />
                    {hazards.map((hazard) => (
                      <div key={hazard.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={hazard.position}>
                        <div
                          className={[
                            'flex h-10 w-10 items-center justify-center rounded-full border shadow-lg',
                            hazard.severity === 'critical'
                              ? 'border-[#ff6b6b]/40 bg-[#ff6b6b]/10 text-[#ff6b6b]'
                              : hazard.severity === 'high'
                                ? 'border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]'
                                : hazard.severity === 'medium'
                                  ? 'border-[#ffcf96]/40 bg-[#ffcf96]/10 text-[#ffcf96]'
                                  : 'border-[#b7c6f3]/40 bg-[#b7c6f3]/10 text-[#b7c6f3]',
                          ].join(' ')}
                        >
                          <span className="text-xl" aria-hidden="true">📍</span>
                        </div>
                        <div className="mt-2 rounded-full border border-white/10 bg-[#142032]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                          {hazard.title}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-4 left-4 glass-panel rounded-2xl px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#bacac2]">Current location</div>
                    <div className="mt-1 font-semibold text-white">MG Road, Bengaluru</div>
                  </div>
                  <button
                    onClick={() => setActiveScreen('settings')}
                    className="absolute bottom-4 right-4 rounded-full bg-[#ff6b6b] px-5 py-3 text-sm font-bold text-white shadow-[0_20px_40px_rgba(255,107,107,0.2)] transition hover:brightness-110"
                  >
                    Report
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel rounded-[28px] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Stats snapshot</div>
                      <div className="text-sm text-[#bacac2]">Pulled from the backend state.</div>
                    </div>
                  </div>
                  <StatsCards stats={stats} />
                </div>

                <div className="glass-panel rounded-[28px] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Live alerts</div>
                      <div className="text-sm text-[#bacac2]">Most recent API events.</div>
                    </div>
                    <span className="rounded-full bg-[#46f1c5]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#46f1c5]">
                      {alerts.length} active
                    </span>
                  </div>
                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <AlertRow key={alert.id} alert={alert} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="glass-panel rounded-[30px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Quick report</div>
                  <div className="text-sm text-[#bacac2]">Posts into the Express API.</div>
                </div>
                <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffcf96]">
                  POST /api/reports
                </span>
              </div>

              <div className="space-y-3">
                <input
                  className="w-full rounded-2xl border border-white/8 bg-[#0a1628] px-4 py-3 text-sm text-white outline-none placeholder:text-[#85948d]"
                  value={reportDraft.title}
                  onChange={(event) => setReportDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Title"
                />
                <input
                  className="w-full rounded-2xl border border-white/8 bg-[#0a1628] px-4 py-3 text-sm text-white outline-none placeholder:text-[#85948d]"
                  value={reportDraft.category}
                  onChange={(event) => setReportDraft((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Category"
                />
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-white/8 bg-[#0a1628] px-4 py-3 text-sm text-white outline-none placeholder:text-[#85948d]"
                  value={reportDraft.summary}
                  onChange={(event) => setReportDraft((current) => ({ ...current, summary: event.target.value }))}
                  placeholder="Summary"
                />
                <input
                  className="w-full rounded-2xl border border-white/8 bg-[#0a1628] px-4 py-3 text-sm text-white outline-none placeholder:text-[#85948d]"
                  value={reportDraft.recommendation}
                  onChange={(event) => setReportDraft((current) => ({ ...current, recommendation: event.target.value }))}
                  placeholder="Recommendation"
                />
                <select
                  className="w-full rounded-2xl border border-white/8 bg-[#0a1628] px-4 py-3 text-sm text-white outline-none"
                  value={reportDraft.severity}
                  onChange={(event) =>
                    setReportDraft((current) => ({
                      ...current,
                      severity: event.target.value as Hazard['severity'],
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#46f1c5] px-4 py-3 font-headline text-sm font-bold text-[#00382b] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSubmitReport}
                  disabled={isSubmitting}
                >
                  <span aria-hidden="true">→</span>
                  {isSubmitting ? 'Sending...' : 'Send alert'}
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-[30px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Screen controls</div>
                  <div className="text-sm text-[#bacac2]">Switch between API-backed sections.</div>
                </div>
              </div>
              <div className="grid gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    className={[
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                      activeScreen === item.id
                        ? 'border-[#46f1c5]/40 bg-[#46f1c5]/10 text-white'
                        : 'border-white/8 bg-[#0d1d33] text-[#bacac2] hover:border-white/15',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base" aria-hidden="true">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-inherit">Open</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <ScreenPanel
            active={activeScreen === 'dashboard'}
            title="Dashboard"
            eyebrow="Operational map"
            description="A condensed live view of hazards, current position, and urgent actions."
            actionLabel="Focus dashboard"
            onAction={() => setActiveScreen('dashboard')}
          />
          <ScreenPanel
            active={activeScreen === 'feed'}
            title="Detection Feed"
            eyebrow="Camera and model output"
            description="The backend feed is represented as logged detections and confidence scores."
            actionLabel="Open feed"
            onAction={() => setActiveScreen('feed')}
          />
          <ScreenPanel
            active={activeScreen === 'settings'}
            title="Settings"
            eyebrow="Accessibility controls"
            description="High contrast, speech, and alert cadence are wired to API-backed preferences."
            actionLabel="Open settings"
            onAction={() => setActiveScreen('settings')}
          />
        </div>

          <section className="mt-6">
          {activeScreen === 'onboarding' ? (
            <OnboardingScreen roles={roles} selectedRoleId={bootstrap.selectedRoleId} onSelect={handleRoleSelect} />
          ) : null}
          {activeScreen === 'dashboard' ? (
            <DashboardScreen
              hazards={hazards}
              settings={settingsDraft}
              onViewMap={handleViewOnMap}
              onStartJourney={handleStartJourney}
            />
          ) : null}
          {activeScreen === 'feed' ? <FeedScreen hazards={hazards} alerts={alerts} /> : null}
          {activeScreen === 'stats' ? <StatsScreen stats={stats} alerts={alerts} /> : null}
          {activeScreen === 'settings' ? (
            <SettingsScreen settings={settingsDraft} onChange={handleSaveSettings} />
          ) : null}
        </section>
      </main>

      <BottomNav activeScreen={activeScreen} onChange={setActiveScreen} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071325] text-white">
      <div className="glass-panel rounded-[28px] px-6 py-5 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#46f1c5]/10 text-[#46f1c5]">
          <span className="text-2xl animate-pulse" aria-hidden="true">🛡️</span>
        </div>
        <div className="font-headline text-xl font-semibold">Loading ClearPath AI</div>
        <div className="mt-2 text-sm text-[#bacac2]">Connecting to the backend API...</div>
      </div>
    </div>
  );
}

function OnboardingScreen({
  roles,
  selectedRoleId,
  onSelect,
}: {
  roles: BootstrapResponse['roles'];
  selectedRoleId: RoleId | null;
  onSelect: (roleId: RoleId) => void;
}) {
  return (
    <div className="animate-rise-in rounded-[32px] border border-white/8 bg-[#0a1628]/80 p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Onboarding</div>
          <div className="text-sm text-[#bacac2]">The selected role is sent to the backend immediately.</div>
        </div>
        <div className="rounded-full bg-[#46f1c5]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#46f1c5]">
          Step 1 of 3
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className={[
              'rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5',
              role.highlight ? 'sm:col-span-2 xl:col-span-1' : '',
              selectedRoleId === role.id
                ? 'border-[#46f1c5]/60 bg-[#46f1c5]/10'
                : 'border-white/8 bg-[#142032] hover:border-white/14',
            ].join(' ')}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl" style={{ color: role.accent }} aria-hidden="true">
                {role.icon}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#bacac2]">{selectedRoleId === role.id ? 'Selected' : 'Tap'}</span>
            </div>
            <div className="font-headline text-lg font-semibold text-white">{role.name}</div>
            <p className="mt-1 text-sm text-[#bacac2]">{role.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardScreen({
  hazards,
  settings,
  onViewMap,
  onStartJourney,
}: {
  hazards: Hazard[];
  settings: SettingsState;
  onViewMap: () => void;
  onStartJourney: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <div className="glass-panel overflow-hidden rounded-[32px]">
        <div className="border-b border-white/5 px-5 py-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Operational map</div>
          <div className="text-sm text-[#bacac2]">Hazards, route guidance, and proximity alerts.</div>
        </div>
        <div className="relative min-h-[480px] overflow-hidden bg-[#030e20]">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(70,241,197,0.08),transparent_25%),radial-gradient(circle_at_65%_44%,rgba(255,169,41,0.08),transparent_15%)]" />
          {hazards.map((hazard) => (
            <div key={hazard.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={hazard.position}>
              <div
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full border shadow-lg',
                  hazard.severity === 'critical'
                    ? 'border-[#ff6b6b]/40 bg-[#ff6b6b]/10 text-[#ff6b6b]'
                    : hazard.severity === 'high'
                      ? 'border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]'
                      : hazard.severity === 'medium'
                        ? 'border-[#ffcf96]/40 bg-[#ffcf96]/10 text-[#ffcf96]'
                        : 'border-[#b7c6f3]/40 bg-[#b7c6f3]/10 text-[#b7c6f3]',
                ].join(' ')}
              >
                <span className="text-xl" aria-hidden="true">📍</span>
              </div>
              <div className="mt-2 rounded-full border border-white/10 bg-[#142032]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                {hazard.title}
              </div>
            </div>
          ))}
          <div className="absolute left-4 top-4 glass-panel rounded-2xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#bacac2]">Mode</div>
            <div className="mt-1 font-semibold text-white">{settings.audioAlerts ? 'Audio guidance enabled' : 'Silent route mode'}</div>
          </div>
          <div className="absolute bottom-4 left-4 glass-panel rounded-2xl px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#bacac2]">Current location</div>
            <div className="mt-1 font-semibold text-white">MG Road, Bengaluru</div>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
              onClick={onViewMap}
            >
              View on map
            </button>
            <button
              className="rounded-full bg-[#46f1c5] px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#00382b]"
              onClick={onStartJourney}
            >
              Start safe journey
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-panel rounded-[30px] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Active hazards</div>
              <div className="text-sm text-[#bacac2]">Priority items from the backend.</div>
            </div>
            <span className="rounded-full bg-[#ff6b6b]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff6b6b]">
              {hazards.filter((hazard) => hazard.status === 'active').length} active
            </span>
          </div>
          <div className="space-y-3">
            {hazards.slice(0, 3).map((hazard) => (
              <div key={hazard.id} className="rounded-2xl border border-white/8 bg-[#101c2e] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-headline text-lg font-semibold text-white">{hazard.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#bacac2]">
                      {hazard.distance} · {hazard.createdAt}
                    </div>
                  </div>
                  <div className="rounded-full bg-[#46f1c5]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#46f1c5]">
                    {hazard.confidence}%
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#bacac2]">{hazard.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Settings state</div>
          <div className="mt-3 grid gap-3 text-sm text-[#bacac2]">
            <StateRow label="High contrast" value={settings.highContrast ? 'On' : 'Off'} />
            <StateRow label="Audio alerts" value={settings.audioAlerts ? 'On' : 'Off'} />
            <StateRow label="Detection radius" value={`${settings.detectionRadius}m`} />
            <StateRow label="Voice volume" value={`${settings.voiceVolume}%`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedScreen({ hazards, alerts }: { hazards: Hazard[]; alerts: AlertItem[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="glass-panel rounded-[32px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Detection feed</div>
            <div className="text-sm text-[#bacac2]">Confidence-ranked detections and alerts.</div>
          </div>
          <span className="rounded-full bg-[#46f1c5]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#46f1c5]">
            Live stream
          </span>
        </div>
        <div className="space-y-3">
          {hazards.map((hazard) => (
            <div key={hazard.id} className="rounded-3xl border border-white/8 bg-[#101c2e] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-headline text-lg font-semibold text-white">{hazard.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#bacac2]">
                    {hazard.category} · {hazard.confidence}% confidence
                  </div>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#46f1c5]">
                  {hazard.status}
                </div>
              </div>
              <p className="mt-3 text-sm text-[#bacac2]">{hazard.summary}</p>
              <div className="mt-3 rounded-2xl border border-[#46f1c5]/20 bg-[#46f1c5]/8 px-3 py-2 text-sm text-[#46f1c5]">
                {hazard.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-[32px] p-5">
        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Event log</div>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsScreen({ stats, alerts }: { stats: StatsSnapshot; alerts: AlertItem[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <StatsCards stats={stats} />
        <div className="glass-panel rounded-[32px] p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Weekly reports</div>
          <div className="mt-5 flex h-44 items-end gap-3">
            {stats.weeklyReports.map((value, index) => {
              const height = `${Math.max(value * 4, 18)}px`;
              const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
              return (
                <div key={`${labels[index]}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-2xl bg-white/8" style={{ height }}>
                    <div className="h-full rounded-t-2xl bg-gradient-to-t from-[#1f2a3d] to-[#46f1c5]" />
                  </div>
                  <span className={index === 2 ? 'text-xs font-bold text-[#46f1c5]' : 'text-[10px] text-[#bacac2]'}>
                    {labels[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[32px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Community notes</div>
            <div className="text-sm text-[#bacac2]">Recent API activity and validation.</div>
          </div>
        </div>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ settings, onChange }: { settings: SettingsState; onChange: (settings: SettingsState) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <div className="glass-panel rounded-[32px] p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Accessibility</div>
          <div className="mt-4 space-y-4">
            <ToggleRow
              label="High contrast mode"
              description="Optimized for visually impaired commuters"
              checked={settings.highContrast}
              onChange={(value) => onChange({ ...settings, highContrast: value })}
            />
            <ToggleRow
              label="Audio alerts"
              description="Speak hazards aloud in real time"
              checked={settings.audioAlerts}
              onChange={(value) => onChange({ ...settings, audioAlerts: value })}
            />
            <ToggleRow
              label="Screen reader support"
              description="Enhance focus and announce key hazards"
              checked={settings.screenReader}
              onChange={(value) => onChange({ ...settings, screenReader: value })}
            />
            <ToggleRow
              label="Live broadcast"
              description="Share proximity updates with nearby users"
              checked={settings.liveBroadcast}
              onChange={(value) => onChange({ ...settings, liveBroadcast: value })}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[32px] p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">Alert preferences</div>
        <div className="mt-4 space-y-5">
          <RangeRow
            label="Interface scale"
            value={settings.interfaceScale}
            options={['S', 'M', 'L', 'XL']}
            onChange={(value) => onChange({ ...settings, interfaceScale: value as SettingsState['interfaceScale'] })}
          />
          <RangeRow
            label="Voice volume"
            value={`${settings.voiceVolume}%`}
            sliderValue={settings.voiceVolume}
            min={0}
            max={100}
            onSliderChange={(value) => onChange({ ...settings, voiceVolume: value })}
          />
          <RangeRow
            label="Detection radius"
            value={`${settings.detectionRadius}m`}
            options={['25', '50', '100', '200']}
            onChange={(value) =>
              onChange({ ...settings, detectionRadius: Number(value) as SettingsState['detectionRadius'] })
            }
          />
          <RangeRow
            label="Notification cadence"
            value={settings.cadence}
            options={['immediate', 'thirty', 'critical']}
            onChange={(value) => onChange({ ...settings, cadence: value as SettingsState['cadence'] })}
          />
        </div>
      </div>
    </div>
  );
}

function StatsCards({ stats }: { stats: StatsSnapshot }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard label="Avoided" value={stats.avoidedHazards} suffix="Hazards" />
      <MetricCard label="Safety" value={stats.saferKm} suffix="KM Safer" precision={1} />
      <MetricCard label="Reports" value={stats.reportsSent} suffix="Sent" accent="#f59e0b" />
      <MetricCard label="Accuracy" value={stats.accuracy} suffix="Avg." percent accent="#b7c6f3" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  precision,
  percent,
  accent = '#46f1c5',
}: {
  label: string;
  value: number;
  suffix: string;
  precision?: number;
  percent?: boolean;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-[#101c2e] p-4 overflow-hidden">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#bacac2]">{label}</div>
      <div className="mt-3 grid gap-1">
        <div className="font-headline text-3xl font-bold leading-none" style={{ color: accent }}>
          {precision != null ? value.toFixed(precision) : value}
          {percent ? '%' : ''}
        </div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#bacac2] whitespace-nowrap">
          {suffix}
        </div>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: AlertItem }) {
  const toneClass =
    alert.tone === 'success'
      ? 'border-[#46f1c5]/30 bg-[#46f1c5]/10 text-[#46f1c5]'
      : alert.tone === 'warning'
        ? 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#ffcf96]'
        : alert.tone === 'danger'
          ? 'border-[#ff6b6b]/30 bg-[#ff6b6b]/10 text-[#ff6b6b]'
          : 'border-white/8 bg-white/5 text-[#d7e3fc]';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{alert.title}</div>
          <div className="mt-1 text-sm text-inherit opacity-80">{alert.detail}</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">{alert.time}</div>
      </div>
    </div>
  );
}

function ScreenPanel({
  active,
  title,
  eyebrow,
  description,
  actionLabel,
  onAction,
}: {
  active: boolean;
  title: string;
  eyebrow: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={[
        'glass-panel flex h-full flex-col rounded-[28px] p-5 transition-all',
        active ? 'ring-1 ring-[#46f1c5]/35' : 'opacity-80',
      ].join(' ')}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#46f1c5]">{eyebrow}</div>
      <div className="mt-2 font-headline text-xl font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#bacac2]">{description}</p>
      <button
        className="mt-5 self-start rounded-full bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function BottomNav({ activeScreen, onChange }: { activeScreen: ScreenId; onChange: (screen: ScreenId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-white/5 bg-[#142032]/92 px-2 py-3 backdrop-blur-xl md:bottom-6 md:left-1/2 md:w-auto md:-translate-x-1/2 md:rounded-full md:border md:px-3 md:shadow-[0_18px_50px_rgba(3,14,32,0.5)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-1 md:gap-2">
        {navItems.map((item) => {
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={[
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all md:flex-row md:gap-2 md:px-4 md:py-2.5',
                active ? 'bg-[#2a3548] text-[#46f1c5] scale-[0.98]' : 'text-[#bacac2] hover:text-[#46f1c5]',
              ].join(' ')}
            >
              <span className="text-[20px] md:text-[22px]" aria-hidden="true">{item.icon}</span>
              <span className="font-headline text-[10px] uppercase tracking-[0.18em] md:text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[#101c2e] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#bacac2]">{label}</div>
          <div className="mt-1 truncate font-headline text-base font-semibold text-white">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#46f1c5]/10 text-[#46f1c5]">
          <span className="text-[20px]" aria-hidden="true">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function StateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#101c2e] px-4 py-3">
      <span className="text-sm text-[#bacac2]">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/8 bg-[#101c2e] p-4">
      <div>
        <div className="font-semibold text-white">{label}</div>
        <div className="mt-1 text-sm text-[#bacac2]">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          'relative h-7 w-14 rounded-full transition',
          checked ? 'bg-[#46f1c5]' : 'bg-white/10',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-7' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

function RangeRow({
  label,
  value,
  options,
  onChange,
  sliderValue,
  min,
  max,
  onSliderChange,
}: {
  label: string;
  value: string;
  options?: string[];
  onChange?: (value: string) => void;
  sliderValue?: number;
  min?: number;
  max?: number;
  onSliderChange?: (value: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-[#101c2e] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{label}</div>
          <div className="mt-1 text-sm text-[#bacac2]">Current value: {value}</div>
        </div>
      </div>
      {options && onChange ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
      {sliderValue != null && onSliderChange && min != null && max != null ? (
        <div className="mt-4">
          <input
            type="range"
            min={min}
            max={max}
            value={sliderValue}
            onChange={(event) => onSliderChange(Number(event.target.value))}
            className="w-full accent-[#46f1c5]"
          />
        </div>
      ) : null}
    </div>
  );
}

export default App;
