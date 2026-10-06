-- =====================================================================
-- FAST CONNECT CALL CENTER & OPERATIONS PLATFORM — NEON POSTGRESQL SCHEMA
-- =====================================================================
-- Run this complete script in your Neon SQL Editor to create all tables
-- and insert initial enterprise data (Pakistani banking & contractors).
-- =====================================================================

-- 1. EXTENSIONS (Employee Extensions & Agents)
CREATE TABLE IF NOT EXISTS extensions (
    id VARCHAR(64) PRIMARY KEY,
    extension VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    role VARCHAR(128),
    department VARCHAR(128),
    email VARCHAR(128),
    phone VARCHAR(64),
    status VARCHAR(32) DEFAULT 'available',
    active_calls_today INT DEFAULT 0,
    avg_handling_seconds INT DEFAULT 200,
    pin VARCHAR(16),
    bio TEXT,
    shift_hours VARCHAR(64),
    is_developer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. VENDORS (Certified Contractors & Technicians)
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    contact_person VARCHAR(128),
    trade VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    alt_phone VARCHAR(64),
    email VARCHAR(128),
    rating NUMERIC(3, 1) DEFAULT 4.5,
    active_jobs INT DEFAULT 0,
    completed_jobs INT DEFAULT 0,
    status VARCHAR(32) DEFAULT 'available',
    coverage_areas TEXT[],
    hourly_rate VARCHAR(64),
    sla_minutes INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TICKETS (Service Requests & Complaints)
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(128) NOT NULL,
    branch_name VARCHAR(128) NOT NULL,
    city VARCHAR(64) DEFAULT 'Lahore',
    client_name VARCHAR(128) NOT NULL,
    client_phone VARCHAR(64) NOT NULL,
    client_email VARCHAR(128),
    category VARCHAR(64) DEFAULT 'Electrical',
    priority VARCHAR(32) DEFAULT 'High',
    status VARCHAR(32) DEFAULT 'New',
    description TEXT,
    assigned_extension VARCHAR(16),
    assigned_agent_name VARCHAR(128),
    assigned_vendor_id VARCHAR(64) REFERENCES vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CALLS (Call Ledger: Inbound, Outbound, SIP, and Dual-SIM Cellular)
CREATE TABLE IF NOT EXISTS calls (
    id VARCHAR(64) PRIMARY KEY,
    caller_number VARCHAR(64) NOT NULL,
    caller_name VARCHAR(128) NOT NULL,
    organization VARCHAR(128),
    branch VARCHAR(128),
    city VARCHAR(64) DEFAULT 'Lahore',
    extension VARCHAR(16),
    agent_name VARCHAR(128),
    direction VARCHAR(32) NOT NULL, -- 'inbound', 'outbound', 'missed', 'sim'
    duration_seconds INT DEFAULT 0,
    status VARCHAR(32) DEFAULT 'completed',
    call_outcome VARCHAR(64),
    has_recording BOOLEAN DEFAULT TRUE,
    recording_duration VARCHAR(16),
    notes TEXT,
    transcript TEXT,
    ai_summary JSONB,
    channel VARCHAR(32) DEFAULT 'pbx', -- 'pbx', 'sim', 'webrtc', 'cellular'
    sim_slot VARCHAR(16), -- 'SIM 1', 'SIM 2'
    sim_carrier VARCHAR(64), -- 'Jazz Corporate 4G', 'Zong Enterprise 4G'
    sim_purpose VARCHAR(128),
    linked_ticket_id VARCHAR(64) REFERENCES tickets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TICKET TIMELINE (Audit Log Events)
CREATE TABLE IF NOT EXISTS ticket_timeline (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    actor VARCHAR(128) NOT NULL,
    action VARCHAR(128) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TICKET VENDOR RESPONSES (Technician ETAs & Quotations)
CREATE TABLE IF NOT EXISTS ticket_vendor_responses (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(64) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    vendor_id VARCHAR(64),
    vendor_name VARCHAR(128),
    eta VARCHAR(64),
    technician_assigned VARCHAR(128),
    notes TEXT,
    quote_estimate VARCHAR(64),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MISSED CALLS (Inbound alerts requiring callback)
CREATE TABLE IF NOT EXISTS missed_calls (
    id VARCHAR(64) PRIMARY KEY,
    caller_number VARCHAR(64) NOT NULL,
    caller_name VARCHAR(128) NOT NULL,
    organization VARCHAR(128) NOT NULL,
    branch VARCHAR(128) NOT NULL,
    priority VARCHAR(32) DEFAULT 'High',
    issue_summary TEXT,
    return_call_scheduled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SCHEDULED CALLS (Follow-up Reminders & Calendared Calls)
CREATE TABLE IF NOT EXISTS scheduled_calls (
    id VARCHAR(64) PRIMARY KEY,
    recipient_name VARCHAR(128) NOT NULL,
    recipient_number VARCHAR(64) NOT NULL,
    organization VARCHAR(128),
    branch VARCHAR(128),
    purpose VARCHAR(128),
    notes TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    assigned_agent VARCHAR(128),
    linked_ticket_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. DAILY REPORTS (Daily Work Activity Logging)
CREATE TABLE IF NOT EXISTS daily_reports (
    id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64),
    agent_name VARCHAR(128) NOT NULL,
    report_date DATE NOT NULL,
    shift VARCHAR(64),
    total_calls INT DEFAULT 0,
    inbound_calls INT DEFAULT 0,
    outbound_calls INT DEFAULT 0,
    resolved_tickets INT DEFAULT 0,
    summary_notes TEXT,
    status VARCHAR(32) DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CALL FORWARDING RULES (Matrix)
CREATE TABLE IF NOT EXISTS call_forwarding_rules (
    id VARCHAR(64) PRIMARY KEY,
    from_extension VARCHAR(16) NOT NULL,
    forward_to_number VARCHAR(64) NOT NULL,
    rule_type VARCHAR(32) NOT NULL, -- 'always', 'busy', 'no-answer', 'after-hours'
    is_active BOOLEAN DEFAULT TRUE,
    label VARCHAR(128)
);

-- =====================================================================
-- INITIAL SEED DATA (Pakistani Banking Branches & Certified Contractors)
-- =====================================================================

-- Seed Extensions
INSERT INTO extensions (id, extension, name, role, department, email, phone, status, pin, bio, shift_hours, is_developer)
VALUES 
('emp-101', '101', 'Tariq Mehmood', 'Lead Electrical Project Engineer', 'Engineering & Dispatch', 'tariq.mehmood@fastconnect.internal', '+92 42 111 327 101', 'available', '1010', 'Commercial power systems engineer and triage coordinator.', '08:30 AM - 05:00 PM', false),
('emp-102', '102', 'Fatima Noor', 'Field Operations & Site Supervisor', 'Site Execution & Inspection', 'fatima.noor@fastconnect.internal', '+92 42 111 327 102', 'available', '1020', 'Supervision of electrical contractors across Lahore.', '09:00 AM - 05:30 PM', false),
('emp-103', '103', 'Imran Ali', 'Vendor Procurement Lead', 'Vendor Coordination', 'imran.ali@fastconnect.internal', '+92 42 111 327 103', 'available', '1030', 'Vendor SLAs and emergency parts procurement.', '08:00 AM - 04:30 PM', false),
('emp-104', '104', 'Sarah Khan', 'Corporate Banking Accounts Liaison', 'Client Relations', 'sarah.khan@fastconnect.internal', '+92 42 111 327 104', 'available', '1040', 'Banking facility managers liaison and approvals.', '10:00 AM - 06:30 PM', false),
('emp-105', '105', 'Bilal Tech (Developer)', 'Telephony Systems Engineer', 'IT & Infrastructure', 'bilal.tech@fastconnect.internal', '+92 42 111 327 105', 'available', '1050', 'PBX developer and telemetry maintainer.', 'Flexible Shift', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Vendors
INSERT INTO vendors (id, name, contact_person, trade, category, phone, alt_phone, email, rating, active_jobs, completed_jobs, status, coverage_areas, hourly_rate, sla_minutes)
VALUES
('v-101', 'Lahore Power Fixers (Tariq Electrician)', 'Tariq Hussain', 'Certified Commercial Electrician', 'Electrical', '+92 300 4567891', '+92 42 35889012', 'tariq.electrician@lahorefixers.pk', 4.9, 1, 142, 'available', ARRAY['Gulberg', 'Model Town', 'DHA', 'Johar Town'], 'PKR 2,500/hr', 45),
('v-102', 'Chillers & Cool HVAC Services', 'Engr. Kamran Raza', 'HVAC & VRF Cooling Specialist', 'HVAC / Cooling', '+92 321 8765432', '+92 42 35711234', 'service@chillerscool.pk', 4.8, 2, 98, 'available', ARRAY['All Lahore Zones', 'Faisalabad', 'Sheikhupura'], 'PKR 3,500/hr', 60),
('v-103', 'Pak Generator Solutions', 'Mian Rashid', 'Diesel Generator Specialist', 'Generator & Backup', '+92 333 9988776', '+92 42 37466554', 'dispatch@pakgenset.pk', 4.7, 1, 76, 'available', ARRAY['Lahore Ring Road', 'Multan Road', 'Sundar'], 'PKR 4,000/hr', 45),
('v-104', 'Apex Network Cabling & Fiber', 'Zubair Aslam', 'Structured Cabling Specialist', 'Network / IT', '+92 345 1122334', '+92 42 35912345', 'support@apexnetwork.pk', 4.9, 0, 114, 'available', ARRAY['DHA Phase 1-8', 'Gulberg', 'Cavalry Ground'], 'PKR 2,000/hr', 30),
('v-105', 'SafeGuard CCTV & Security Systems', 'Nasir Mehmood', 'Access Control Specialist', 'Security / Access', '+92 301 5566778', '+92 42 36678901', 'alarm@safeguardpak.pk', 4.6, 1, 88, 'available', ARRAY['Citywide Lahore'], 'PKR 2,200/hr', 60)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Tickets
INSERT INTO tickets (id, title, organization, branch_name, city, client_name, client_phone, client_email, category, priority, status, description, assigned_extension, assigned_agent_name, assigned_vendor_id)
VALUES
('TKT-8401', 'Main Breaker Tripping & UPS Bypass Alert', 'Habib Bank Limited (HBL)', 'Gulberg Main Branch', 'Lahore', 'Rashid Minhas (Manager)', '+92 42 35751234', 'rashid.minhas@hbl.internal', 'Electrical', 'Critical', 'Vendor Assigned', 'Branch reporting main incoming 100A 3-phase MCCB tripping intermittently under air conditioner load. Branch UPS running on bypass.', '101', 'Tariq Mehmood', 'v-101'),
('TKT-8402', 'ATM Vestibule AC Unit Compressor Failure', 'Meezan Bank Ltd', 'DHA Phase 5 Branch', 'Lahore', 'Usman Qureshi (Ops Lead)', '+92 42 37189012', 'usman.q@meezanbank.internal', 'HVAC / Cooling', 'High', 'Vendor Assigned', 'The 2-ton split AC in the 24/7 ATM lobby has stopped cooling. Temperature inside vestibule reached 38°C.', '102', 'Fatima Noor', 'v-102'),
('TKT-8403', '50kVA Generator Fuel Line Leakage', 'MCB Bank Limited', 'Mall Road Branch', 'Lahore', 'Asim Javed (Admin)', '+92 42 37351122', 'asim.javed@mcb.internal', 'Generator & Backup', 'High', 'New', 'Emergency diesel generator leaking fuel near secondary filter during weekly automatic transfer switch self-test.', '101', 'Tariq Mehmood', 'v-103')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Calls
INSERT INTO calls (id, caller_number, caller_name, organization, branch, city, extension, agent_name, direction, duration_seconds, status, call_outcome, has_recording, recording_duration, notes, channel, sim_slot, sim_carrier, linked_ticket_id)
VALUES
('call-1001', '+92 42 35751234', 'Rashid Minhas (Branch Mgr)', 'Habib Bank Limited (HBL)', 'Gulberg Main Branch', 'Lahore', '101', 'Tariq Mehmood', 'inbound', 245, 'completed', 'Site Inspection Scheduled', true, '04:05', 'Main breaker tripping under daytime load. Emergency electrician dispatched.', 'pbx', NULL, NULL, 'TKT-8401'),
('call-1002', '+92 300 4567891', 'Tariq Hussain (Electrician)', 'Lahore Power Fixers', 'Field Contractor', 'Lahore', '101', 'Tariq Mehmood', 'outbound', 180, 'completed', 'Price & Terms Confirmed', true, '03:00', 'Dispatched contractor to HBL Gulberg branch. ETA confirmed 45 mins.', 'sim', 'SIM 1', 'Jazz Corporate 4G', 'TKT-8401'),
('call-1003', '+92 42 37189012', 'Usman Qureshi (Ops Lead)', 'Meezan Bank Ltd', 'DHA Phase 5 Branch', 'Lahore', '102', 'Fatima Noor', 'inbound', 190, 'completed', 'Quotation Requested', true, '03:10', 'ATM vestibule AC compressor failure. Dispatched Chillers & Cool HVAC.', 'pbx', NULL, NULL, 'TKT-8402')
ON CONFLICT (id) DO NOTHING;
