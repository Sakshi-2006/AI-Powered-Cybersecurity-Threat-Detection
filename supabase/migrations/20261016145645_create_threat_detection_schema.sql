/*
# AI-Powered Cybersecurity Threat Detection Schema

1. New Tables
- `threat_events` — Stores detected threat events with source IP, attack type, severity, confidence score, and status.
- `network_traffic` — Stores simulated network traffic records used for anomaly detection.
- `alerts` — Stores generated alerts from detected threats with severity levels and acknowledgment status.
- `attack_simulations` — Stores attack simulation runs with parameters and results.
- `detection_stats` — Stores aggregate statistics for dashboard metrics.

2. Security
- This is a single-tenant demo app with no sign-in screen.
- RLS enabled on all tables with anon+authenticated full CRUD access (intentionally public/shared demo data).
*/

CREATE TABLE IF NOT EXISTS threat_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ip text NOT NULL,
  destination_ip text NOT NULL,
  attack_type text NOT NULL DEFAULT 'Unknown',
  severity text NOT NULL DEFAULT 'Low' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  confidence real NOT NULL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  protocol text NOT NULL DEFAULT 'TCP',
  port integer NOT NULL DEFAULT 80,
  packet_size integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Mitigated', 'Investigating', 'Resolved')),
  description text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  mitigated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS network_traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ip text NOT NULL,
  destination_ip text NOT NULL,
  protocol text NOT NULL DEFAULT 'TCP',
  port integer NOT NULL DEFAULT 80,
  packet_size integer NOT NULL DEFAULT 0,
  duration real NOT NULL DEFAULT 0.0,
  bytes_sent bigint NOT NULL DEFAULT 0,
  bytes_received bigint NOT NULL DEFAULT 0,
  failed_logins integer NOT NULL DEFAULT 0,
  request_frequency integer NOT NULL DEFAULT 0,
  is_anomaly boolean NOT NULL DEFAULT false,
  anomaly_score real NOT NULL DEFAULT 0.0,
  traffic_type text NOT NULL DEFAULT 'Normal' CHECK (traffic_type IN ('Normal', 'DoS', 'Brute Force', 'Port Scan', 'Data Exfiltration', 'Phishing', 'Malware C2')),
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES threat_events(id) ON DELETE CASCADE,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Acknowledged', 'Resolved', 'Escalated')),
  source_ip text,
  attack_type text,
  message text NOT NULL,
  recommended_action text,
  acknowledged_by text,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS attack_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_name text NOT NULL,
  attack_type text NOT NULL,
  source_ip text NOT NULL,
  target_ip text NOT NULL,
  packet_count integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  intensity text NOT NULL DEFAULT 'Medium' CHECK (intensity IN ('Low', 'Medium', 'High', 'Extreme')),
  threats_detected integer NOT NULL DEFAULT 0,
  false_positives integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Completed' CHECK (status IN ('Running', 'Completed', 'Failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS detection_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key text NOT NULL UNIQUE,
  stat_value numeric NOT NULL DEFAULT 0,
  stat_label text NOT NULL,
  stat_category text NOT NULL DEFAULT 'General',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE threat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_stats ENABLE ROW LEVEL SECURITY;

-- threat_events policies (single-tenant, anon+authenticated)
DROP POLICY IF EXISTS "anon_select_threat_events" ON threat_events;
CREATE POLICY "anon_select_threat_events" ON threat_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_threat_events" ON threat_events;
CREATE POLICY "anon_insert_threat_events" ON threat_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_threat_events" ON threat_events;
CREATE POLICY "anon_update_threat_events" ON threat_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_threat_events" ON threat_events;
CREATE POLICY "anon_delete_threat_events" ON threat_events FOR DELETE TO anon, authenticated USING (true);

-- network_traffic policies
DROP POLICY IF EXISTS "anon_select_network_traffic" ON network_traffic;
CREATE POLICY "anon_select_network_traffic" ON network_traffic FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_network_traffic" ON network_traffic;
CREATE POLICY "anon_insert_network_traffic" ON network_traffic FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_network_traffic" ON network_traffic;
CREATE POLICY "anon_update_network_traffic" ON network_traffic FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_network_traffic" ON network_traffic;
CREATE POLICY "anon_delete_network_traffic" ON network_traffic FOR DELETE TO anon, authenticated USING (true);

-- alerts policies
DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alerts;
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE TO anon, authenticated USING (true);

-- attack_simulations policies
DROP POLICY IF EXISTS "anon_select_attack_simulations" ON attack_simulations;
CREATE POLICY "anon_select_attack_simulations" ON attack_simulations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_attack_simulations" ON attack_simulations;
CREATE POLICY "anon_insert_attack_simulations" ON attack_simulations FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_attack_simulations" ON attack_simulations;
CREATE POLICY "anon_update_attack_simulations" ON attack_simulations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_attack_simulations" ON attack_simulations;
CREATE POLICY "anon_delete_attack_simulations" ON attack_simulations FOR DELETE TO anon, authenticated USING (true);

-- detection_stats policies
DROP POLICY IF EXISTS "anon_select_detection_stats" ON detection_stats;
CREATE POLICY "anon_select_detection_stats" ON detection_stats FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_detection_stats" ON detection_stats;
CREATE POLICY "anon_insert_detection_stats" ON detection_stats FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_detection_stats" ON detection_stats;
CREATE POLICY "anon_update_detection_stats" ON detection_stats FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_detection_stats" ON detection_stats;
CREATE POLICY "anon_delete_detection_stats" ON detection_stats FOR DELETE TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_threat_events_detected_at ON threat_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON threat_events(severity);
CREATE INDEX IF NOT EXISTS idx_threat_events_status ON threat_events(status);
CREATE INDEX IF NOT EXISTS idx_network_traffic_detected_at ON network_traffic(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_traffic_is_anomaly ON network_traffic(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attack_simulations_started_at ON attack_simulations(started_at DESC);
