import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Truck, Clock, ShieldCheck, DollarSign, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CCargo - SLA Entregas & Gestão de Estadias',
  description: 'Sistema de monitoramento em tempo real de tempos de descarga e gestão automatizada de estadias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col md:flex-row pb-16 md:pb-0">
        {/* Sidebar fixa */}
        <aside className="hidden md:flex w-64 bg-slate-900/90 border-r border-slate-800 flex-col justify-between shrink-0 p-4 sticky top-0 h-screen">
          <div>
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white leading-tight tracking-tight">CCARGO</h1>
                <p className="text-xs text-sky-400 font-medium">SLA Entregas</p>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Clock className="h-4 w-4 text-sky-400" />
                Painel de Monitoramento (Ao Vivo)
              </Link>

              <Link
                href="/contratos"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Contratos & SLAs
              </Link>

              <Link
                href="/faturamento"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <DollarSign className="h-4 w-4 text-amber-400" />
                Faturamento de Estadias
              </Link>
            </nav>
          </div>

          {/* Footer Sidebar: Status do SSW e Filial */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                4 Filiais Ativas
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SSW Online
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Multi-tenant: CCargo Matriz SP
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>

        {/* Navegação Mobile (Bottom Bar) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-2 z-50">
          <Link href="/" className="flex flex-col items-center p-2 text-sky-400 hover:text-sky-300">
            <Clock className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Painel</span>
          </Link>
          <Link href="/contratos" className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-200">
            <ShieldCheck className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Contratos</span>
          </Link>
          <Link href="/faturamento" className="flex flex-col items-center p-2 text-slate-400 hover:text-slate-200">
            <DollarSign className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Faturas</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
