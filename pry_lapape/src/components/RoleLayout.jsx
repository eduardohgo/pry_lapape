"use client";

import useUser from "@/hooks/useUser";
import Header from "@/components/Header";

export default function RoleLayout({ title, subtitle, children }) {
  const { user, signOut } = useUser();

  return (
    <>
      <Header isAuth={!!user} user={user} onSignOut={signOut} />
      <main className="min-h-[calc(100vh-64px)] bg-[#FFF9E6]">
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#EC5DBB] tracking-wider">
              TU PANEL
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1C1C1C]">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-[#333] mt-2">{subtitle}</p>}
          </div>

          {children}
        </section>
      </main>
    </>
  );
}
 