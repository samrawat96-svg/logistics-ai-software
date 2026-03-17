-- ============================================
-- LOGIAI — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  sla_tier text DEFAULT 'Standard', -- Platinum, Gold, Standard
  origin text NOT NULL,
  destination text NOT NULL,
  items integer DEFAULT 1,
  weight_kg numeric DEFAULT 0,
  status text DEFAULT 'Pending', -- Pending, In Transit, Delivered, Delayed, Processing
  eta date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- SHIPMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  bol_number text UNIQUE NOT NULL,
  scac text NOT NULL,
  incoterms text DEFAULT 'FOB',
  origin text NOT NULL,
  destination text NOT NULL,
  vehicle_id text,
  eta date,
  temp_celsius numeric,
  temp_alert boolean DEFAULT false,
  status text DEFAULT 'Booked', -- Booked, In Transit, Gate In, Customs Hold, Gate Out, POD Signed
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- FLEET / VEHICLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_number text UNIQUE NOT NULL,
  vin text UNIQUE,
  driver_name text,
  eld_status text DEFAULT 'Connected', -- Connected, Malfunction, Data Transfer
  hos_status text DEFAULT 'OFF', -- D, ON, SB, OFF
  drive_remaining_minutes integer DEFAULT 660,
  fuel_percent numeric DEFAULT 100,
  odometer_miles integer DEFAULT 0,
  status text DEFAULT 'Stopped', -- Moving, Stopped, Alert
  cargo_type text DEFAULT 'General Freight',
  speed_mph integer DEFAULT 0,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- DRIVERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  cdl_license text UNIQUE,
  eld_status text DEFAULT 'Connected',
  hos_status text DEFAULT 'OFF',
  drive_remaining_minutes integer DEFAULT 660,
  safety_score numeric DEFAULT 95,
  vehicle_number text,
  status text DEFAULT 'Active', -- Active, Off Duty
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- WAREHOUSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id text UNIQUE NOT NULL,
  name text NOT NULL,
  facility_type text DEFAULT 'Distribution Center', -- Distribution Center, Fulfillment Center, Cross-Dock
  utilization_pct integer DEFAULT 50,
  capacity_sqft integer DEFAULT 10000,
  dock_doors integer DEFAULT 10,
  available_doors integer DEFAULT 5,
  location text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_number text UNIQUE NOT NULL,
  company_name text NOT NULL,
  sla_tier text DEFAULT 'Standard', -- Platinum, Gold, Standard
  annual_value_usd integer DEFAULT 0,
  active_orders integer DEFAULT 0,
  on_time_rate numeric DEFAULT 90,
  risk_score numeric DEFAULT 20,
  credit_limit_usd integer DEFAULT 100000,
  status text DEFAULT 'Active', -- Active, On Hold
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- ALERTS (for operations log / notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type text DEFAULT 'info', -- info, warning, critical, success
  title text NOT NULL,
  message text,
  entity_type text, -- vehicle, shipment, order, warehouse, driver
  entity_id text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (open for demo — no auth required)
-- ============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Allow all (anon) for demo — tighten with auth in production
CREATE POLICY "Allow all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all shipments" ON public.shipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all warehouses" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_customer ON public.orders(customer_name);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_vehicle ON public.shipments(vehicle_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX idx_alerts_type ON public.alerts(type);

-- ============================================
-- updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA
-- ============================================
INSERT INTO public.warehouses (warehouse_id, name, facility_type, utilization_pct, capacity_sqft, dock_doors, available_doors, location) VALUES
('WH-001','Chicago DC','Distribution Center',87,50000,24,6,'Chicago, IL'),
('WH-002','Los Angeles FC','Fulfillment Center',72,35000,18,9,'Los Angeles, CA'),
('WH-003','Dallas XD','Cross-Dock',94,20000,32,3,'Dallas, TX'),
('WH-004','Atlanta DC','Distribution Center',61,45000,20,11,'Atlanta, GA'),
('WH-005','Seattle XD','Cross-Dock',78,15000,16,5,'Seattle, WA')
ON CONFLICT (warehouse_id) DO NOTHING;

INSERT INTO public.customers (customer_number, company_name, sla_tier, annual_value_usd, active_orders, on_time_rate, risk_score, credit_limit_usd, status) VALUES
('CUST-001','Apex Industries','Platinum',2400000,48,98.2,8,5000000,'Active'),
('CUST-002','NovaTech Corp','Platinum',1800000,32,97.1,11,4000000,'Active'),
('CUST-003','Pacific Rim Traders','Gold',980000,24,94.3,22,2000000,'Active'),
('CUST-004','Midwest Grain Co','Gold',720000,18,91.7,28,1500000,'Active'),
('CUST-005','Atlas Distribution','Gold',550000,22,89.4,35,1200000,'Active'),
('CUST-006','Zenith Medical','Platinum',2100000,41,96.8,12,4500000,'Active'),
('CUST-007','Cornerstone Retail','Standard',320000,9,85.2,45,600000,'Active'),
('CUST-008','BlueStar Logistics','Standard',280000,7,82.1,52,500000,'On Hold'),
('CUST-009','Ironwood Manufacturing','Gold',660000,19,90.3,31,1400000,'Active'),
('CUST-010','Cascade Foods','Standard',190000,5,78.9,61,400000,'Active')
ON CONFLICT (customer_number) DO NOTHING;

INSERT INTO public.vehicles (vehicle_number, vin, driver_name, eld_status, hos_status, drive_remaining_minutes, fuel_percent, odometer_miles, status, cargo_type, speed_mph, latitude, longitude) VALUES
('TRK-0001','1HTMM12345001','Marcus Johnson','Connected','D',440,78.5,125000,'Moving','Electronics',63,41.8781,-87.6298),
('TRK-0002','1HTMM12345002','Tyler Williams','Connected','D',380,62.1,204000,'Moving','Auto Parts',58,34.0522,-118.2437),
('TRK-0003','1HTMM12345003','Elena Rodriguez','Connected','D',510,91.3,88000,'Moving','Pharma·Cold Chain',71,33.4484,-112.0740),
('TRK-0004','1HTMM12345004','Jason Chen','Connected','ON',0,45.2,312000,'Stopped','Foodstuff',0,32.7767,-96.7970),
('TRK-0005','1HTMM12345005','Patricia Thompson','Malfunction','D',55,23.8,445000,'Alert','Hazmat',0,29.7604,-95.3698),
('TRK-0006','1HTMM12345006','David Garcia','Connected','D',620,88.0,67000,'Moving','General Freight',68,47.6062,-122.3321),
('TRK-0007','1HTMM12345007','Rachel Martinez','Connected','D',390,71.4,178000,'Moving','Reefer·Produce',55,37.7749,-122.4194),
('TRK-0008','1HTMM12345008','Kevin Anderson','Connected','SB',0,55.6,256000,'Stopped','Electronics',0,39.7392,-104.9903),
('TRK-0009','1HTMM12345009','Sandra Taylor','Connected','D',470,67.9,143000,'Moving','Auto Parts',61,25.7617,-80.1918),
('TRK-0010','1HTMM12345010','James Wilson','Connected','D',290,38.1,389000,'Moving','General Freight',49,44.9778,-93.2650)
ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO public.drivers (driver_number, full_name, cdl_license, eld_status, hos_status, drive_remaining_minutes, safety_score, vehicle_number, status) VALUES
('DRV-001','Marcus Johnson','CDL-A-100001','Connected','D',440,97.2,'TRK-0001','Active'),
('DRV-002','Tyler Williams','CDL-A-100002','Connected','D',380,93.8,'TRK-0002','Active'),
('DRV-003','Elena Rodriguez','CDL-A-100003','Connected','D',510,98.5,'TRK-0003','Active'),
('DRV-004','Jason Chen','CDL-A-100004','Connected','ON',0,88.1,'TRK-0004','Active'),
('DRV-005','Patricia Thompson','CDL-A-100005','Malfunction','D',55,72.4,'TRK-0005','Active'),
('DRV-006','David Garcia','CDL-A-100006','Connected','D',620,99.1,'TRK-0006','Active'),
('DRV-007','Rachel Martinez','CDL-A-100007','Connected','D',390,91.3,'TRK-0007','Active'),
('DRV-008','Kevin Anderson','CDL-A-100008','Connected','SB',0,85.6,'TRK-0008','Off Duty'),
('DRV-009','Sandra Taylor','CDL-A-100009','Connected','D',470,94.7,'TRK-0009','Active'),
('DRV-010','James Wilson','CDL-A-100010','Connected','D',290,79.2,'TRK-0010','Active')
ON CONFLICT (driver_number) DO NOTHING;

INSERT INTO public.orders (order_number, customer_name, sla_tier, origin, destination, items, weight_kg, status, eta) VALUES
('ORD-8001','Apex Industries','Platinum','CHICAGO','DETROIT',12,4200,'In Transit','2026-03-20'),
('ORD-8002','NovaTech Corp','Platinum','LOS ANGELES','MIAMI',8,1800,'Pending','2026-03-22'),
('ORD-8003','Pacific Rim Traders','Gold','DALLAS','BOSTON',24,6500,'In Transit','2026-03-19'),
('ORD-8004','Zenith Medical','Platinum','ATLANTA','CHICAGO',3,420,'Delayed','2026-03-18'),
('ORD-8005','Midwest Grain Co','Gold','PHOENIX','LAS VEGAS',16,12000,'Processing','2026-03-21'),
('ORD-8006','Atlas Distribution','Gold','SEATTLE','PORTLAND',7,2100,'Delivered','2026-03-17'),
('ORD-8007','Cascade Foods','Standard','HOUSTON','DALLAS',9,3400,'Pending','2026-03-23'),
('ORD-8008','Ironwood Manufacturing','Gold','DETROIT','MINNEAPOLIS',5,890,'In Transit','2026-03-20'),
('ORD-8009','Cornerstone Retail','Standard','SAN FRANCISCO','DENVER',11,2800,'Processing','2026-03-22'),
('ORD-8010','BlueStar Logistics','Standard','NEW YORK','ATLANTA',6,1650,'Delayed','2026-03-19')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.shipments (bol_number, scac, incoterms, origin, destination, vehicle_id, eta, temp_celsius, temp_alert, status) VALUES
('BOL-2024001','USX','FOB','USCHICAGO','USDETROIT','TRK-0001','2026-03-20',NULL,false,'In Transit'),
('BOL-2024002','FDX','DDP','USLOSANGELES','USMIAMI','TRK-0002','2026-03-22',NULL,false,'Booked'),
('BOL-2024003','UPSF','DAP','USDALLAS','USBOSTON','TRK-0003','2026-03-19',5.8,false,'In Transit'),
('BOL-2024004','CNWY','EXW','USATLANTA','USCHICAGO','TRK-0005','2026-03-18',NULL,false,'Customs Hold'),
('BOL-2024005','ABFS','FCA','USPHOENIX','USLASVEGAS','TRK-0006','2026-03-21',NULL,false,'Gate In'),
('BOL-2024006','RDWY','CPT','USSEATTLE','USPORTLAND','TRK-0007','2026-03-17',NULL,false,'POD Signed'),
('BOL-2024007','HNRY','FOB','USHOUSTON','USDALLAS','TRK-0008','2026-03-23',NULL,false,'Booked'),
('BOL-2024008','DAFG','DAP','USDETROIT','USMINNEAPOLIS','TRK-0009','2026-03-20',2.1,false,'In Transit'),
('BOL-2024009','EXLA','DDP','USSANFRAN','USDENVER','TRK-0010','2026-03-22',NULL,false,'Gate Out'),
('BOL-2024010','USX','FOB','USNYC','USATLANTA','TRK-0001','2026-03-19',-2.3,true,'In Transit')
ON CONFLICT (bol_number) DO NOTHING;

INSERT INTO public.alerts (type, title, message, entity_type, entity_id) VALUES
('critical','TEMP ALERT: BOL-2024010','Reefer unit exceeding set-point by 3.8°C — pharmaceutical SLA breach imminent','shipment','BOL-2024010'),
('warning','HOS Warning: DRV-005','Patricia Thompson has only 55 min drive time remaining','driver','DRV-005'),
('critical','ELD Malfunction: TRK-0005','ELD device reporting malfunction — manual log required','vehicle','TRK-0005'),
('info','WH-003 Capacity Alert','Dallas XD at 94% utilization — overflow auth required','warehouse','WH-003'),
('success','BOL-2024006 Delivered','POD signed at USPORTLAND facility','shipment','BOL-2024006');
