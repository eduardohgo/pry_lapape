"use client";

import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { FileText, Heart, Ticket, Truck, UserCog, ShoppingBag } from "lucide-react";

export default function ClientePage() {
  return (
    <RoleLayout
      title="Panel de Cliente"
      subtitle="Administra tus pedidos, favoritos y beneficios."
    >
      {/* Hero del cliente */}
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-3xl bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#FACC15] text-[#111827] p-4 sm:p-5 shadow-[0_20px_40px_rgba(248,113,113,0.35)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#7C2D12] font-semibold">
                Bienvenido a tu espacio La Pape
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
                Controla tus compras y pedidos
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#7C2D12]/90 max-w-md">
                Consulta el estado de tus pedidos, administra tus productos favoritos y
                no pierdas ningún cupón o promoción.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#7C2D12]">
                <ShoppingBag size={14} />
                <span>Tu papelería digital</span>
              </div>
              <span className="mt-2 text-[11px] text-[#9A3412]">
                Compra rápido, revisa todo desde aquí.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            <QuickAction
              label="Editar perfil"
              icon={<UserCog size={16} />}
              onClick={() => (location.href = "/perfil")}
            />
            <QuickAction
              label="Rastrear pedido"
              icon={<Truck size={16} />}
              onClick={() => (location.href = "/perfil_pedidos")}
            />
            <QuickAction
              label="Ver catálogo"
              icon={<ShoppingBag size={16} />}
              onClick={() => (location.href = "/catalogo")}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 border border-[#E5E7EB] shadow-[0_18px_40px_rgba(15,23,42,0.06)] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-[0.18em]">
              Actividad reciente
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#374151]">
              <li className="flex items-center justify-between">
                <span>Último pedido realizado</span>
                <span className="rounded-full bg-[#ECFEFF] text-[#0E7490] px-2 py-0.5 text-xs font-semibold">
                  Ver detalle
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Productos en favoritos</span>
                <span className="text-xs text-pink-600 font-medium">
                  Mantenlos siempre a mano
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Cupones disponibles</span>
                <span className="text-xs text-emerald-600 font-medium">
                  Aprovéchalos antes de que caduquen
                </span>
              </li>
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-[#6B7280]">
            Tip: Desde aquí puedes ir directo a tus pedidos y revisar facturas de compras
            anteriores.
          </p>
        </div>
      </section>

      {/* Módulos principales */}
      <section className="grid md:grid-cols-3 gap-4">
        <StatCard
          title="Mis pedidos"
          desc="Revisa estados y facturas"
          href="/perfil_pedidos"
          icon={<FileText size={18} />}
        />
        <StatCard
          title="Favoritos"
          desc="Productos guardados"
          href="/favoritos"
          icon={<Heart size={18} />}
        />
        <StatCard
          title="Cupones"
          desc="Beneficios y promociones"
          href="/cupones"
          icon={<Ticket size={18} />}
        />
      </section>
    </RoleLayout>
  );
}

