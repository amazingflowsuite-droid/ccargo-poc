-- ==============================================================================
-- CCARGO - SISTEMA DE GESTÃO DE ESTADIAS E TORRE DE CONTROLE
-- Banco de Dados: Supabase (PostgreSQL)
-- Modelo Multi-tenant com Suporte a Filiais e Parametrização de SLA por Cliente
-- ==============================================================================

-- Habilita extensão para UUIDs se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABELA DE TENANTS (Empresas / Transportadoras no modelo SaaS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    trade_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE FILIAIS (Branches da empresa)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- Ex: 'MATRIZ-SP', 'FIL-CWB', 'FIL-RJ', 'FIL-BH'
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE CLIENTES (Embarcadores / Destinatários das Cargas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cnpj VARCHAR(20) NOT NULL,
    corporate_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    email_notification_recipients TEXT[] DEFAULT '{}', -- E-mails que recebiam os alertas manuais
    contact_phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, cnpj)
);

-- ------------------------------------------------------------------------------
-- 4. TABELA DE CONTRATOS E SLAS DE ESTADIA (Parametrização por Cliente)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contract_slas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'GERAL', -- 'GERAL', 'VAN', 'TOCO', 'TRUCK', 'CARRETA', 'BITREM'
    free_time_minutes INTEGER NOT NULL DEFAULT 300, -- Franquia de tempo livre (Padrão legal 5h = 300 min)
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 80.00, -- Valor em R$ por hora excedente
    charge_fraction BOOLEAN NOT NULL DEFAULT true, -- Cobra proporcional aos minutos ou apenas hora cheia
    business_hours_only BOOLEAN NOT NULL DEFAULT false, -- Se pausa fora do horário comercial
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(customer_id, vehicle_type)
);

-- ------------------------------------------------------------------------------
-- 5. TABELA DE CARGAS / TRECHOS (Viagens e status no SSW)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cargo_legs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    cte_key VARCHAR(50) NOT NULL, -- Chave de acesso do CT-e
    cte_number VARCHAR(50) NOT NULL,
    cte_series VARCHAR(10),
    nfe_number VARCHAR(50),
    
    license_plate VARCHAR(20) NOT NULL, -- Placa do caminhão
    vehicle_type VARCHAR(50) DEFAULT 'TRUCK',
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),
    
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    destination_address TEXT,
    
    -- Timestamps cruciais para a estadia
    arrival_at TIMESTAMPTZ, -- Check-in: momento em que chegou na portaria do cliente
    unload_start_at TIMESTAMPTZ, -- Início da descarga
    departure_at TIMESTAMPTZ, -- Check-out: conclusão da descarga / canhoto assinado
    
    -- Status da carga
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING_UNLOAD', 
    -- 'IN_TRANSIT', 'WAITING_UNLOAD' (Aguardando Descarregamento), 'UNLOADING' (Descarregando), 'DELIVERED' (Finalizado)
    
    ssw_last_event_code VARCHAR(20),
    ssw_last_event_desc TEXT,
    ssw_last_sync_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. TABELA DE HISTÓRICO DE EVENTOS / OCORRÊNCIAS (Auditoria e SSW / E-mail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leg_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo_leg_id UUID NOT NULL REFERENCES cargo_legs(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'SSW_API', -- 'SSW_API', 'EMAIL_PARSER', 'MANUAL_ENTRY'
    event_code VARCHAR(50) NOT NULL, -- Código SSW/OCOREN (Ex: 'CHEGADA', 'INICIO_DESCARGA', 'ENTREGA_CONCLUIDA')
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    raw_payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. TABELA DE COBRANÇAS DE ESTADIA (Detention Bills)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detention_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cargo_leg_id UUID NOT NULL REFERENCES cargo_legs(id) ON DELETE CASCADE UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    arrival_at TIMESTAMPTZ NOT NULL,
    departure_at TIMESTAMPTZ NOT NULL,
    total_waiting_minutes INTEGER NOT NULL,
    free_time_minutes INTEGER NOT NULL,
    excess_minutes INTEGER NOT NULL,
    
    hourly_rate_applied NUMERIC(10, 2) NOT NULL,
    total_charge_amount NUMERIC(10, 2) NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', 
    -- 'PENDING_APPROVAL', 'APPROVED', 'INVOICED', 'CONTESTED', 'CANCELLED'
    
    billing_notes TEXT,
    dossier_pdf_url TEXT,
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. ÍNDICES DE PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_slas_customer ON contract_slas(customer_id);
CREATE INDEX IF NOT EXISTS idx_cargo_legs_tenant_status ON cargo_legs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cargo_legs_branch ON cargo_legs(branch_id);
CREATE INDEX IF NOT EXISTS idx_cargo_legs_customer ON cargo_legs(customer_id);
CREATE INDEX IF NOT EXISTS idx_cargo_legs_cte ON cargo_legs(cte_number);
CREATE INDEX IF NOT EXISTS idx_cargo_legs_plate ON cargo_legs(license_plate);
CREATE INDEX IF NOT EXISTS idx_detention_bills_tenant ON detention_bills(tenant_id, status);

-- ------------------------------------------------------------------------------
-- 9. DADOS DE DEMONSTRAÇÃO / SEEDS INICIAIS (CCARGO + 4 FILIAIS + SLAS)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_tenant_id UUID;
    v_filial_sp UUID;
    v_filial_cwb UUID;
    v_filial_rj UUID;
    v_filial_bh UUID;
    v_cliente_ambev UUID;
    v_cliente_magalu UUID;
    v_cliente_natura UUID;
BEGIN
    -- 1. Cria a CCargo como Tenant principal
    INSERT INTO tenants (id, name, cnpj, trade_name)
    VALUES (
        '11111111-1111-1111-1111-111111111111',
        'CCARGO TRANSPORTES E LOGISTICA LTDA',
        '12.345.678/0001-90',
        'CCargo Logistics'
    )
    ON CONFLICT (cnpj) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_tenant_id;

    -- 2. Cria as 4 Filiais da CCargo
    INSERT INTO branches (id, tenant_id, code, name, city, state)
    VALUES 
        ('22222222-2222-2222-2222-222222222201', v_tenant_id, 'MATRIZ-SP', 'Matriz São Paulo / Guarulhos', 'Guarulhos', 'SP'),
        ('22222222-2222-2222-2222-222222222202', v_tenant_id, 'FIL-CWB', 'Filial Curitiba / Pinhais', 'Curitiba', 'PR'),
        ('22222222-2222-2222-2222-222222222203', v_tenant_id, 'FIL-RJ', 'Filial Rio de Janeiro / Duque de Caxias', 'Rio de Janeiro', 'RJ'),
        ('22222222-2222-2222-2222-222222222204', v_tenant_id, 'FIL-BH', 'Filial Belo Horizonte / Contagem', 'Contagem', 'MG')
    ON CONFLICT (tenant_id, code) DO NOTHING;

    SELECT id INTO v_filial_sp FROM branches WHERE tenant_id = v_tenant_id AND code = 'MATRIZ-SP';
    SELECT id INTO v_filial_cwb FROM branches WHERE tenant_id = v_tenant_id AND code = 'FIL-CWB';
    SELECT id INTO v_filial_rj FROM branches WHERE tenant_id = v_tenant_id AND code = 'FIL-RJ';

    -- 3. Cria Clientes Exemplo com Contratos Diferentes
    INSERT INTO customers (id, tenant_id, cnpj, corporate_name, trade_name, email_notification_recipients)
    VALUES
        ('33333333-3333-3333-3333-333333333301', v_tenant_id, '03.014.557/0001-40', 'AMBEV S.A.', 'Ambev CD Central', ARRAY['logistica@ambev.com.br', 'portaria@ambev.com.br']),
        ('33333333-3333-3333-3333-333333333302', v_tenant_id, '47.960.950/0001-21', 'MAGAZINE LUIZA S/A', 'Magalu CD Cajamar', ARRAY['recebimento.cajamar@magalu.com.br']),
        ('33333333-3333-3333-3333-333333333303', v_tenant_id, '71.673.990/0001-77', 'NATURA COSMETICOS S/A', 'Natura Hub SP', ARRAY['descarga@natura.net'])
    ON CONFLICT (tenant_id, cnpj) DO NOTHING;

    SELECT id INTO v_cliente_ambev FROM customers WHERE tenant_id = v_tenant_id AND cnpj = '03.014.557/0001-40';
    SELECT id INTO v_cliente_magalu FROM customers WHERE tenant_id = v_tenant_id AND cnpj = '47.960.950/0001-21';
    SELECT id INTO v_cliente_natura FROM customers WHERE tenant_id = v_tenant_id AND cnpj = '71.673.990/0001-77';

    -- 4. Parametrização de SLA / Tempo Livre por Cliente (Requisito 2)
    -- Ambev: Franquia estrita de 2 horas (120 min), R$ 110,00/hora excedente
    INSERT INTO contract_slas (tenant_id, customer_id, vehicle_type, free_time_minutes, hourly_rate, charge_fraction)
    VALUES (v_tenant_id, v_cliente_ambev, 'GERAL', 120, 110.00, true)
    ON CONFLICT (customer_id, vehicle_type) DO UPDATE SET free_time_minutes = EXCLUDED.free_time_minutes, hourly_rate = EXCLUDED.hourly_rate;

    -- Magalu: Franquia de 3 horas (180 min), R$ 95,00/hora excedente
    INSERT INTO contract_slas (tenant_id, customer_id, vehicle_type, free_time_minutes, hourly_rate, charge_fraction)
    VALUES (v_tenant_id, v_cliente_magalu, 'GERAL', 180, 95.00, true)
    ON CONFLICT (customer_id, vehicle_type) DO UPDATE SET free_time_minutes = EXCLUDED.free_time_minutes, hourly_rate = EXCLUDED.hourly_rate;

    -- Natura: Padrão legal de 5 horas (300 min), R$ 85,00/hora excedente
    INSERT INTO contract_slas (tenant_id, customer_id, vehicle_type, free_time_minutes, hourly_rate, charge_fraction)
    VALUES (v_tenant_id, v_cliente_natura, 'GERAL', 300, 85.00, true)
    ON CONFLICT (customer_id, vehicle_type) DO UPDATE SET free_time_minutes = EXCLUDED.free_time_minutes, hourly_rate = EXCLUDED.hourly_rate;

    -- 5. Cargas Ativas de Demonstração (Cenários Reais de Espera)
    -- Carga 1: Ambev - Chegou há 3h45m (já estourou as 2h livres por 1h45m -> GERANDO MULTA AO VIVO!)
    INSERT INTO cargo_legs (
        id, tenant_id, branch_id, customer_id,
        cte_key, cte_number, license_plate, vehicle_type, driver_name, driver_phone,
        origin_city, destination_city, arrival_at, status, ssw_last_event_code, ssw_last_event_desc
    ) VALUES (
        '44444444-4444-4444-4444-444444444401', v_tenant_id, v_filial_sp, v_cliente_ambev,
        '35260912345678000190570010000458911000458911', '45891', 'BRA2E19', 'CARRETA', 'Carlos Eduardo da Silva', '(11) 98877-6655',
        'Guarulhos - SP', 'Jaguariúna - SP', now() - INTERVAL '225 minutes', 'WAITING_UNLOAD', 'OCO-41', 'Chegada no Destino / Aguardando Descarga'
    ) ON CONFLICT DO NOTHING;

    -- Carga 2: Magalu - Chegou há 2h10m (Franquia de 3h, restam 50 min de tolerância -> ALERTA AMARELO)
    INSERT INTO cargo_legs (
        id, tenant_id, branch_id, customer_id,
        cte_key, cte_number, license_plate, vehicle_type, driver_name, driver_phone,
        origin_city, destination_city, arrival_at, status, ssw_last_event_code, ssw_last_event_desc
    ) VALUES (
        '44444444-4444-4444-4444-444444444402', v_tenant_id, v_filial_sp, v_cliente_magalu,
        '35260912345678000190570010000458921000458922', '45892', 'FGH8A90', 'TRUCK', 'Marcos Rogério Pires', '(11) 97711-2233',
        'Guarulhos - SP', 'Cajamar - SP', now() - INTERVAL '130 minutes', 'WAITING_UNLOAD', 'OCO-41', 'Apresentação na Portaria'
    ) ON CONFLICT DO NOTHING;

    -- Carga 3: Natura - Chegou há 45 min (Franquia de 5h -> STATUS VERDE TRANQUILO)
    INSERT INTO cargo_legs (
        id, tenant_id, branch_id, customer_id,
        cte_key, cte_number, license_plate, vehicle_type, driver_name, driver_phone,
        origin_city, destination_city, arrival_at, status, ssw_last_event_code, ssw_last_event_desc
    ) VALUES (
        '44444444-4444-4444-4444-444444444403', v_tenant_id, v_filial_cwb, v_cliente_natura,
        '35260912345678000190570010000458931000458933', '45893', 'QWP4J77', 'TRUCK', 'Gilberto Mendes', '(41) 99122-3344',
        'Curitiba - PR', 'São Paulo - SP', now() - INTERVAL '45 minutes', 'WAITING_UNLOAD', 'OCO-41', 'Aguardando Descarregamento'
    ) ON CONFLICT DO NOTHING;

    -- Carga 4: Finalizada com Estadia Cobrada (Histórico de Faturamento)
    INSERT INTO cargo_legs (
        id, tenant_id, branch_id, customer_id,
        cte_key, cte_number, license_plate, vehicle_type, driver_name, driver_phone,
        origin_city, destination_city, arrival_at, unload_start_at, departure_at,
        status, ssw_last_event_code, ssw_last_event_desc
    ) VALUES (
        '44444444-4444-4444-4444-444444444404', v_tenant_id, v_filial_rj, v_cliente_ambev,
        '35260912345678000190570010000458941000458944', '45894', 'RTY3B22', 'CARRETA', 'José Antunes', '(21) 98112-9988',
        'Duque de Caxias - RJ', 'Piraí - RJ', 
        now() - INTERVAL '1 day' - INTERVAL '5 hours', 
        now() - INTERVAL '1 day' - INTERVAL '1 hour',
        now() - INTERVAL '1 day',
        'DELIVERED', 'OCO-01', 'Entrega Realizada / Canhoto Assinado'
    ) ON CONFLICT DO NOTHING;

    -- Fatura de Estadia para a Carga 4: Ficou 5h no total, franquia era 2h -> 3h de excesso x R$ 110,00 = R$ 330,00
    INSERT INTO detention_bills (
        cargo_leg_id, tenant_id, customer_id, arrival_at, departure_at,
        total_waiting_minutes, free_time_minutes, excess_minutes,
        hourly_rate_applied, total_charge_amount, status, billing_notes
    ) VALUES (
        '44444444-4444-4444-4444-444444444404', v_tenant_id, v_cliente_ambev,
        now() - INTERVAL '1 day' - INTERVAL '5 hours', now() - INTERVAL '1 day',
        300, 120, 180, 110.00, 330.00, 'APPROVED', 'Permanência de 5h no CD Piraí com descarga lenta.'
    ) ON CONFLICT (cargo_leg_id) DO NOTHING;

END $$;
