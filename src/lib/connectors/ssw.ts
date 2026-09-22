// ==============================================================================
// CONECTOR SSW TMS - INTEGRAÇÃO DE RASTREAMENTO E OCORRÊNCIAS
// Documentação de referência: https://ssw.inf.br/ajuda/
// ==============================================================================

export interface SSWTrackingEvent {
  cteNumber: string;
  cteKey?: string;
  eventCode: string;
  eventDescription: string;
  occurrenceDate: string; // YYYY-MM-DD
  occurrenceTime: string; // HH:mm
  city?: string;
  licensePlate?: string;
  notes?: string;
}

/**
 * Tabela de De-Para de Códigos de Ocorrência SSW (Padrão Proceda / OCOREN)
 * Mapeados para o ciclo de vida da estadia
 */
export const SSW_EVENT_MAPPING: Record<string, {
  targetStatus: 'IN_TRANSIT' | 'WAITING_UNLOAD' | 'UNLOADING' | 'DELIVERED';
  isArrivalTrigger?: boolean;
  isUnloadStartTrigger?: boolean;
  isDepartureTrigger?: boolean;
  label: string;
}> = {
  // Eventos de Chegada / Início de contagem do tempo livre
  '41': { targetStatus: 'WAITING_UNLOAD', isArrivalTrigger: true, label: 'Chegada no Destino / Aguardando Descarga' },
  '81': { targetStatus: 'WAITING_UNLOAD', isArrivalTrigger: true, label: 'Apresentação na Portaria do Cliente' },
  '82': { targetStatus: 'WAITING_UNLOAD', isArrivalTrigger: true, label: 'Veículo em Fila de Espera para Descarga' },

  // Eventos de Início de Descarga
  '83': { targetStatus: 'UNLOADING', isUnloadStartTrigger: true, label: 'Veículo em Doca / Início de Descarregamento' },

  // Eventos de Término / Check-out
  '01': { targetStatus: 'DELIVERED', isDepartureTrigger: true, label: 'Entrega Realizada / Canhoto Assinado' },
  '00': { targetStatus: 'DELIVERED', isDepartureTrigger: true, label: 'Processo Concluído com Sucesso' },
};

/**
 * Normaliza data e hora do formato SSW para ISO 8601
 */
export function parseSSWTimestamp(dateStr: string, timeStr: string): string {
  // Espera formato DD/MM/YYYY ou YYYY-MM-DD e HH:mm ou HH:mm:ss
  try {
    let cleanDate = dateStr.trim();
    if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY -> YYYY-MM-DD
        cleanDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    const cleanTime = timeStr.trim().length === 5 ? `${timeStr.trim()}:00` : timeStr.trim();
    return new Date(`${cleanDate}T${cleanTime}-03:00`).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Cliente de consulta à API do SSW (pronto para preenchimento com credenciais reais)
 */
export class SSWConnector {
  private baseUrl: string;
  private domain: string;
  private user: string;
  private pass: string;

  constructor() {
    this.baseUrl = process.env.SSW_API_BASE_URL || 'https://ssw.inf.br/api';
    this.domain = process.env.SSW_DOMAIN || '';
    this.user = process.env.SSW_USER || '';
    this.pass = process.env.SSW_PASSWORD || '';
  }

  /**
   * Consulta o rastreamento de um CT-e no SSW
   */
  async getTrackingByCte(cteNumber: string): Promise<SSWTrackingEvent[]> {
    if (!this.domain || !this.user) {
      // Mock para desenvolvimento quando credenciais ainda não foram informadas
      return [
        {
          cteNumber,
          eventCode: '41',
          eventDescription: 'Chegada no Destino / Aguardando Descarga',
          occurrenceDate: new Date().toISOString().split('T')[0],
          occurrenceTime: '08:30',
          notes: 'Aguardando liberação de doca',
        }
      ];
    }

    // TODO: Quando o dono da CCargo liberar o usuário/senha do SSW:
    // Efetuar chamada fetch POST para a URL oficial da API do SSW
    const response = await fetch(`${this.baseUrl}/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dominio: this.domain,
        usuario: this.user,
        senha: this.pass,
        cte: cteNumber,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao consultar SSW: ${response.statusText}`);
    }

    return await response.json();
  }
}
