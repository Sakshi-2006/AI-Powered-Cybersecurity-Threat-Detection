import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { AttackSimulation, SimulationIntensity, SimulationResult } from '@/lib/types';
import { runAttackSimulation } from '@/lib/threatEngine';
import {
  Zap, Play, Square, Activity, Target, Crosshair,
  CheckCircle2, AlertTriangle, Cpu, Gauge, Radio,
  TrendingUp, ArrowRight, Loader2
} from 'lucide-react';

const ATTACK_TYPES = [
  { type: 'DoS Attack', icon: Zap, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', description: 'Flood target with high-volume traffic to overwhelm services' },
  { type: 'Brute Force', icon: Crosshair, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', description: 'Systematic credential guessing against authentication' },
  { type: 'Port Scan', icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', description: 'Probe ports to discover open services and vulnerabilities' },
  { type: 'Data Exfiltration', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', description: 'Large outbound data transfer to external destination' },
  { type: 'Malware C2', icon: Radio, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', description: 'Simulate beaconing to command-and-control infrastructure' },
  { type: 'Phishing', icon: AlertTriangle, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', description: 'Malicious URL and credential harvesting attempt' },
] as const;

const INTENSITIES: { value: SimulationIntensity; label: string; packetMultiplier: number }[] = [
  { value: 'Low', label: 'Low', packetMultiplier: 100 },
  { value: 'Medium', label: 'Medium', packetMultiplier: 500 },
  { value: 'High', label: 'High', packetMultiplier: 1000 },
  { value: 'Extreme', label: 'Extreme', packetMultiplier: 2000 },
];

export default function SimulationView() {
  const [selectedAttack, setSelectedAttack] = useState<string>('DoS Attack');
  const [intensity, setIntensity] = useState<SimulationIntensity>('Medium');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simulations, setSimulations] = useState<AttackSimulation[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const loadSimulations = useCallback(async () => {
    const { data } = await supabase
      .from('attack_simulations')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);
    setSimulations(data || []);
  }, []);

  useEffect(() => {
    loadSimulations();
  }, [loadSimulations]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLog]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLiveLog((prev) => [...prev, `[${timestamp}] ${msg}`].slice(-50));
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setProgress(0);
    setLiveLog([]);
    setResult(null);

    const packetCount = INTENSITIES.find((i) => i.value === intensity)?.packetMultiplier || 500;

    addLog(`Initializing attack simulation...`);
    addLog(`Attack Type: ${selectedAttack}`);
    addLog(`Intensity: ${intensity} (${packetCount} packets)`);
    addLog(`Generating synthetic network traffic...`);

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 95));
    }, 200);

    // Add periodic logs during simulation
    const logInterval = setInterval(() => {
      const logs = [
        'Analyzing packet headers...',
        'Running anomaly detection model...',
        'Checking against threat signatures...',
        'Scanning for suspicious patterns...',
        'Evaluating request frequency thresholds...',
        'Cross-referencing with threat intelligence...',
        'Computing anomaly scores...',
        'Detecting abnormal traffic patterns...',
      ];
      addLog(logs[Math.floor(Math.random() * logs.length)]);
    }, 400);

    try {
      const simResult = await runAttackSimulation(selectedAttack, intensity, packetCount);
      clearInterval(progressInterval);
      clearInterval(logInterval);
      setProgress(100);
      addLog(`Simulation complete!`);
      addLog(`Threats detected: ${simResult.threatsDetected}/${packetCount}`);
      addLog(`False positives: ${simResult.falsePositives}`);
      addLog(`Detection rate: ${simResult.detectionRate.toFixed(1)}%`);
      addLog(`${simResult.events.length} threat events created`);
      setResult(simResult);
      await loadSimulations();
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(logInterval);
      addLog(`ERROR: Simulation failed - ${err}`);
    }

    setIsRunning(false);
  };

  const currentAttack = ATTACK_TYPES.find((a) => a.type === selectedAttack)!;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Attack Type Selection</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ATTACK_TYPES.map((attack) => {
                const Icon = attack.icon;
                const isActive = selectedAttack === attack.type;
                return (
                  <button
                    key={attack.type}
                    onClick={() => !isRunning && setSelectedAttack(attack.type)}
                    disabled={isRunning}
                    className={`text-left p-3.5 rounded-lg border transition-all ${
                      isActive
                        ? `${attack.bg} ${attack.border} ring-1 ring-current`
                        : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isActive ? attack.color : 'text-slate-500'}`} />
                    <div className={`text-sm font-semibold ${isActive ? attack.color : 'text-slate-300'}`}>
                      {attack.type}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1 leading-snug">{attack.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white">Intensity Configuration</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {INTENSITIES.map((int) => (
                <button
                  key={int.value}
                  onClick={() => !isRunning && setIntensity(int.value)}
                  disabled={isRunning}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    intensity === int.value
                      ? 'bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/30'
                      : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`text-sm font-bold ${intensity === int.value ? 'text-orange-400' : 'text-slate-300'}`}>
                    {int.label}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">{int.packetMultiplier} packets</div>
                </button>
              ))}
            </div>
          </div>

          {/* Run button */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Simulation Control</h3>
              </div>
              <div className="text-xs text-slate-500">
                {currentAttack.type} · {intensity} · {INTENSITIES.find((i) => i.value === intensity)?.packetMultiplier} packets
              </div>
            </div>

            {isRunning && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running simulation...
                  </span>
                  <span className="text-xs font-mono text-cyan-400 tabular-nums">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.01]'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" /> Simulation Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Launch Attack Simulation
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="rounded-xl bg-slate-900/60 border border-emerald-500/20 p-5 animate-slide-up glow-emerald">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Simulation Results</h3>
                <span className="text-[10px] text-emerald-400 font-medium ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  COMPLETED
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Packets', value: result.totalPackets.toLocaleString(), color: 'text-slate-200' },
                  { label: 'Threats Detected', value: result.threatsDetected.toLocaleString(), color: 'text-red-400' },
                  { label: 'False Positives', value: result.falsePositives, color: 'text-amber-400' },
                  { label: 'Detection Rate', value: `${result.detectionRate.toFixed(1)}%`, color: 'text-emerald-400' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-slate-800/40 p-3">
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">{stat.label}</div>
                    <div className={`text-xl font-bold ${stat.color} tabular-nums mt-1`}>{stat.value}</div>
                  </div>
                ))}
              </div>
              {result.events.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <div className="text-xs text-slate-400 mb-2">Threat Events Generated:</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {result.events.slice(0, 10).map((event) => (
                      <div key={event.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          event.severity === 'Critical' ? 'bg-red-500' :
                          event.severity === 'High' ? 'bg-orange-500' :
                          event.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-slate-300 font-medium">{event.attack_type}</span>
                        <span className="text-slate-600">from</span>
                        <span className="font-mono text-slate-400">{event.source_ip}</span>
                        <span className="text-slate-600 ml-auto">{(event.confidence * 100).toFixed(0)}% conf</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live console output */}
        <div className="space-y-5">
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Detection Console</h3>
              </div>
              {isRunning && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="p-4 h-80 overflow-y-auto bg-[#0a0e17]/60 font-mono text-[11px] space-y-1">
              {liveLog.length === 0 ? (
                <div className="text-slate-700 text-center py-8">
                  <Terminal className="w-6 h-6 mx-auto mb-2" />
                  Console output will appear here when simulation runs.
                </div>
              ) : (
                liveLog.map((line, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed animate-fade-in ${
                      line.includes('ERROR') ? 'text-red-400' :
                      line.includes('complete') || line.includes('Detection rate') ? 'text-emerald-400' :
                      line.includes('Threats detected') ? 'text-orange-400' :
                      'text-slate-400'
                    }`}
                  >
                    {line}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Recent simulations */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white">Recent Simulations</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {simulations.length === 0 ? (
                <p className="text-xs text-slate-600 py-4 text-center">No simulations yet</p>
              ) : (
                simulations.map((sim) => (
                  <div key={sim.id} className="flex items-center gap-2 py-2 border-b border-slate-800/40 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">{sim.simulation_name}</div>
                      <div className="text-[10px] text-slate-600">
                        {sim.threats_detected}/{sim.packet_count} detected
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-400 tabular-nums">
                        {((sim.threats_detected / sim.packet_count) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Terminal({ className }: { className?: string }) {
  return <span className={className}>&gt;_</span>;
}
