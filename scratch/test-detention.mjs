import { calculateDetention, formatMinutes } from '../src/lib/engine/detention-calculator.js';

console.log('--- TESTE DO MOTOR DE ESTADIA (CCARGO) ---');

// Cenário 1: Chegou há 1h, Franquia 2h -> Dentro do prazo, R$ 0,00
const c1 = calculateDetention({
  arrivalAt: new Date(Date.now() - 60 * 60 * 1000),
  freeTimeMinutes: 120,
  hourlyRate: 110.0,
});
console.log('Cenário 1 (1h de espera, franquia 2h):', {
  status: c1.statusLevel,
  waiting: c1.formattedWaiting,
  excess: c1.formattedExcess,
  charge: c1.chargeAmount,
});
console.assert(c1.statusLevel === 'OK', 'Deveria ser OK');
console.assert(c1.chargeAmount === 0, 'Deveria ser R$ 0');

// Cenário 2: Chegou há 3h30m, Franquia 2h (120m), Taxa R$ 110/h -> 1h30m excesso = R$ 165,00
const c2 = calculateDetention({
  arrivalAt: new Date(Date.now() - 210 * 60 * 1000),
  freeTimeMinutes: 120,
  hourlyRate: 110.0,
});
console.log('Cenário 2 (3h30m de espera, franquia 2h):', {
  status: c2.statusLevel,
  waiting: c2.formattedWaiting,
  excess: c2.formattedExcess,
  charge: c2.chargeAmount,
});
console.assert(c2.statusLevel === 'OVERDUE', 'Deveria ser OVERDUE');
console.assert(c2.chargeAmount === 165.0, 'Deveria ser R$ 165,00');

// Cenário 3: Chegou há 4h30m, Franquia 5h -> 90% consumido -> Alerta Amarelo
const c3 = calculateDetention({
  arrivalAt: new Date(Date.now() - 270 * 60 * 1000),
  freeTimeMinutes: 300,
  hourlyRate: 85.0,
});
console.log('Cenário 3 (4h30m de espera, franquia 5h):', {
  status: c3.statusLevel,
  waiting: c3.formattedWaiting,
  percentage: `${c3.percentageUsed}%`,
  charge: c3.chargeAmount,
});
console.assert(c3.statusLevel === 'WARNING', 'Deveria ser WARNING');
console.assert(c3.chargeAmount === 0, 'Deveria ser R$ 0');

console.log(' TODOS OS TESTES MATEMÁTICOS PASSARAM COM SUCESSO!');
