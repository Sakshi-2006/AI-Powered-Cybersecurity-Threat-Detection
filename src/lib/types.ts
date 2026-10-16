export type ThreatSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ThreatStatus = 'Active' | 'Mitigated' | 'Investigating' | 'Resolved';
export type AlertStatus = 'Open' | 'Acknowledged' | 'Resolved' | 'Escalated';
export type TrafficType = 'Normal' | 'DoS' | 'Brute Force' | 'Port Scan' | 'Data Exfiltration' | 'Phishing' | 'Malware C2';
export type SimulationIntensity = 'Low' | 'Medium' | 'High' | 'Extreme';
export type SimulationStatus = 'Running' | 'Completed' | 'Failed';

export interface ThreatEvent {
  id: string;
  source_ip: string;
  destination_ip: string;
  attack_type: string;
  severity: ThreatSeverity;
  confidence: number;
  protocol: string;
  port: number;
  packet_size: number;
  status: ThreatStatus;
  description: string | null;
  detected_at: string;
  mitigated_at: string | null;
  created_at: string;
}

export interface NetworkTraffic {
  id: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  port: number;
  packet_size: number;
  duration: number;
  bytes_sent: number;
  bytes_received: number;
  failed_logins: number;
  request_frequency: number;
  is_anomaly: boolean;
  anomaly_score: number;
  traffic_type: TrafficType;
  detected_at: string;
  created_at: string;
}

export interface Alert {
  id: string;
  event_id: string | null;
  title: string;
  severity: ThreatSeverity;
  status: AlertStatus;
  source_ip: string | null;
  attack_type: string | null;
  message: string;
  recommended_action: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AttackSimulation {
  id: string;
  simulation_name: string;
  attack_type: string;
  source_ip: string;
  target_ip: string;
  packet_count: number;
  duration_seconds: number;
  intensity: SimulationIntensity;
  threats_detected: number;
  false_positives: number;
  status: SimulationStatus;
  started_at: string;
  completed_at: string;
  created_at: string;
}

export interface DetectionStat {
  id: string;
  stat_key: string;
  stat_value: number;
  stat_label: string;
  stat_category: string;
  updated_at: string;
  created_at: string;
}

export interface DashboardStats {
  totalThreats: number;
  activeThreats: number;
  mitigatedThreats: number;
  criticalAlerts: number;
  totalTrafficAnalyzed: number;
  anomaliesDetected: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
  avgResponseTime: number;
  modelVersion: number;
}

export interface SimulationResult {
  totalPackets: number;
  threatsDetected: number;
  falsePositives: number;
  detectionRate: number;
  events: ThreatEvent[];
  alerts: Alert[];
}

export const ATTACK_TYPES = [
  'DoS Attack',
  'Brute Force',
  'Port Scan',
  'Data Exfiltration',
  'Phishing',
  'Malware C2',
] as const;

export const SEVERITY_ORDER: Record<ThreatSeverity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const SEVERITY_COLORS: Record<ThreatSeverity, { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  Low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500' },
};

export const STATUS_COLORS: Record<ThreatStatus, { bg: string; text: string; border: string }> = {
  Active: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  Investigating: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Mitigated: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Resolved: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export const ALERT_STATUS_COLORS: Record<AlertStatus, { bg: string; text: string; border: string }> = {
  Open: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  Acknowledged: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Escalated: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Resolved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};
