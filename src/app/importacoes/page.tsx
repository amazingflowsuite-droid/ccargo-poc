import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function ImportacoesPage() {
  const { data: reports, error } = await supabase
    .from('email_delivery_reports')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Importações de E-mail
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Automático
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualização dos dados extraídos automaticamente da caixa de entrada do Gmail.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">NF</th>
                <th className="px-6 py-4">Destinatário</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Chegada</th>
                <th className="px-6 py-4">Saída</th>
                <th className="px-6 py-4">Assunto (Thread)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {report.nf}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {report.destinatario}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                      {report.chegada || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                      {report.saida || '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-[200px]" title={report.email_subject}>
                      {report.email_subject}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                    Nenhum registro de e-mail encontrado no banco de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
