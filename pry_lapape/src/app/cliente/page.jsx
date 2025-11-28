"use client";
import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { FileText, Heart, Ticket, Truck, UserCog } from "lucide-react";

export default function ClientePage() {
  return (
    <RoleLayout
      title="Panel de Cliente"
      subtitle="Administra tus pedidos, favoritos y beneficios."
    >
      <div className="flex flex-wrap gap-3 mb-6">
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
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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
      </div>
    </RoleLayout>
  );
}
