// ==============================================================================
// TIPOS DO BANCO DE DADOS SUPABASE (CCARGO)
// ==============================================================================

export type VehicleType = 'GERAL' | 'VAN' | 'TOCO' | 'TRUCK' | 'CARRETA' | 'BITREM';

export type CargoLegStatus = 
  | 'IN_TRANSIT'        // Em rota / Viagem
  | 'WAITING_UNLOAD'    // Chegou no cliente, aguardando descarregamento
  | 'UNLOADING'         // Em processo de descarregamento
  | 'DELIVERED';        // Descarregamento finalizado / Canhoto assinado

export type DetentionBillStatus = 
  | 'PENDING_APPROVAL'  // Aguardando conferência do faturamento
  | 'APPROVED'          // Aprovado para cobrança
  | 'INVOICED'          // Faturado / Emitido boleto/ND
  | 'CONTESTED'         // Contestado pelo cliente
  | 'CANCELLED';        // Cancelado / Abonado comercialmente

export interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  trade_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  city?: string | null;
  state?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  cnpj: string;
  corporate_name: string;
  trade_name?: string | null;
  email_notification_recipients: string[];
  contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractSLA {
  id: string;
  tenant_id: string;
  customer_id: string;
  vehicle_type: VehicleType;
  free_time_minutes: number;
  hourly_rate: number;
  charge_fraction: boolean;
  business_hours_only: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CargoLeg {
  id: string;
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  cte_key: string;
  cte_number: string;
  cte_series?: string | null;
  nfe_number?: string | null;
  license_plate: string;
  vehicle_type: VehicleType;
  driver_name?: string | null;
  driver_phone?: string | null;
  origin_city?: string | null;
  destination_city?: string | null;
  destination_address?: string | null;
  arrival_at?: string | null;
  unload_start_at?: string | null;
  departure_at?: string | null;
  status: CargoLegStatus;
  ssw_last_event_code?: string | null;
  ssw_last_event_desc?: string | null;
  ssw_last_sync_at?: string | null;
  created_at: string;
  updated_at: string;

  // Relações opcionais populadas em joins
  customer?: Customer;
  branch?: Branch;
  sla?: ContractSLA;
  detention_bill?: DetentionBill;
}

export interface LegEvent {
  id: string;
  cargo_leg_id: string;
  source: 'SSW_API' | 'EMAIL_PARSER' | 'MANUAL_ENTRY';
  event_code: string;
  description?: string | null;
  occurred_at: string;
  raw_payload?: Record<string, unknown>;
  created_at: string;
}

export interface DetentionBill {
  id: string;
  tenant_id: string;
  cargo_leg_id: string;
  customer_id: string;
  arrival_at: string;
  departure_at: string;
  total_waiting_minutes: number;
  free_time_minutes: number;
  excess_minutes: number;
  hourly_rate_applied: number;
  total_charge_amount: number;
  status: DetentionBillStatus;
  billing_notes?: string | null;
  dossier_pdf_url?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;

  customer?: Customer;
  cargo_leg?: CargoLeg;
}
