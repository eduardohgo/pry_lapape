"use client";
import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { BarChart3, Wallet, Settings } from "lucide-react";

export default function DuenoPage() {
  return (
    <RoleLayout
      title="Panel de Dueño"
      subtitle="Indicadores clave, caja y configuración general."
    >
      <div className="flex flex-wrap gap-3 mb-6">
        <QuickAction
          label="Ver reportes"
          icon={<BarChart3 size={16} />}
          onClick={() => (location.href = "/reportes")}
        />
        <QuickAction
          label="Configuración"
          icon={<Settings size={16} />}
          onClick={() => (location.href = "/configuracion")}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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
      </div>
    </RoleLayout>
  );
}
