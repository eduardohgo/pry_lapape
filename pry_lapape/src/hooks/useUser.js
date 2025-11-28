"use client";
import { useEffect, useState } from "react";

const KEYS = ["user", "usuario", "currentUser"];

function readUser() {
  if (typeof window === "undefined") return null;
  for (const k of KEYS) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

export default function useUser() {
  // hidrata sin setState dentro del effect
  const [user, setUser] = useState(() => readUser());

  // sincroniza si otra pestaña cambia el usuario
  useEffect(() => {
    const onStorage = (e) => {
      if (!e?.key || !KEYS.includes(e.key)) return;
      setUser(readUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // util de cierre de sesión
  const signOut = () => {
    try {
      KEYS.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem("token");
    } catch {}
    window.location.href = "/login";
  };

  return { user, setUser, signOut };
}
