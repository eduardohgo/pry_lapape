"use client";

import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { BarChart3, Wallet, Settings, ShieldCheck, Store } from "lucide-react";

export default function DuenoPage() {
  return (
    <RoleLayout
      title="Panel de Dueño"
      subtitle="Indicadores clave, caja y configuración general."
    >
      {/* Hero ejecutivo */}
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1F2937] to-[#4B5563] text-white p-4 sm:p-5 shadow-[0_24px_60px_rgba(15,23,42,0.70)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60 font-semibold">
                Dirección general de La Pape
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
                Visión general del negocio
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/85 max-w-xl">
                Monitorea las ventas, controla la caja y ajusta la configuración general
                de tu papelería desde un solo lugar.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right text-xs">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <Store size={14} className="text-amber-200" />
                <span className="font-semibold">La Pape</span>
              </div>
              <span className="mt-2 text-[11px] text-white/70">
                Panel principal del negocio
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            <QuickAction
              label="Ver reportes"
              icon={<BarChart3 size={16} />}
              onClick={() => (location.href = "/reportes")}
            />
            <QuickAction
              label="Caja del día"
              icon={<Wallet size={16} />}
              onClick={() => (location.href = "/caja")}
            />
            <QuickAction
              label="Configuración"
              icon={<Settings size={16} />}
              onClick={() => (location.href = "/configuracion")}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 border border-[#E5E7EB] shadow-[0_18px_40px_rgba(15,23,42,0.06)] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-[0.18em]">
              Salud del negocio
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#374151]">
              <li className="flex items-center justify-between">
                <span>Ventas diarias</span>
                <span className="rounded-full bg-[#ECFEFF] text-[#0284C7] px-2 py-0.5 text-xs font-semibold">
                  Revisar en reportes
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Estado de caja</span>
                <span className="text-xs text-emerald-600 font-medium">
                  Control desde módulo Caja
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Seguridad y accesos</span>
                <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                  <ShieldCheck size={14} />
                  Ajustar en configuración
                </span>
              </li>
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-[#6B7280]">
            Tip: Revisa la configuración de roles y permisos para asegurar que cada
            usuario tenga solo los accesos necesarios.
          </p>
        </div>
      </section>

      {/* Tarjetas principales */}
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard
          title="Ventas"
          desc="Ingresos y tendencia"
          href="/reportes"
          icon={<BarChart3 size={18} />}
        />
        <StatCard
          title="Caja"
          desc="Cortes y movimientos"
          href="/caja"
          icon={<Wallet size={18} />}
        />
        <StatCard
          title="Ajustes"
          desc="Tienda y seguridad"
          href="/configuracion"
          icon={<Settings size={18} />}
        />
      </section>
    </RoleLayout>
  );
}

