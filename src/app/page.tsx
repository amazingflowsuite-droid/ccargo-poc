'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Truck, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  RefreshCw,
  Phone,
  Building,
  ArrowUpRight
} from 'lucide-react';
import { calculateDetention, formatMinutes } from '@/lib/engine/detention-calculator';

// Dados de exemplo caso as tabelas ainda estejam sendo criadas no Supabase
const DEMO_CARGOS = [
  {
    id: '1',
    cte_number: '45891',
    license_plate: 'BRA2E19',
    vehicle_type: 'CARRETA',
    driver_name: 'Carlos Eduardo da Silva',
    driver_phone: '(11) 98877-6655',
    customer_name: 'AMBEV S.A. (CD Jaguariúna)',
    branch_name: 'Matriz São Paulo',
    branch_code: 'MATRIZ-SP',
    arrival_at: new Date(Date.now() - 225 * 60 * 1000).toISOString(), // 3h 45m atrás
    free_time_minutes: 120, // 2 horas de franquia
    hourly_rate: 110.0,
    status: 'WAITING_UNLOAD',
    ssw_last_event: 'OCO-41: Chegada no Destino / Aguardando Descarga',
  },
  {
    id: '2',
    cte_number: '45892',
    license_plate: 'FGH8A90',
    vehicle_type: 'TRUCK',
    driver_name: 'Marcos Rogério Pires',
    driver_phone: '(11) 97711-2233',
    customer_name: 'MAGAZINE LUIZA S/A (CD Cajamar)',
    branch_name: 'Matriz São Paulo',
    branch_code: 'MATRIZ-SP',
    arrival_at: new Date(Date.now() - 130 * 60 * 1000).toISOString(), // 2h 10m atrás
    free_time_minutes: 180, // 3 horas de franquia
    hourly_rate: 95.0,
    status: 'WAITING_UNLOAD',
    ssw_last_event: 'OCO-41: Apresentação na Portaria',
  },
  {
    id: '3',
    cte_number: '45893',
    license_plate: 'QWP4J77',
    vehicle_type: 'TRUCK',
    driver_name: 'Gilberto Mendes',
    driver_phone: '(41) 99122-3344',
    customer_name: 'NATURA COSMETICOS S/A (Hub SP)',
    branch_name: 'Filial Curitiba',
    branch_code: 'FIL-CWB',
    arrival_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m atrás
    free_time_minutes: 300, // 5 horas de franquia (padrão legal)
    hourly_rate: 85.0,
    status: 'WAITING_UNLOAD',
    ssw_last_event: 'OCO-41: Aguardando Descarregamento',
  },
  {
    id: '4',
    cte_number: '45894',
    license_plate: 'RTY3B22',
    vehicle_type: 'CARRETA',
    driver_name: 'José Antunes',
    driver_phone: '(21) 98112-9988',
    customer_name: 'AMBEV S.A. (CD Piraí)',
    branch_name: 'Filial Rio de Janeiro',
    branch_code: 'FIL-RJ',
    arrival_at: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    departure_at: new Date().toISOString(),
    free_time_minutes: 120,
    hourly_rate: 110.0,
    status: 'DELIVERED',
    ssw_last_event: 'OCO-01: Entrega Realizada / Canhoto Assinado',
  }
];

export default function TorreDeControlePage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedCargoForDossier, setSelectedCargoForDossier] = useState<any | null>(null);

  // Atualiza o relógio a cada 10 segundos para recalcular estadias em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const filteredCargos = DEMO_CARGOS.filter((cargo) => {
    const matchesBranch = selectedBranch === 'ALL' || cargo.branch_code === selectedBranch;
    const matchesSearch = 
      cargo.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.cte_number.includes(searchTerm) ||
      cargo.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // Estatísticas calculadas dinamicamente
  const activeWaiting = filteredCargos.filter(c => c.status === 'WAITING_UNLOAD');
  let totalDetentionAmount = 0;
  let overdueCount = 0;
  let warningCount = 0;

  activeWaiting.forEach(cargo => {
    const calc = calculateDetention({
      arrivalAt: cargo.arrival_at,
      freeTimeMinutes: cargo.free_time_minutes,
      hourlyRate: cargo.hourly_rate,
    });
    totalDetentionAmount += calc.chargeAmount;
    if (calc.statusLevel === 'OVERDUE') overdueCount++;
    if (calc.statusLevel === 'WARNING') warningCount++;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Torre de Controle Operacional
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Tempo Real
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitoramento de veículos em cliente, tolerâncias de contrato e cálculo automático de estadias.
          </p>
        </div>

        {/* Seletor de Filial (Multi-filial) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-sm">
            <Building className="h-4 w-4 text-slate-400 ml-2" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-slate-200 border-none focus:outline-none pr-3 py-1 cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-slate-900">Todas as Filiais (Consolidado)</option>
              <option value="MATRIZ-SP" className="bg-slate-900">Matriz São Paulo (Guarulhos)</option>
              <option value="FIL-CWB" className="bg-slate-900">Filial Curitiba (PR)</option>
              <option value="FIL-RJ" className="bg-slate-900">Filial Rio de Janeiro (RJ)</option>
              <option value="FIL-BH" className="bg-slate-900">Filial Belo Horizonte (MG)</option>
            </select>
          </div>

          <button
            onClick={() => setCurrentTime(new Date())}
            title="Atualizar dados do SSW"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Em Espera */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cargas em Espera</p>
              <p className="text-3xl font-extrabold text-white mt-2">{activeWaiting.length}</p>
            </div>
            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{activeWaiting.length - overdueCount}</span> dentro da tolerância
          </p>
        </div>

        {/* Card 2: Estadias Estouradas */}
        <div className="bg-slate-900/80 border border-red-900/40 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-red-400 uppercase tracking-wider">Tolerância Estourada</p>
              <p className="text-3xl font-extrabold text-red-400 mt-2">{overdueCount}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400 animate-pulse">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-red-300/80 mt-3 font-medium">
            Gerando cobrança de sobre-estadia agora
          </p>
        </div>

        {/* Card 3: Alertas Prévios */}
        <div className="bg-slate-900/80 border border-amber-900/40 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Prestes a Estourar</p>
              <p className="text-3xl font-extrabold text-amber-400 mt-2">{warningCount}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-amber-300/80 mt-3">
            Consumo &gt; 70% do tempo livre
          </p>
        </div>

        {/* Card 4: Faturamento Ativo de Diárias */}
        <div className="bg-slate-900/80 border border-emerald-900/40 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Estadia a Cobrar (Hoje)</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-2">
                {totalDetentionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            Receita recuperada via contrato
          </p>
        </div>
      </div>

      {/* Tabela Operacional */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por placa, CT-e ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Normal</span>
            <span className="flex items-center gap-1 ml-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Atenção (&gt;70%)</span>
            <span className="flex items-center gap-1 ml-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Estadia Excedida</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Veículo / Motorista</th>
                <th className="py-4 px-6">Cliente / CT-e</th>
                <th className="py-4 px-6">Chegada (Check-in)</th>
                <th className="py-4 px-6">Tempo de Espera</th>
                <th className="py-4 px-6">Franquia do Contrato</th>
                <th className="py-4 px-6">Cobrança de Estadia</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCargos.map((cargo) => {
                const calc = calculateDetention({
                  arrivalAt: cargo.arrival_at,
                  departureAt: (cargo as any).departure_at,
                  freeTimeMinutes: cargo.free_time_minutes,
                  hourlyRate: cargo.hourly_rate,
                });

                return (
                  <tr key={cargo.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Veículo */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono">
                          {cargo.license_plate}
                        </span>
                        <span className="text-xs text-slate-400">({cargo.vehicle_type})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span>{cargo.driver_name}</span>
                        <a href={`tel:${cargo.driver_phone}`} className="text-sky-400 hover:text-sky-300">
                          <Phone className="h-3 w-3 inline" />
                        </a>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{cargo.branch_name}</div>
                    </td>

                    {/* Cliente / CT-e */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200">{cargo.customer_name}</div>
                      <div className="text-xs text-sky-400 font-mono mt-0.5">CT-e #{cargo.cte_number}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{cargo.ssw_last_event}</div>
                    </td>

                    {/* Chegada */}
                    <td className="py-4 px-6 text-slate-300 text-xs">
                      <div>{new Date(cargo.arrival_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-slate-400">{new Date(cargo.arrival_at).toLocaleDateString('pt-BR')}</div>
                    </td>

                    {/* Tempo de Espera */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold font-mono text-sm ${
                          calc.statusLevel === 'OVERDUE' ? 'text-red-400' :
                          calc.statusLevel === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {calc.formattedWaiting}
                        </span>
                      </div>
                      {/* Barra de progresso da franquia */}
                      <div className="w-32 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            calc.statusLevel === 'OVERDUE' ? 'bg-red-500' :
                            calc.statusLevel === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, calc.percentageUsed)}%` }}
                        />
                      </div>
                    </td>

                    {/* Franquia Contrato */}
                    <td className="py-4 px-6 text-xs">
                      <div className="text-slate-300 font-medium">
                        {formatMinutes(cargo.free_time_minutes)} livres
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {calc.statusLevel === 'OVERDUE' ? (
                          <span className="text-red-400 font-semibold">Excedeu em {calc.formattedExcess}</span>
                        ) : (
                          <span className="text-slate-400">Restam {formatMinutes(calc.remainingFreeMinutes)}</span>
                        )}
                      </div>
                    </td>

                    {/* Cobrança */}
                    <td className="py-4 px-6">
                      {calc.chargeAmount > 0 ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                            {calc.chargeAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            R$ {cargo.hourly_rate.toFixed(2)}/h
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Isento
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedCargoForDossier({ cargo, calc })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-sky-400" />
                        Dossiê
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Dossiê de Estadia (Pronto para Faturamento) */}
      {selectedCargoForDossier && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Espelho de Cobrança de Estadia</h3>
                  <p className="text-xs text-slate-400">Dossiê de evidências para o financeiro da CCargo</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCargoForDossier(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Cliente (Devedor)</p>
                  <p className="font-semibold text-white">{selectedCargoForDossier.cargo.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Filial Emissora</p>
                  <p className="font-semibold text-white">{selectedCargoForDossier.cargo.branch_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <p className="text-slate-400">CT-e:</p>
                  <p className="font-mono text-slate-200">#{selectedCargoForDossier.cargo.cte_number}</p>
                </div>
                <div>
                  <p className="text-slate-400">Placa:</p>
                  <p className="font-mono text-slate-200">{selectedCargoForDossier.cargo.license_plate}</p>
                </div>
                <div>
                  <p className="text-slate-400">Motorista:</p>
                  <p className="text-slate-200">{selectedCargoForDossier.cargo.driver_name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Horário Check-in (Chegada no cliente):</span>
                <span className="font-medium text-slate-200">
                  {new Date(selectedCargoForDossier.cargo.arrival_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tempo Total de Permanência:</span>
                <span className="font-mono font-bold text-white">
                  {selectedCargoForDossier.calc.formattedWaiting}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Franquia Contratual Livre:</span>
                <span className="font-medium text-emerald-400">
                  {formatMinutes(selectedCargoForDossier.cargo.free_time_minutes)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tempo Excedente Tributável:</span>
                <span className="font-mono font-bold text-red-400">
                  {selectedCargoForDossier.calc.formattedExcess}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tarifa Contratada:</span>
                <span className="font-medium text-slate-300">
                  R$ {selectedCargoForDossier.cargo.hourly_rate.toFixed(2)} / hora
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t border-slate-700">
                <span className="text-white">Valor Total a Faturar:</span>
                <span className="text-emerald-400 font-mono text-lg">
                  {selectedCargoForDossier.calc.chargeAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedCargoForDossier(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  alert('Fatura gerada com sucesso! O dossiê de cobrança foi enviado para a fila de faturamento.');
                  setSelectedCargoForDossier(null);
                }}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-600/30 transition-colors flex items-center gap-1.5"
              >
                <ArrowUpRight className="h-4 w-4" />
                Aprovar para Faturamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
