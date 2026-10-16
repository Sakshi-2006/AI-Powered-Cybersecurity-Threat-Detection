import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ThreatEvent, ThreatSeverity, ThreatStatus } from '@/lib/types';
import { SEVERITY_COLORS, STATUS_COLORS, SEVERITY_ORDER } from '@/lib/types';
import { mitigateThreat, resolveThreat } from '@/lib/threatEngine';
import {
  Shield, ShieldCheck, Crosshair, Zap, Activity, Filter, ChevronDown,
  ShieldAlert, CheckCircle2, Clock, Search
} from 'lucide-react';

export default function ThreatDetectionView() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<ThreatSeverity | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<ThreatStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);

  const loadThreats = useCallback(async () => {
    let query = supabase.from('threat_events').select('*').order('detected_at', { ascending: false }).limit(100);
    if (filterSeverity !== 'All') query = query.eq('severity', filterSeverity);
    if (filterStatus !== 'All') query = query.eq('status', filterStatus);
    const { data } = await query;
    setThreats(data || []);
    setLoading(false);
  }, [filterSeverity, filterStatus]);

  useEffect(() => {
    loadThreats();
    const interval = setInterval(loadThreats, 5000);
    return () => clearInterval(interval);
  }, [loadThreats]);

  const filteredThreats = threats.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.source_ip.toLowerCase().includes(q) ||
      t.attack_type.toLowerCase().includes(q) ||
      t.destination_ip.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  });

  const counts = {
    total: threats.length,
    critical: threats.filter((t) => t.severity === 'Critical').length,
    high: threats.filter((t) => t.severity === 'High').length,
    active: threats.filter((t) => t.status === 'Active').length,
    mitigated: threats.filter((t) => t.status === 'Mitigated' || t.status === 'Resolved').length,
  };

  const handleMitigate = async (id: string) => {
    await mitigateThreat(id);
    await loadThreats();
  };

  const handleResolve = async (id: string) => {
    await resolveThreat(id);
    await loadThreats();
  };

  const sortedFiltered = [...filteredThreats].sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Threats', value: counts.total, icon: Crosshair, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-700/30' },
          { label: 'Critical', value: counts.critical, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'High Priority', value: counts.high, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'Active', value: counts.active, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Mitigated', value: counts.mitigated, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by IP, attack type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-slate-800/40 border border-slate-700/40 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-600" />
          <div className="flex gap-1.5">
            {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterSeverity === sev
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:bg-slate-800/60'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ThreatStatus | 'All')}
            className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Investigating">Investigating</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Threat table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60 text-left">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attack Type</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Source IP</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Destination</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Confidence</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Detected</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <Activity className="w-4 h-4 animate-pulse" />
                      Loading threat data...
                    </div>
                  </td>
                </tr>
              ) : sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-600">
                    No threats match the current filters.
                  </td>
                </tr>
              ) : (
                sortedFiltered.map((threat) => {
                  const sevColors = SEVERITY_COLORS[threat.severity];
                  const statusColors = STATUS_COLORS[threat.status];
                  return (
                    <tr
                      key={threat.id}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedThreat(threat)}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded ${sevColors.bg} ${sevColors.text} border ${sevColors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sevColors.dot}`} />
                          {threat.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-200">{threat.attack_type}</div>
                        <div className="text-[10px] text-slate-600">{threat.protocol}:{threat.port}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">{threat.source_ip}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-400">{threat.destination_ip}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${threat.confidence > 0.9 ? 'bg-red-500' : threat.confidence > 0.75 ? 'bg-orange-500' : 'bg-amber-500'}`}
                              style={{ width: `${threat.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-400 tabular-nums">{(threat.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-1 rounded ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                          {threat.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(threat.detected_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {threat.status === 'Active' && (
                            <button
                              onClick={() => handleMitigate(threat.id)}
                              className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                            >
                              <Shield className="w-3 h-3" /> Mitigate
                            </button>
                          )}
                          {(threat.status === 'Active' || threat.status === 'Mitigated' || threat.status === 'Investigating') && (
                            <button
                              onClick={() => handleResolve(threat.id)}
                              className="px-2 py-1 rounded-md bg-slate-700/40 text-slate-400 border border-slate-600/30 text-[10px] font-medium hover:bg-slate-700/60 transition-all flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" /> Resolve
                            </button>
                          )}
                          {threat.status === 'Resolved' && (
                            <span className="text-[10px] text-slate-600">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threat detail modal */}
      {selectedThreat && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedThreat(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/60 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${SEVERITY_COLORS[selectedThreat.severity].bg} flex items-center justify-center`}>
                  <ShieldAlert className={`w-5 h-5 ${SEVERITY_COLORS[selectedThreat.severity].text}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedThreat.attack_type}</h3>
                  <p className="text-xs text-slate-500">Threat ID: {selectedThreat.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                className="text-slate-500 hover:text-slate-300 text-lg"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Severity</div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded ${SEVERITY_COLORS[selectedThreat.severity].bg} ${SEVERITY_COLORS[selectedThreat.severity].text} border ${SEVERITY_COLORS[selectedThreat.severity].border}`}>
                      {selectedThreat.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Confidence Score</div>
                    <div className="text-lg font-bold text-white">{(selectedThreat.confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Source IP</div>
                    <div className="text-sm font-mono text-slate-300">{selectedThreat.source_ip}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Destination IP</div>
                    <div className="text-sm font-mono text-slate-300">{selectedThreat.destination_ip}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Protocol / Port</div>
                    <div className="text-sm font-mono text-slate-300">{selectedThreat.protocol} / {selectedThreat.port}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Packet Size</div>
                    <div className="text-sm text-slate-300">{selectedThreat.packet_size} bytes</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Status</div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_COLORS[selectedThreat.status].bg} ${STATUS_COLORS[selectedThreat.status].text} border ${STATUS_COLORS[selectedThreat.status].border}`}>
                      {selectedThreat.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Detected At</div>
                    <div className="text-sm text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(selectedThreat.detected_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Description</div>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedThreat.description}</p>
              </div>

              {selectedThreat.status === 'Active' && (
                <div className="flex gap-2 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => { handleMitigate(selectedThreat.id); setSelectedThreat(null); }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-sm font-medium hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Mitigate Threat
                  </button>
                  <button
                    onClick={() => { handleResolve(selectedThreat.id); setSelectedThreat(null); }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/40 text-sm font-medium hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> Mark Resolved
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
