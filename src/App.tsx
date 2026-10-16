import { useEffect, useState, useCallback } from 'react';
import Sidebar, { type ViewKey } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import DashboardView from '@/views/DashboardView';
import ThreatDetectionView from '@/views/ThreatDetectionView';
import AlertsView from '@/views/AlertsView';
import AnalyticsView from '@/views/AnalyticsView';
import SimulationView from '@/views/SimulationView';
import { supabase } from '@/lib/supabase';

const VIEW_META: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Command Center', subtitle: 'Real-time security overview and threat monitoring' },
  threats: { title: 'Threat Detection', subtitle: 'Live network threat detection and response' },
  alerts: { title: 'Alert Management', subtitle: 'Triage, acknowledge, and resolve security alerts' },
  analytics: { title: 'Security Analytics', subtitle: 'Threat trends, attack distributions, and performance metrics' },
  simulation: { title: 'Attack Simulation', subtitle: 'Simulate cyber attacks and test detection capabilities' },
};

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [alertCount, setAlertCount] = useState(0);
  const [activeThreatCount, setActiveThreatCount] = useState(0);

  const loadCounts = useCallback(async () => {
    const [alertsRes, threatsRes] = await Promise.all([
      supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
      supabase.from('threat_events').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    ]);
    setAlertCount(alertsRes.count || 0);
    setActiveThreatCount(threatsRes.count || 0);
  }, []);

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 5000);
    return () => clearInterval(interval);
  }, [loadCounts]);

  const meta = VIEW_META[activeView];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-200 flex">
      <div className="grid-pattern fixed inset-0 opacity-30 pointer-events-none" />
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        alertCount={alertCount}
        activeThreatCount={activeThreatCount}
      />
      <main className="flex-1 relative">
        <TopBar title={meta.title} subtitle={meta.subtitle} />
        <div className="min-h-[calc(100vh-65px)]">
          {activeView === 'dashboard' && <DashboardView onNavigate={setActiveView} />}
          {activeView === 'threats' && <ThreatDetectionView />}
          {activeView === 'alerts' && <AlertsView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'simulation' && <SimulationView />}
        </div>
      </main>
    </div>
  );
}

export default App;
