'use client';

import React, { useState } from 'react';
import { DollarSign, FileText, CheckCircle2, Clock, Download, ArrowUpRight, Search, Building } from 'lucide-react';
import { formatMinutes } from '@/lib/engine/detention-calculator';

interface DetentionInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  cnpj: string;
  cte_number: string;
  license_plate: string;
  branch_name: string;
  arrival_at: string;
  departure_at: string;
  total_waiting_minutes: number;
  free_time_minutes: number;
  excess_minutes: number;
  hourly_rate: number;
  total_amount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'INVOICED';
}

const DEMO_INVOICES: DetentionInvoice[] = [
  {
    id: '1',
    invoice_number: 'EST-2026-001',
    customer_name: 'AMBEV S.A.',
    cnpj: '03.014.557/0001-40',
    cte_number: '45894',
    license_plate: 'RTY3B22',
    branch_name: 'Filial Rio de Janeiro',
    arrival_at: '2026-09-20T10:00:00-03:00',
    departure_at: '2026-09-20T15:00:00-03:00',
    total_waiting_minutes: 300, // 5 horas
    free_time_minutes: 120, // 2 horas de franquia
    excess_minutes: 180, // 3 horas de excesso
    hourly_rate: 110.0,
    total_amount: 330.0,
    status: 'APPROVED',
  },
  {
    id: '2',
    invoice_number: 'EST-2026-002',
    customer_name: 'MAGAZINE LUIZA S/A',
    cnpj: '47.960.950/0001-21',
    cte_number: '45812',
    license_plate: 'EWR9911',
    branch_name: 'Matriz São Paulo',
    arrival_at: '2026-09-19T08:30:00-03:00',
    departure_at: '2026-09-19T13:45:00-03:00',
    total_waiting_minutes: 315, // 5h 15m
    free_time_minutes: 180, // 3 horas de franquia
    excess_minutes: 135, // 2h 15m de excesso
    hourly_rate: 95.0,
    total_amount: 213.75,
    status: 'PENDING_APPROVAL',
  },
  {
    id: '3',
    invoice_number: 'EST-2026-003',
    customer_name: 'AMBEV S.A.',
    cnpj: '03.014.557/0001-40',
    cte_number: '45750',
    license_plate: 'BRA2E19',
    branch_name: 'Matriz São Paulo',
    arrival_at: '2026-09-18T14:00:00-03:00',
    departure_at: '2026-09-18T18:30:00-03:00',
    total_waiting_minutes: 270, // 4h 30m
    free_time_minutes: 120,
    excess_minutes: 150, // 2h 30m
    hourly_rate: 110.0,
    total_amount: 275.0,
    status: 'INVOICED',
  }
];

export default function FaturamentoPage() {
  const [invoices, setInvoices] = useState<DetentionInvoice[]>(DEMO_INVOICES);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = invoices.filter(inv => {
    return filterStatus === 'ALL' || inv.status === filterStatus;
  });

  const totalBilled = invoices.reduce((acc, curr) => acc + curr.total_amount, 0);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Gestão de Cobranças & Faturamento de Estadias
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Histórico de sobre-estadias apuradas para emissão de Nota de Débito e faturamento contra clientes.
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Recuperado</p>
            <p className="text-2xl font-extrabold text-white">
              {totalBilled.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-white text-base">Faturas e Dossiês Gerados</h3>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'ALL' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('PENDING_APPROVAL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'PENDING_APPROVAL' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Aprovados
            </button>
            <button
              onClick={() => setFilterStatus('INVOICED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterStatus === 'INVOICED' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Faturados
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Identificador / Cliente</th>
                <th className="py-4 px-6">CT-e / Placa</th>
                <th className="py-4 px-6">Permanência Total</th>
                <th className="py-4 px-6">Excesso Faturável</th>
                <th className="py-4 px-6">Valor da Estadia</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs text-sky-400">{inv.invoice_number}</span>
                    <div className="font-semibold text-white mt-0.5">{inv.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{inv.branch_name}</div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-mono text-xs text-slate-200">CT-e #{inv.cte_number}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Placa: {inv.license_plate}</div>
                  </td>

                  <td className="py-4 px-6 text-xs text-slate-300">
                    <div className="font-mono font-medium">{formatMinutes(inv.total_waiting_minutes)}</div>
                    <div className="text-slate-400 text-[11px]">{formatMinutes(inv.free_time_minutes)} livres</div>
                  </td>

                  <td className="py-4 px-6 text-xs text-red-400 font-mono font-bold">
                    +{formatMinutes(inv.excess_minutes)}
                  </td>

                  <td className="py-4 px-6">
                    <span className="font-mono font-extrabold text-emerald-400 text-sm">
                      {inv.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <p className="text-[10px] text-slate-400">R$ {inv.hourly_rate.toFixed(2)}/h</p>
                  </td>

                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      inv.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      inv.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {inv.status === 'APPROVED' ? 'Aprovado' :
                       inv.status === 'PENDING_APPROVAL' ? 'Pendente' : 'Faturado'}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => alert(`Baixando espelho em PDF para a fatura ${inv.invoice_number}...`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5 text-sky-400" />
                      Espelho PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
