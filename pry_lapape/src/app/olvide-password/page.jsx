"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function OlvidePassword(){
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e)=>{
    e.preventDefault();
    try{
      setLoading(true);
      await api("/auth/forgot-password", { body: { email }});
      alert("Si el correo existe, enviamos un código (o aparece en consola DEV).");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    }catch(err){ alert(err.message); }
    finally{ setLoading(false); }
  };

  return (
    <>
      <Header/>
      <section className="max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Recuperar contraseña</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Correo" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <PrimaryButton className="w-full py-3" disabled={loading}>{loading ? "Enviando..." : "Enviar código"}</PrimaryButton>
        </form>
      </section>
    </>
  );
}
