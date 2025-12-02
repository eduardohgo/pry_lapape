// src/app/layout.js
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ContentsquareTag from "@/components/ContentsquareTag"; // 👈 IMPORTANTE

export const metadata = {
  title: "La Pape",
  description: "Papelería creativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {/* Inyecta el script de Contentsquare en el <head> */}
          <ContentsquareTag />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
  
}
