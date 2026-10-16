import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Alert, AlertStatus, ThreatSeverity } from '@/lib/types';
import { SEVERITY_COLORS, ALERT_STATUS_COLORS } from '@/lib/types';
import { acknowledgeAlert, resolveAlert, escalateAlert } from '@/lib/threatEngine';
import {
  Bell, BellOff, AlertTriangle, CheckCircle2, ArrowUpCircle,
  Eye, Clock, Filter, Search
} from 'lucide-react';

export default function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'All'>('All');
  const [filterSeverity, setFilterSeverity] = useState<ThreatSeverity | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const loadAlerts = useCallback(async () => {
    let query = supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(100);
    if (filterStatus !== 'All') query = query.eq('status', filterStatus);
    if (filterSeverity !== 'All') query = query.eq('severity', filterSeverity);
    const { data } = await query;
    setAlerts(data || []);
    setLoading(false);
  }, [filterStatus, filterSeverity]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.title.toLowerCase().includes(q) || (a.source_ip || '').toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
  });

  const counts = {
    open: alerts.filter((a) => a.status === 'Open').length,
    acknowledged: alerts.filter((a) => a.status === 'Acknowledged').length,
    escalated: alerts.filter((a) => a.status === 'Escalated').length,
    resolved: alerts.filter((a) => a.status === 'Resolved').length,
    critical: alerts.filter((a) => a.severity === 'Critical' && a.status !== 'Resolved').length,
  };

  const handleAction = async (action: 'acknowledge' | 'resolve' | 'escalate', id: string) => {
    if (action === 'acknowledge') await acknowledgeAlert(id);
    if (action === 'resolve') await resolveAlert(id);
    if (action === 'escalate') await escalateAlert(id);
    await loadAlerts();
    setSelectedAlert(null);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Open', value: counts.open, icon: Bell, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'Acknowledged', value: counts.acknowledged, icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Escalated', value: counts.escalated, icon: ArrowUpCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
          { label: 'Resolved', value: counts.resolved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Critical Open', value: counts.critical, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
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
            placeholder="Search alerts..."
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
            onChange={(e) => setFilterStatus(e.target.value as AlertStatus | 'All')}
            className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 px-5 py-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Bell className="w-4 h-4 animate-pulse" />
              Loading alerts...
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 px-5 py-12 text-center">
            <BellOff className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No alerts match the current filters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const sevColors = SEVERITY_COLORS[alert.severity];
            const statusColors = ALERT_STATUS_COLORS[alert.status];
            return (
              <div
                key={alert.id}
                className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-4 hover:border-slate-700/60 transition-all cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${sevColors.bg} flex items-center justify-center shrink-0`}>
                    <AlertTriangle className={`w-5 h-5 ${sevColors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sevColors.bg} ${sevColors.text} border ${sevColors.border}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                        {alert.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">{alert.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-600">
                      {alert.source_ip && <span className="font-mono">IP: {alert.source_ip}</span>}
                      {alert.attack_type && <span>Type: {alert.attack_type}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {alert.status === 'Open' && (
                      <>
                        <button
                          onClick={() => handleAction('acknowledge', alert.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Acknowledge
                        </button>
                        <button
                          onClick={() => handleAction('escalate', alert.id)}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-medium hover:bg-orange-500/20 transition-all flex items-center gap-1"
                        >
                          <ArrowUpCircle className="w-3 h-3" /> Escalate
                        </button>
                      </>
                    )}
                    {alert.status !== 'Resolved' && (
                      <button
                        onClick={() => handleAction('resolve', alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert detail modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/60 rounded-xl max-w-lg w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${SEVERITY_COLORS[selectedAlert.severity].bg} flex items-center justify-center`}>
                  <AlertTriangle className={`w-5 h-5 ${SEVERITY_COLORS[selectedAlert.severity].text}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedAlert.title}</h3>
                  <p className="text-xs text-slate-500">Alert ID: {selectedAlert.id.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-500 hover:text-slate-300 text-lg">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Severity</div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${SEVERITY_COLORS[selectedAlert.severity].bg} ${SEVERITY_COLORS[selectedAlert.severity].text} border ${SEVERITY_COLORS[selectedAlert.severity].border}`}>
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Status</div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${ALERT_STATUS_COLORS[selectedAlert.status].bg} ${ALERT_STATUS_COLORS[selectedAlert.status].text} border ${ALERT_STATUS_COLORS[selectedAlert.status].border}`}>
                    {selectedAlert.status}
                  </span>
                </div>
                {selectedAlert.source_ip && (
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Source IP</div>
                    <div className="font-mono text-slate-300">{selectedAlert.source_ip}</div>
                  </div>
                )}
                {selectedAlert.attack_type && (
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Attack Type</div>
                    <div className="text-slate-300">{selectedAlert.attack_type}</div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Message</div>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.message}</p>
              </div>

              {selectedAlert.recommended_action && (
                <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-3">
                  <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1 font-semibold">Recommended Action</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.recommended_action}</p>
                </div>
              )}

              {selectedAlert.acknowledged_by && (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  Acknowledged by {selectedAlert.acknowledged_by}
                  {selectedAlert.acknowledged_at && ` at ${new Date(selectedAlert.acknowledged_at).toLocaleString()}`}
                </div>
              )}

              {selectedAlert.status !== 'Resolved' && (
                <div className="flex gap-2 pt-3 border-t border-slate-800/60">
                  {selectedAlert.status === 'Open' && (
                    <>
                      <button
                        onClick={() => handleAction('acknowledge', selectedAlert.id)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-sm font-medium hover:bg-amber-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" /> Acknowledge
                      </button>
                      <button
                        onClick={() => handleAction('escalate', selectedAlert.id)}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 text-sm font-medium hover:bg-orange-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowUpCircle className="w-4 h-4" /> Escalate
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleAction('resolve', selectedAlert.id)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-sm font-medium hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Resolve
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
