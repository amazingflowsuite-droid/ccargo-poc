// ==============================================================================
// MOTOR DE CÁLCULO DE ESTADIA E CONTROLE DE SLA (CCARGO)
// ==============================================================================

export interface DetentionCalculationResult {
  totalWaitingMinutes: number;
  freeTimeMinutes: number;
  excessMinutes: number;
  remainingFreeMinutes: number;
  hourlyRate: number;
  chargeAmount: number;
  statusLevel: 'OK' | 'WARNING' | 'OVERDUE' | 'DELIVERED';
  percentageUsed: number;
  formattedWaiting: string;
  formattedExcess: string;
}

/**
 * Formata minutos em string amigável (Ex: "2h 45m" ou "35m")
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.floor(minutes % 60);

  if (hours === 0) return `${remainingMins}m`;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Calcula a permanência e cobrança de estadia de um trecho/veículo
 */
export function calculateDetention(params: {
  arrivalAt: string | Date;
  departureAt?: string | Date | null;
  freeTimeMinutes?: number;
  hourlyRate?: number;
  chargeFraction?: boolean;
}): DetentionCalculationResult {
  const arrivalDate = new Date(params.arrivalAt);
  const isFinished = !!params.departureAt;
  const endDate = isFinished ? new Date(params.departureAt!) : new Date();

  // Franquia padrão da Lei 11.442/2007 é 5 horas (300 minutos) se não houver contrato
  const freeTime = params.freeTimeMinutes ?? 300;
  const rate = params.hourlyRate ?? 80.0;
  const allowFractions = params.chargeFraction ?? true;

  // Diferença em minutos
  const diffMs = endDate.getTime() - arrivalDate.getTime();
  const totalWaitingMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  // Excesso de tempo após esgotar a franquia livre
  const excessMinutes = Math.max(0, totalWaitingMinutes - freeTime);
  const remainingFreeMinutes = Math.max(0, freeTime - totalWaitingMinutes);

  // Cálculo financeiro
  let chargeAmount = 0;
  if (excessMinutes > 0) {
    if (allowFractions) {
      // Cobra proporcional aos minutos (R$ por minuto = taxa / 60)
      chargeAmount = Number(((excessMinutes / 60) * rate).toFixed(2));
    } else {
      // Arredonda para cima em horas cheias
      const fullHours = Math.ceil(excessMinutes / 60);
      chargeAmount = Number((fullHours * rate).toFixed(2));
    }
  }

  // Percentual da franquia consumida
  const percentageUsed = freeTime > 0 
    ? Math.round((totalWaitingMinutes / freeTime) * 100) 
    : 100;

  // Nível de severidade visual
  let statusLevel: 'OK' | 'WARNING' | 'OVERDUE' | 'DELIVERED';
  if (isFinished) {
    statusLevel = 'DELIVERED';
  } else if (excessMinutes > 0) {
    statusLevel = 'OVERDUE'; // 🔴 Estourou o tempo, gerando cobrança
  } else if (percentageUsed >= 70) {
    statusLevel = 'WARNING'; // 🟡 Atenção, restam poucos minutos
  } else {
    statusLevel = 'OK'; // 🟢 Dentro do prazo seguro
  }

  return {
    totalWaitingMinutes,
    freeTimeMinutes: freeTime,
    excessMinutes,
    remainingFreeMinutes,
    hourlyRate: rate,
    chargeAmount,
    statusLevel,
    percentageUsed,
    formattedWaiting: formatMinutes(totalWaitingMinutes),
    formattedExcess: formatMinutes(excessMinutes),
  };
}
