"use client";
import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { PackageSearch, ClipboardList, Users } from "lucide-react";

export default function TrabajadorPage() {
  return (
    <RoleLayout
      title="Panel de Trabajador"
      subtitle="Atiende pedidos, gestiona inventario y clientes."
    >
      <div className="flex flex-wrap gap-3 mb-6">
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
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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
      </div>
    </RoleLayout>
  );
}
