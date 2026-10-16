import { Shield, LayoutDashboard, Radar, Bell, BarChart3, Zap, Activity, AlertTriangle } from 'lucide-react';

export type ViewKey = 'dashboard' | 'threats' | 'alerts' | 'analytics' | 'simulation';

interface SidebarProps {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  alertCount: number;
  activeThreatCount: number;
}

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof Shield; description: string }[] = [
  { key: 'dashboard', label: 'Command Center', icon: LayoutDashboard, description: 'Overview & real-time status' },
  { key: 'threats', label: 'Threat Detection', icon: Radar, description: 'Live threat monitoring' },
  { key: 'alerts', label: 'Alert Management', icon: Bell, description: 'Triage and respond' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Trends & insights' },
  { key: 'simulation', label: 'Attack Simulation', icon: Zap, description: 'Simulate cyber attacks' },
];

export default function Sidebar({ activeView, onNavigate, alertCount, activeThreatCount }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/60 bg-[#0d1220] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0d1220] animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">SentinelAI</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Threat Detection</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Monitoring</p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;
          const badge = item.key === 'alerts' ? alertCount : item.key === 'threats' ? activeThreatCount : 0;

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.label}</span>
                  {badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.key === 'alerts'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">{item.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800/60 space-y-3">
        <div className="px-3 py-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-300">System Status</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Detection Engine</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">ML Model</span>
              <span className="text-cyan-400 font-medium">v2.1 Active</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Traffic Monitor</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-amber-400/80 font-medium">
              Demo environment using simulated threats
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
