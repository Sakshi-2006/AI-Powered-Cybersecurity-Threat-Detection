import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ThreatEvent, AttackSimulation, ThreatSeverity } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/types';
import {
  BarChart3, TrendingUp, Target, Zap, Activity, Award,
  AlertCircle, PieChart, BarChart2, Gauge
} from 'lucide-react';

const ATTACK_TYPE_COLORS: Record<string, string> = {
  'DoS Attack': '#ef4444',
  'Brute Force': '#f97316',
  'Port Scan': '#eab308',
  'Data Exfiltration': '#06b6d4',
  'Phishing': '#8b5cf6',
  'Malware C2': '#ec4899',
};

export default function AnalyticsView() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [simulations, setSimulations] = useState<AttackSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [threatsRes, simsRes] = await Promise.all([
      supabase.from('threat_events').select('*').order('detected_at', { ascending: false }).limit(500),
      supabase.from('attack_simulations').select('*').order('started_at', { ascending: false }).limit(20),
    ]);
    setThreats(threatsRes.data || []);
    setSimulations(simsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Attack type distribution
  const attackTypeCounts: Record<string, number> = {};
  threats.forEach((t) => {
    attackTypeCounts[t.attack_type] = (attackTypeCounts[t.attack_type] || 0) + 1;
  });
  const totalAttacks = Object.values(attackTypeCounts).reduce((a, b) => a + b, 0) || 1;
  const sortedAttackTypes = Object.entries(attackTypeCounts).sort((a, b) => b[1] - a[1]);

  // Severity distribution
  const severityCounts: Record<ThreatSeverity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  threats.forEach((t) => { severityCounts[t.severity]++; });

  // Status distribution
  const statusCounts = {
    Active: threats.filter((t) => t.status === 'Active').length,
    Investigating: threats.filter((t) => t.status === 'Investigating').length,
    Mitigated: threats.filter((t) => t.status === 'Mitigated').length,
    Resolved: threats.filter((t) => t.status === 'Resolved').length,
  };

  // Time-based trend (last 24h grouped by hour)
  const now = new Date();
  const hours: { label: string; count: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    const count = threats.filter((t) => {
      const d = new Date(t.detected_at);
      return d >= hourStart && d < hourEnd;
    }).length;
    hours.push({
      label: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }),
      count,
    });
  }
  const maxHourCount = Math.max(...hours.map((h) => h.count), 1);

  // Simulation performance
  const totalSimPackets = simulations.reduce((sum, s) => sum + s.packet_count, 0);
  const totalSimThreats = simulations.reduce((sum, s) => sum + s.threats_detected, 0);
  const totalSimFPs = simulations.reduce((sum, s) => sum + s.false_positives, 0);
  const avgDetectionRate = simulations.length > 0
    ? simulations.reduce((sum, s) => sum + (s.threats_detected / s.packet_count) * 100, 0) / simulations.length
    : 0;

  // Top source IPs
  const ipCounts: Record<string, number> = {};
  threats.forEach((t) => { ipCounts[t.source_ip] = (ipCounts[t.source_ip] || 0) + 1; });
  const topIPs = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Activity className="w-8 h-8 text-slate-700 mx-auto mb-3 animate-pulse" />
        <p className="text-sm text-slate-600">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Top summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Detection Rate', value: `${avgDetectionRate.toFixed(1)}%`, icon: Gauge, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Total Simulations', value: simulations.length, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
          { label: 'Sim Packets', value: totalSimPackets.toLocaleString(), icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'False Positives', value: totalSimFPs, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-xl bg-slate-900/60 border ${card.border} p-4`}>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Type Distribution - Horizontal Bar */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Attack Type Distribution</h3>
          </div>
          <div className="space-y-3">
            {sortedAttackTypes.length === 0 ? (
              <p className="text-sm text-slate-600 py-4 text-center">No attack data yet</p>
            ) : (
              sortedAttackTypes.map(([type, count]) => {
                const percentage = (count / totalAttacks) * 100;
                const color = ATTACK_TYPE_COLORS[type] || '#64748b';
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300 font-medium">{type}</span>
                      <span className="text-xs text-slate-500 tabular-nums">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Severity Distribution - Donut */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Severity Distribution</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {(() => {
                  const total = Object.values(severityCounts).reduce((a, b) => a + b, 0) || 1;
                  let offset = 0;
                  const colors: Record<ThreatSeverity, string> = {
                    Critical: '#ef4444',
                    High: '#f97316',
                    Medium: '#eab308',
                    Low: '#3b82f6',
                  };
                  return (Object.keys(severityCounts) as ThreatSeverity[]).map((sev) => {
                    const value = severityCounts[sev];
                    const pct = value / total;
                    const dashArray = `${2 * Math.PI * 45 * pct} ${2 * Math.PI * 45}`;
                    const circle = (
                      <circle
                        key={sev}
                        cx="60" cy="60" r="45" fill="none"
                        stroke={colors[sev]} strokeWidth="12"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += 2 * Math.PI * 45 * pct;
                    return circle;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{threats.length}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {(Object.keys(severityCounts) as ThreatSeverity[]).map((sev) => {
                const colors = SEVERITY_COLORS[sev];
                return (
                  <div key={sev} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
                      <span className="text-xs text-slate-300">{sev}</span>
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums">{severityCounts[sev]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Threat Trend - 24h */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Threat Detection Trend (24 Hours)</h3>
        </div>
        <div className="flex items-end gap-1 h-40">
          {hours.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex items-end h-full">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600/40 to-cyan-400/80 hover:from-cyan-500/60 hover:to-cyan-300 transition-all duration-200"
                  style={{ height: `${(h.count / maxHourCount) * 100}%`, minHeight: h.count > 0 ? '4px' : '0px' }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[10px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">{h.count}</span>
                </div>
              </div>
              {i % 3 === 0 && (
                <span className="text-[8px] text-slate-600 tabular-nums">{h.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Source IPs */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-white">Top Malicious Source IPs</h3>
          </div>
          <div className="space-y-2.5">
            {topIPs.length === 0 ? (
              <p className="text-sm text-slate-600 py-4 text-center">No data available</p>
            ) : (
              topIPs.map(([ip, count], i) => (
                <div key={ip} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-4">#{i + 1}</span>
                  <span className="text-sm font-mono text-slate-300 flex-1">{ip}</span>
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                      style={{ width: `${(count / topIPs[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-red-400 tabular-nums w-8 text-right">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Simulation History */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Simulation Performance</h3>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {simulations.length === 0 ? (
              <p className="text-sm text-slate-600 py-4 text-center">No simulations run yet</p>
            ) : (
              simulations.map((sim) => (
                <div key={sim.id} className="flex items-center gap-3 py-2 border-b border-slate-800/40 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 truncate">{sim.simulation_name}</div>
                    <div className="text-[10px] text-slate-600">
                      {sim.threats_detected}/{sim.packet_count} detected · {sim.false_positives} FP · {sim.intensity}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-emerald-400 tabular-nums">
                      {((sim.threats_detected / sim.packet_count) * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-600">detection</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">Threat Resolution Status</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active', value: statusCounts.Active, color: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Investigating', value: statusCounts.Investigating, color: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Mitigated', value: statusCounts.Mitigated, color: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Resolved', value: statusCounts.Resolved, color: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg ${s.bg} border ${s.border} p-4 text-center`}>
              <div className={`text-3xl font-bold ${s.text} tabular-nums`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
