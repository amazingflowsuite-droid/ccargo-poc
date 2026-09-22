'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Clock, DollarSign, Building, Mail, Edit2, Trash2 } from 'lucide-react';
import { formatMinutes } from '@/lib/engine/detention-calculator';

interface ContractItem {
  id: string;
  customer_name: string;
  cnpj: string;
  vehicle_type: string;
  free_time_minutes: number;
  hourly_rate: number;
  charge_fraction: boolean;
  email_recipients: string[];
}

const INITIAL_CONTRACTS: ContractItem[] = [
  {
    id: '1',
    customer_name: 'AMBEV S.A.',
    cnpj: '03.014.557/0001-40',
    vehicle_type: 'CARRETA / BITREM',
    free_time_minutes: 120, // 2 horas
    hourly_rate: 110.0,
    charge_fraction: true,
    email_recipients: ['logistica@ambev.com.br', 'portaria@ambev.com.br'],
  },
  {
    id: '2',
    customer_name: 'MAGAZINE LUIZA S/A',
    cnpj: '47.960.950/0001-21',
    vehicle_type: 'TRUCK',
    free_time_minutes: 180, // 3 horas
    hourly_rate: 95.0,
    charge_fraction: true,
    email_recipients: ['recebimento.cajamar@magalu.com.br'],
  },
  {
    id: '3',
    customer_name: 'NATURA COSMETICOS S/A',
    cnpj: '71.673.990/0001-77',
    vehicle_type: 'GERAL',
    free_time_minutes: 300, // 5 horas (Padrão legal Lei 11.442)
    hourly_rate: 85.0,
    charge_fraction: true,
    email_recipients: ['descarga@natura.net'],
  }
];

export default function ContratosPage() {
  const [contracts, setContracts] = useState<ContractItem[]>(INITIAL_CONTRACTS);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    cnpj: '',
    vehicle_type: 'GERAL',
    free_time_hours: 5,
    hourly_rate: 80,
    charge_fraction: true,
    email_recipients: '',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newContract: ContractItem = {
      id: Date.now().toString(),
      customer_name: formData.customer_name,
      cnpj: formData.cnpj,
      vehicle_type: formData.vehicle_type,
      free_time_minutes: Number(formData.free_time_hours) * 60,
      hourly_rate: Number(formData.hourly_rate),
      charge_fraction: formData.charge_fraction,
      email_recipients: formData.email_recipients.split(',').map(s => s.trim()).filter(Boolean),
    };

    setContracts([newContract, ...contracts]);
    setShowModal(false);
    setFormData({
      customer_name: '',
      cnpj: '',
      vehicle_type: 'GERAL',
      free_time_hours: 5,
      hourly_rate: 80,
      charge_fraction: true,
      email_recipients: '',
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Parametrização de Contratos & SLAs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure as regras de tolerância de descarga (tempo livre) e tarifas de estadia por cliente.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all self-start"
        >
          <Plus className="h-4 w-4" />
          Novo Contrato de SLA
        </button>
      </div>

      {/* Grid de Contratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-all shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {c.cnpj}
                </span>
                <h3 className="font-bold text-base text-white">{c.customer_name}</h3>
                <p className="text-xs text-sky-400 font-medium">Veículo: {c.vehicle_type}</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
            </div>

            {/* Métricas do SLA */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800 text-sm">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-sky-400" /> Franquia Livre
                </p>
                <p className="text-lg font-bold text-white mt-1">
                  {formatMinutes(c.free_time_minutes)}
                </p>
                <p className="text-[10px] text-slate-400">Tolerância sem custo</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-emerald-400" /> Valor / Hora
                </p>
                <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  R$ {c.hourly_rate.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {c.charge_fraction ? 'Cobra fração de min' : 'Hora cheia'}
                </p>
              </div>
            </div>

            {/* Alertas Automáticos */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> E-mails de Alerta Automático:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {c.email_recipients.map((email, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar Contrato */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Cadastrar SLA de Contrato</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Cliente (Razão Social)</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Coca-Cola FEMSA"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CNPJ do Cliente</label>
                  <input
                    required
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Categoria de Veículo</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="GERAL">Geral (Todos)</option>
                    <option value="TRUCK">Truck</option>
                    <option value="CARRETA / BITREM">Carreta / Bitrem</option>
                    <option value="TOCO">Toco</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tempo Livre (Horas)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="48"
                    value={formData.free_time_hours}
                    onChange={(e) => setFormData({ ...formData, free_time_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Padrão legal: 5 horas</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Valor por Hora (R$)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  E-mails para Notificações Automáticas (Separados por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="logistica@cliente.com, portaria@cliente.com"
                  value={formData.email_recipients}
                  onChange={(e) => setFormData({ ...formData, email_recipients: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
