"use client";

import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { PackageSearch, ClipboardList, Users, Clock } from "lucide-react";

export default function TrabajadorPage() {
  return (
    <RoleLayout
      title="Panel de Trabajador"
      subtitle="Atiende pedidos, gestiona inventario y clientes."
    >
      {/* Cabecera con resumen de turno y acciones rápidas */}
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-3xl bg-gradient-to-r from-[#1D6FD1] via-[#2563EB] to-[#38BDF8] text-white p-4 sm:p-5 shadow-[0_20px_40px_rgba(37,99,235,0.35)]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
                Centro de operaciones La Pape
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
                Tu turno de hoy
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/90 max-w-md">
                Revisa pedidos pendientes, actualiza existencias y mantén al día la
                información de los clientes.
              </p>
            </div>
            <div className="flex flex-col items-end text-right text-xs">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <Clock size={14} className="text-amber-200" />
                <span className="font-semibold">En línea</span>
              </div>
              <span className="mt-2 text-[11px] text-white/75">
                Todo listo para comenzar
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
            <QuickAction
              label="Nuevo pedido"
              icon={<ClipboardList size={16} />}
              onClick={() => (location.href = "/pedidos/nuevo")}
            />
            <QuickAction
              label="Inventario"
              icon={<PackageSearch size={16} />}
              onClick={() => (location.href = "/inventario")}
            />
            <QuickAction
              label="Clientes frecuentes"
              icon={<Users size={16} />}
              onClick={() => (location.href = "/clientes")}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 border border-[#E5E7EB] shadow-[0_18px_40px_rgba(15,23,42,0.06)] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-[0.18em]">
              Resumen rápido
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#374151]">
              <li className="flex items-center justify-between">
                <span>Pedidos pendientes</span>
                <span className="rounded-full bg-[#EFF6FF] text-[#1D4ED8] px-2 py-0.5 text-xs font-semibold">
                  Hoy
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Revisar bajas de inventario</span>
                <span className="text-xs text-amber-600 font-medium">
                  Prioridad media
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Clientes por confirmar entrega</span>
                <span className="text-xs text-emerald-600 font-medium">
                  Seguimiento
                </span>
              </li>
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-[#6B7280]">
            Tip: Mantén actualizados los estados de los pedidos para que el resto del
            equipo tenga visibilidad en tiempo real.
          </p>
        </div>
      </section>

      {/* Accesos a módulos */}
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard
          title="Pedidos del día"
          desc="Lista y estados"
          href="/pedidos"
          icon={<ClipboardList size={18} />}
        />
        <StatCard
          title="Inventario"
          desc="Stock y movimientos"
          href="/inventario"
          icon={<PackageSearch size={18} />}
        />
        <StatCard
          title="Clientes"
          desc="Historial & soporte"
          href="/clientes"
          icon={<Users size={18} />}
        />
      </section>
    </RoleLayout>
  );
}

