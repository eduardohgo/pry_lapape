"use client";
import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import Input from "@/components/Inputs";
import { PrimaryButton } from "@/components/Buttons";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const METHODS = [
  {
    value: "PASSWORD_ONLY",
    title: "Solo contraseña",
    description: "Inicio de sesión clásico usando únicamente tu contraseña.",
    badge: "Rápido",
  },
  {
    value: "PASSWORD_2FA",
    title: "Contraseña + 2FA por correo",
    description: "Enviamos un código de 6 dígitos a tu correo en cada acceso.",
    badge: "Recomendado",
  },
  {
    value: "PASSWORD_SECRET",
    title: "Contraseña + pregunta secreta",
    description: "Respondes una pregunta personal después de la contraseña.",
    badge: "Seguro",
  },
];

const normalizeMethod = (user) => {
  if (user?.loginMethod) return user.loginMethod;
  if (user?.twoFAEnabled) return "PASSWORD_2FA";
  return "PASSWORD_ONLY";
};

export default function ConfigPage() {
  const { user: authUser, token, login: authLogin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState("PASSWORD_2FA");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hasSecretQuestion, setHasSecretQuestion] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const remember = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("token"));
  }, []);

  const applyUserData = (userData) => {
    if (!userData) return;
    setMethod(normalizeMethod(userData));
    setQuestion(userData.secretQuestion || "");
    setHasSecretQuestion(Boolean(userData.hasSecretQuestion));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api("/auth/me", { method: "GET" });
        applyUserData(res.user);
        if (res.user && token) {
          authLogin({ user: res.user, token, remember });
        }
      } catch (err) {
        // Silenciamos errores si no hay sesión activa
        if (authUser) {
          setError(err.message || "No se pudo cargar tu configuración");
        }
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      applyUserData(authUser);
      setLoading(false);
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (method === "PASSWORD_SECRET") {
      if (!question.trim()) {
        setError("Debes definir la pregunta secreta");
        return;
      }
      if (!hasSecretQuestion && !answer.trim()) {
        setError("Debes ingresar la respuesta para activarla");
        return;
      }
    }

    try {
      setSaving(true);
      const res = await api("/auth/login-method", {
        method: "PATCH",
        body: {
          method,
          question: method === "PASSWORD_SECRET" ? question : undefined,
          answer: method === "PASSWORD_SECRET" ? answer : undefined,
        },
      });

      applyUserData(res.user);
      setHasSecretQuestion(Boolean(res.user?.hasSecretQuestion));
      setAnswer("");
      setMessage(res.message || "Método actualizado correctamente");

      if (res.user && token) {
        authLogin({ user: res.user, token, remember });
      }
    } catch (err) {
      setError(err.message || "No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#222]">Seguridad de inicio de sesión</h1>
            <p className="text-black/70">
              Elige cómo quieres autenticarte. Solo una opción puede estar activa a la vez.
            </p>
          </div>
          <span className="px-3 py-1 text-sm rounded-full bg-[#E8F4FF] text-[#1D6FD1] font-semibold">
            {loading ? "Cargando..." : "Configuración activa"}
          </span>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <section className="grid gap-4 md:grid-cols-3">
            {METHODS.map((option) => {
              const isActive = method === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setMethod(option.value)}
                  className={`text-left rounded-2xl border-2 transition-all p-4 h-full ${
                    isActive
                      ? "border-[#1D6FD1] bg-[#E9F3FF] shadow-sm"
                      : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs font-bold">
                          {isActive ? "●" : "○"}
                        </span>
                        <h2 className="text-lg font-bold text-[#111]">{option.title}</h2>
                      </div>
                      <p className="mt-2 text-sm text-[#444]">{option.description}</p>
                    </div>
                    <span className="px-2 py-1 text-[11px] rounded-full bg-black/5 text-[#444] font-semibold uppercase tracking-wide">
                      {option.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>

          {method === "PASSWORD_SECRET" && (
            <section className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-6 space-y-4">
              <h3 className="text-xl font-semibold text-[#111]">Configura tu pregunta secreta</h3>
              <p className="text-sm text-[#555]">
                Se utilizará como segundo factor cuando inicies sesión. Guardamos tu respuesta cifrada.
              </p>

              <Input
                label="Pregunta"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="¿Cuál es el nombre de tu primera mascota?"
              />

              <Input
                label="Respuesta"
                type="password"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={hasSecretQuestion ? "Ingresa una nueva respuesta (opcional)" : "Escribe tu respuesta"}
                helperText={
                  hasSecretQuestion
                    ? "Si dejas este campo vacío, conservaremos tu respuesta actual."
                    : "Necesitamos una respuesta para activar este método."
                }
              />
            </section>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <div className="flex justify-end">
            <PrimaryButton type="submit" disabled={saving || loading} className="px-6">
              {saving ? "Guardando..." : "Guardar preferencia"}
            </PrimaryButton>
          </div>
        </form>
      </main>
    </>
  );
}