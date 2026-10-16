import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ThreatEvent, Alert, DetectionStat, DashboardStats } from '@/lib/types';
import { SEVERITY_COLORS, SEVERITY_ORDER } from '@/lib/types';
import { generateLiveThreat } from '@/lib/threatEngine';
import {
  ShieldAlert, Activity, Zap, TrendingUp, TrendingDown,
  ChevronRight, Crosshair, Lock, Cpu, Radar, AlertTriangle, CheckCircle2
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: 'dashboard' | 'threats' | 'alerts' | 'analytics' | 'simulation') => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatEvent[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [threatFeed, setThreatFeed] = useState<ThreatEvent[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const loadDashboard = useCallback(async () => {
    const [statsRes, threatsRes, alertsRes] = await Promise.all([
      supabase.from('detection_stats').select('*'),
      supabase.from('threat_events').select('*').order('detected_at', { ascending: false }).limit(8),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const statsMap: Record<string, number> = {};
    (statsRes.data || []).forEach((s: DetectionStat) => {
      statsMap[s.stat_key] = s.stat_value;
    });

    setStats({
      totalThreats: statsMap['total_threats'] || 0,
      activeThreats: statsMap['active_threats'] || 0,
      mitigatedThreats: statsMap['mitigated_threats'] || 0,
      criticalAlerts: statsMap['critical_alerts'] || 0,
      totalTrafficAnalyzed: statsMap['total_traffic_analyzed'] || 0,
      anomaliesDetected: statsMap['anomalies_detected'] || 0,
      detectionAccuracy: statsMap['detection_accuracy'] || 96.8,
      falsePositiveRate: statsMap['false_positive_rate'] || 3.2,
      avgResponseTime: statsMap['avg_response_time'] || 142,
      modelVersion: statsMap['model_version'] || 1,
    });

    setRecentThreats(threatsRes.data || []);
    setRecentAlerts(alertsRes.data || []);
    setThreatFeed((threatsRes.data || []).slice(0, 6));
  }, []);

  useEffect(() => {
    loadDashboard();

    const threatInterval = setInterval(async () => {
      await generateLiveThreat();
      await loadDashboard();
    }, 15000);

    const refreshInterval = setInterval(loadDashboard, 5000);

    return () => {
      clearInterval(threatInterval);
      clearInterval(refreshInterval);
    };
  }, [loadDashboard]);

  // Animated scanning effect
  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanning(true);
      setScanProgress(0);
      const progressInterval = setInterval(() => {
        setScanProgress((p) => {
          if (p >= 100) {
            clearInterval(progressInterval);
            setScanning(false);
            return 100;
          }
          return p + 5;
        });
      }, 50);
    }, 8000);
    return () => clearInterval(scanInterval);
  }, []);

  const metricCards = [
    {
      label: 'Active Threats',
      value: stats?.activeThreats ?? 0,
      icon: ShieldAlert,
      color: 'red',
      trend: (stats?.activeThreats ?? 0) > 3 ? 'up' : 'down',
      change: '+12%',
      glowClass: 'glow-red',
    },
    {
      label: 'Total Threats Detected',
      value: stats?.totalThreats ?? 0,
      icon: Crosshair,
      color: 'orange',
      trend: 'up',
      change: '+8%',
      glowClass: 'glow-orange',
    },
    {
      label: 'Threats Mitigated',
      value: stats?.mitigatedThreats ?? 0,
      icon: CheckCircle2,
      color: 'emerald',
      trend: 'up',
      change: '+15%',
      glowClass: 'glow-emerald',
    },
    {
      label: 'Packets Analyzed',
      value: stats?.totalTrafficAnalyzed ?? 0,
      icon: Activity,
      color: 'cyan',
      trend: 'up',
      change: '+24%',
      glowClass: 'glow-blue',
    },
  ];

  const colorClasses: Record<string, { icon: string; border: string; text: string; bg: string }> = {
    red: { icon: 'text-red-400', border: 'border-red-500/20', text: 'text-red-400', bg: 'bg-red-500/10' },
    orange: { icon: 'text-orange-400', border: 'border-orange-500/20', text: 'text-orange-400', bg: 'bg-orange-500/10' },
    emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    cyan: { icon: 'text-cyan-400', border: 'border-cyan-500/20', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  };

  const sortedThreats = [...recentThreats].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Hero metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const colors = colorClasses[card.color];
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-xl bg-slate-900/60 border ${colors.border} p-5 ${card.glowClass} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-semibold ${card.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
                {card.value.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Radar / Live Feed */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Live Threat Feed</h3>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                REAL-TIME
              </span>
            </div>
            <button
              onClick={() => onNavigate('threats')}
              className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Scanning animation bar */}
          {scanning && (
            <div className="h-0.5 bg-slate-800 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          )}

          <div className="divide-y divide-slate-800/40">
            {sortedThreats.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Radar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Monitoring network traffic...</p>
              </div>
            ) : (
              sortedThreats.slice(0, 6).map((threat) => {
                const colors = SEVERITY_COLORS[threat.severity];
                return (
                  <div
                    key={threat.id}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-800/30 transition-colors animate-slide-up"
                  >
                    <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse-slow shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {threat.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-slate-200 truncate">{threat.attack_type}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{threat.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-slate-400">{threat.source_ip}</div>
                      <div className="text-[10px] text-slate-600">
                        {new Date(threat.detected_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div className="text-[10px] text-slate-600 mb-0.5">CONF</div>
                      <div className={`text-sm font-bold ${colors.text} tabular-nums`}>
                        {(threat.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Model Performance Card */}
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">ML Model Performance</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Detection Accuracy</span>
                  <span className="text-sm font-bold text-emerald-400">{stats?.detectionAccuracy}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.detectionAccuracy}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">False Positive Rate</span>
                  <span className="text-sm font-bold text-amber-400">{stats?.falsePositiveRate}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${(stats?.falsePositiveRate ?? 0) * 5}%` }}
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">Response Time</div>
                  <div className="text-lg font-bold text-white tabular-nums">{stats?.avgResponseTime}ms</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">Model Version</div>
                  <div className="text-lg font-bold text-cyan-400">v{stats?.modelVersion}.1</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats card */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white">Anomaly Detection</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Anomalies Detected</span>
                <span className="text-sm font-bold text-orange-400 tabular-nums">{stats?.anomaliesDetected.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Critical Alerts</span>
                <span className="text-sm font-bold text-red-400 tabular-nums">{stats?.criticalAlerts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Packets/sec</span>
                <span className="text-sm font-bold text-cyan-400 tabular-nums">
                  {Math.floor((stats?.totalTrafficAnalyzed || 0) / 60).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent alerts + Attack type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Recent Security Alerts</h3>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              Manage Alerts <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-800/40">
            {recentAlerts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-600">No active alerts</div>
            ) : (
              recentAlerts.map((alert) => {
                const colors = SEVERITY_COLORS[alert.severity];
                return (
                  <div key={alert.id} className="px-5 py-3.5 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-200">{alert.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-auto ${
                        alert.status === 'Open' ? 'bg-red-500/10 text-red-400' :
                        alert.status === 'Acknowledged' ? 'bg-amber-500/10 text-amber-400' :
                        alert.status === 'Escalated' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 ml-1">{alert.message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security Posture */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Security Posture</h3>
          </div>
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(30,41,59)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#postureGradient)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50 * 0.85} ${2 * Math.PI * 50}`}
                />
                <defs>
                  <linearGradient id="postureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(16,185,129)" />
                    <stop offset="100%" stopColor="rgb(6,182,212)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">85</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
              </div>
            </div>
            <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              STRONG
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Firewall Rules</span>
              <span className="text-emerald-400 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">IDS/IPS</span>
              <span className="text-emerald-400 font-medium">Monitoring</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ML Detection</span>
              <span className="text-cyan-400 font-medium">v2.1 Running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Threat Intel Feed</span>
              <span className="text-emerald-400 font-medium">Synced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
