// src/app/layout.js
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import HotjarTag from "@/components/HotjarTag"; // 👈 importa Hotjar

export const metadata = {
  title: "La Pape",
  description: "Papelería creativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <HotjarTag />  {/* 👈 aquí inyectas el script de Hotjar */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

