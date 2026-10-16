import { supabase } from './supabase';
import type { ThreatEvent, Alert, NetworkTraffic, AttackSimulation, ThreatSeverity, TrafficType, SimulationIntensity, SimulationResult } from './types';

const RANDOM_IPS = [
  '45.227.89.12', '198.51.100.23', '203.0.113.50', '172.16.0.50',
  '45.33.32.156', '91.213.50.12', '185.220.101.45', '104.244.74.211',
  '192.168.1.105', '10.0.0.45', '172.16.0.88', '45.155.205.99',
];

const TARGET_IPS = ['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4', '10.0.0.5'];

const ATTACK_DESCRIPTIONS: Record<string, string[]> = {
  'DoS Attack': [
    'SYN flood detected — high packet rate overwhelming web server',
    'UDP flood targeting DNS service — abnormal packet volume',
    'HTTP flood — rapid repeated requests to application endpoints',
  ],
  'Brute Force': [
    'Multiple failed SSH login attempts — credential stuffing pattern detected',
    'RDP brute force attack — 50+ failed authentication attempts in 60 seconds',
    'FTP credential brute force — systematic password guessing detected',
  ],
  'Port Scan': [
    'Sequential port scanning detected across range 1-1024',
    'Stealth SYN scan — half-open connections probing multiple ports',
    'FIN scan detected — unusual FIN packets probing firewall rules',
  ],
  'Data Exfiltration': [
    'Large outbound data transfer to unknown external IP address',
    'Suspicious DNS tunneling — high-volume DNS queries to unusual domains',
    'Encrypted data upload to unauthorized cloud storage endpoint',
  ],
  'Phishing': [
    'Phishing URL detected in email traffic — known malicious domain',
    'Credential harvesting form detected — fake login page mimicking internal portal',
    'Suspicious email attachment — macro-enabled document with C2 callback URL',
  ],
  'Malware C2': [
    'Beaconing behavior detected — periodic connections to suspected C2 server',
    'Malware command-and-control traffic — known malware signature matched',
    'Suspicious outbound HTTPS to blacklisted IP — potential C2 communication',
  ],
};

const RECOMMENDED_ACTIONS: Record<ThreatSeverity, string> = {
  Critical: 'Isolate source IP immediately. Initiate incident response protocol. Notify security team lead.',
  High: 'Block source IP at firewall. Monitor for recurrence. Escalate to Tier 2 SOC analyst.',
  Medium: 'Investigate traffic pattern. Apply rate limiting. Monitor source IP for 24 hours.',
  Low: 'Log event for correlation. Apply firewall rules if pattern persists. Update threat intelligence feed.',
};

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIP(): string {
  return randomChoice(RANDOM_IPS);
}

function randomTarget(): string {
  return randomChoice(TARGET_IPS);
}

function confidenceForSeverity(severity: ThreatSeverity): number {
  const ranges: Record<ThreatSeverity, [number, number]> = {
    Critical: [0.92, 0.99],
    High: [0.82, 0.95],
    Medium: [0.68, 0.88],
    Low: [0.55, 0.78],
  };
  const [min, max] = ranges[severity];
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function severityForAttackType(attackType: string): ThreatSeverity {
  const severityMap: Record<string, ThreatSeverity[]> = {
    'DoS Attack': ['High', 'Critical', 'Medium'],
    'Brute Force': ['Critical', 'High', 'Medium'],
    'Port Scan': ['Medium', 'Low', 'High'],
    'Data Exfiltration': ['Critical', 'High'],
    'Phishing': ['Low', 'Medium'],
    'Malware C2': ['High', 'Critical'],
  };
  return randomChoice(severityMap[attackType] || ['Medium']);
}

function generateTrafficForAttack(attackType: string, intensity: SimulationIntensity): {
  packetSize: number;
  requestFrequency: number;
  failedLogins: number;
  bytesSent: number;
  port: number;
  protocol: string;
} {
  const intensityMultiplier: Record<SimulationIntensity, number> = { Low: 0.5, Medium: 1, High: 2, Extreme: 4 };
  const mult = intensityMultiplier[intensity];

  switch (attackType) {
    case 'DoS Attack':
      return {
        packetSize: Math.floor(64 + Math.random() * 1480 * mult),
        requestFrequency: Math.floor(500 * mult + Math.random() * 1000 * mult),
        failedLogins: 0,
        bytesSent: Math.floor(10000 * mult + Math.random() * 50000 * mult),
        port: 80,
        protocol: 'TCP',
      };
    case 'Brute Force':
      return {
        packetSize: Math.floor(128 + Math.random() * 256),
        requestFrequency: Math.floor(30 * mult + Math.random() * 50 * mult),
        failedLogins: Math.floor(10 * mult + Math.random() * 40 * mult),
        bytesSent: Math.floor(5000 + Math.random() * 15000),
        port: 22,
        protocol: 'TCP',
      };
    case 'Port Scan':
      return {
        packetSize: Math.floor(40 + Math.random() * 64),
        requestFrequency: Math.floor(100 * mult + Math.random() * 200 * mult),
        failedLogins: 0,
        bytesSent: Math.floor(2000 + Math.random() * 5000),
        port: Math.floor(Math.random() * 1024) + 1,
        protocol: 'TCP',
      };
    case 'Data Exfiltration':
      return {
        packetSize: Math.floor(4096 + Math.random() * 8192),
        requestFrequency: Math.floor(50 + Math.random() * 100),
        failedLogins: 0,
        bytesSent: Math.floor(100000 * mult + Math.random() * 500000 * mult),
        port: 443,
        protocol: 'TCP',
      };
    case 'Phishing':
      return {
        packetSize: Math.floor(512 + Math.random() * 2048),
        requestFrequency: Math.floor(5 + Math.random() * 20),
        failedLogins: Math.floor(Math.random() * 5),
        bytesSent: Math.floor(10000 + Math.random() * 50000),
        port: 80,
        protocol: 'HTTP',
      };
    case 'Malware C2':
      return {
        packetSize: Math.floor(256 + Math.random() * 512),
        requestFrequency: Math.floor(10 + Math.random() * 30),
        failedLogins: 0,
        bytesSent: Math.floor(2000 + Math.random() * 8000),
        port: 8080,
        protocol: 'TCP',
      };
    default:
      return { packetSize: 512, requestFrequency: 50, failedLogins: 0, bytesSent: 5000, port: 80, protocol: 'TCP' };
  }
}

function detectAnomaly(
  packetSize: number,
  requestFrequency: number,
  failedLogins: number,
  bytesSent: number,
  attackType: string,
): { isAnomaly: boolean; anomalyScore: number; detectedAttackType: TrafficType; severity: ThreatSeverity } {
  let score = 0;
  let detectedType: TrafficType = 'Normal';
  let severity: ThreatSeverity = 'Low';

  if (requestFrequency > 400) {
    score += 0.35;
    detectedType = 'DoS';
    severity = requestFrequency > 1000 ? 'Critical' : 'High';
  }

  if (failedLogins > 5) {
    score += 0.30;
    detectedType = 'Brute Force';
    severity = failedLogins > 30 ? 'Critical' : 'High';
  }

  if (bytesSent > 80000) {
    score += 0.30;
    if (detectedType === 'Normal') {
      detectedType = 'Data Exfiltration';
      severity = bytesSent > 300000 ? 'Critical' : 'High';
    }
  }

  if (packetSize < 100 && requestFrequency > 80) {
    score += 0.20;
    if (detectedType === 'Normal') {
      detectedType = 'Port Scan';
      severity = 'Medium';
    }
  }

  if (packetSize > 4000 && bytesSent > 50000) {
    score += 0.15;
    if (detectedType === 'Normal') {
      detectedType = 'Data Exfiltration';
      severity = 'High';
    }
  }

  score = Math.min(score, 0.99);

  if (attackType !== 'Normal') {
    detectedType = attackType as TrafficType;
    severity = severityForAttackType(attackType);
    score = Math.max(score, confidenceForSeverity(severity));
  }

  const isAnomaly = score > 0.5;

  return { isAnomaly, anomalyScore: score, detectedAttackType: detectedType, severity };
}

export async function runAttackSimulation(
  attackType: string,
  intensity: SimulationIntensity,
  packetCount: number,
  onComplete?: (result: SimulationResult) => void,
): Promise<SimulationResult> {
  const sourceIP = randomIP();
  const targetIP = randomTarget();
  const startTime = new Date();

  const trafficRecords: Omit<NetworkTraffic, 'id' | 'created_at'>[] = [];
  const threatEvents: Omit<ThreatEvent, 'id' | 'created_at'>[] = [];
  const alerts: Omit<Alert, 'id' | 'created_at'>[] = [];

  let threatsDetected = 0;
  let falsePositives = 0;

  const batchSize = Math.min(packetCount, 200);
  const isActualAttack = attackType !== 'Normal Traffic';

  for (let i = 0; i < packetCount; i++) {
    const params = generateTrafficForAttack(isActualAttack ? attackType : 'Normal', intensity);

    if (!isActualAttack) {
      const normalFreq = Math.floor(10 + Math.random() * 80);
      const normalSize = Math.floor(200 + Math.random() * 1200);
      const normalBytes = Math.floor(2000 + Math.random() * 20000);
      params.requestFrequency = normalFreq;
      params.packetSize = normalSize;
      params.bytesSent = normalBytes;
      params.failedLogins = Math.random() > 0.95 ? Math.floor(Math.random() * 3) : 0;
    }

    const detection = detectAnomaly(
      params.packetSize,
      params.requestFrequency,
      params.failedLogins,
      params.bytesSent,
      isActualAttack ? attackType : 'Normal',
    );

    const detectedAt = new Date(startTime.getTime() + (i / packetCount) * (packetCount > 100 ? 60000 : 30000));

    trafficRecords.push({
      source_ip: isActualAttack ? sourceIP : randomIP(),
      destination_ip: targetIP,
      protocol: params.protocol,
      port: params.port,
      packet_size: params.packetSize,
      duration: Math.random() * 5,
      bytes_sent: params.bytesSent,
      bytes_received: Math.floor(Math.random() * 5000),
      failed_logins: params.failedLogins,
      request_frequency: params.requestFrequency,
      is_anomaly: detection.isAnomaly,
      anomaly_score: detection.anomalyScore,
      traffic_type: detection.detectedAttackType,
      detected_at: detectedAt.toISOString(),
    });

    if (detection.isAnomaly) {
      if (isActualAttack) {
        threatsDetected++;
      } else {
        falsePositives++;
      }

      if (threatEvents.length < 50 && (i % Math.max(1, Math.floor(packetCount / 20)) === 0)) {
        const descriptions = ATTACK_DESCRIPTIONS[attackType] || ATTACK_DESCRIPTIONS['DoS Attack'];
        const description = randomChoice(descriptions);

        const event: Omit<ThreatEvent, 'id' | 'created_at'> = {
          source_ip: sourceIP,
          destination_ip: targetIP,
          attack_type: detection.detectedAttackType,
          severity: detection.severity,
          confidence: detection.anomalyScore,
          protocol: params.protocol,
          port: params.port,
          packet_size: params.packetSize,
          status: 'Active',
          description,
          detected_at: detectedAt.toISOString(),
          mitigated_at: null,
        };
        threatEvents.push(event);

        alerts.push({
          event_id: null,
          title: `${detection.detectedAttackType} — ${sourceIP}`,
          severity: detection.severity,
          status: 'Open',
          source_ip: sourceIP,
          attack_type: detection.detectedAttackType,
          message: description,
          recommended_action: RECOMMENDED_ACTIONS[detection.severity],
          acknowledged_by: null,
          acknowledged_at: null,
          resolved_at: null,
        });
      }
    }
  }

  const completedAt = new Date();
  const detectionRate = packetCount > 0 ? (threatsDetected / packetCount) * 100 : 0;

  // Insert traffic in batches
  for (let i = 0; i < trafficRecords.length; i += batchSize) {
    const batch = trafficRecords.slice(i, i + batchSize);
    await supabase.from('network_traffic').insert(batch);
  }

  // Insert threat events
  let createdEvents: ThreatEvent[] = [];
  if (threatEvents.length > 0) {
    const { data: insertedEvents } = await supabase
      .from('threat_events')
      .insert(threatEvents)
      .select();
    createdEvents = insertedEvents || [];

    // Link alerts to events and insert
    const alertsWithEventIds = alerts.map((alert, idx) => ({
      ...alert,
      event_id: createdEvents[idx]?.id || null,
    }));
    await supabase.from('alerts').insert(alertsWithEventIds);
  }

  // Record the simulation
  const simulationRecord: Omit<AttackSimulation, 'id' | 'created_at'> = {
    simulation_name: `${attackType} Simulation — ${intensity} Intensity`,
    attack_type: attackType,
    source_ip: sourceIP,
    target_ip: targetIP,
    packet_count: packetCount,
    duration_seconds: Math.floor((completedAt.getTime() - startTime.getTime()) / 1000),
    intensity,
    threats_detected: threatsDetected,
    false_positives: falsePositives,
    status: 'Completed',
    started_at: startTime.toISOString(),
    completed_at: completedAt.toISOString(),
  };
  await supabase.from('attack_simulations').insert(simulationRecord);

  // Update detection stats
  await supabase.rpc('increment_stat', { stat_key_name: 'total_traffic_analyzed', increment_value: packetCount }).maybeSingle();
  await supabase.rpc('increment_stat', { stat_key_name: 'anomalies_detected', increment_value: threatsDetected + falsePositives }).maybeSingle();
  await supabase.rpc('increment_stat', { stat_key_name: 'total_threats', increment_value: createdEvents.length }).maybeSingle();
  await supabase.rpc('increment_stat', { stat_key_name: 'active_threats', increment_value: createdEvents.length }).maybeSingle();

  const result: SimulationResult = {
    totalPackets: packetCount,
    threatsDetected,
    falsePositives,
    detectionRate,
    events: createdEvents,
    alerts: [],
  };

  onComplete?.(result);
  return result;
}

export async function generateLiveThreat(): Promise<void> {
  const attackType = randomChoice(['DoS Attack', 'Brute Force', 'Port Scan', 'Data Exfiltration', 'Malware C2', 'Phishing']);
  const severity = severityForAttackType(attackType);
  const sourceIP = randomIP();
  const targetIP = randomTarget();
  const params = generateTrafficForAttack(attackType, 'Medium');
  const descriptions = ATTACK_DESCRIPTIONS[attackType];
  const description = randomChoice(descriptions);

  const { data: event } = await supabase
    .from('threat_events')
    .insert({
      source_ip: sourceIP,
      destination_ip: targetIP,
      attack_type: attackType,
      severity,
      confidence: confidenceForSeverity(severity),
      protocol: params.protocol,
      port: params.port,
      packet_size: params.packetSize,
      status: 'Active',
      description,
    })
    .select()
    .single();

  if (event) {
    await supabase.from('alerts').insert({
      event_id: event.id,
      title: `${attackType} — ${sourceIP}`,
      severity,
      status: 'Open',
      source_ip: sourceIP,
      attack_type: attackType,
      message: description,
      recommended_action: RECOMMENDED_ACTIONS[severity],
    });
  }

  await supabase.rpc('increment_stat', { stat_key_name: 'total_threats', increment_value: 1 }).maybeSingle();
  await supabase.rpc('increment_stat', { stat_key_name: 'active_threats', increment_value: 1 }).maybeSingle();
  await supabase.rpc('increment_stat', { stat_key_name: 'anomalies_detected', increment_value: 1 }).maybeSingle();
}

export async function mitigateThreat(eventId: string): Promise<void> {
  await supabase
    .from('threat_events')
    .update({ status: 'Mitigated', mitigated_at: new Date().toISOString() })
    .eq('id', eventId);

  await supabase.rpc('increment_stat', { stat_key_name: 'active_threats', increment_value: -1 }).maybeSingle();
  await supabase.rpc('increment_stat', { stat_key_name: 'mitigated_threats', increment_value: 1 }).maybeSingle();
}

export async function resolveThreat(eventId: string): Promise<void> {
  await supabase
    .from('threat_events')
    .update({ status: 'Resolved', mitigated_at: new Date().toISOString() })
    .eq('id', eventId);
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await supabase
    .from('alerts')
    .update({
      status: 'Acknowledged',
      acknowledged_by: 'SOC Analyst',
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId);
}

export async function resolveAlert(alertId: string): Promise<void> {
  await supabase
    .from('alerts')
    .update({ status: 'Resolved', resolved_at: new Date().toISOString() })
    .eq('id', alertId);
}

export async function escalateAlert(alertId: string): Promise<void> {
  await supabase
    .from('alerts')
    .update({ status: 'Escalated' })
    .eq('id', alertId);
}
