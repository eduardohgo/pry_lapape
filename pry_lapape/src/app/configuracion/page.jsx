"use client";
import Header from "@/components/Header";

export default function ConfigPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Configuración</h1>
        <p className="text-black/70">Opciones de cuenta, seguridad y notificaciones.</p>
      </main>
    </>
  );
}