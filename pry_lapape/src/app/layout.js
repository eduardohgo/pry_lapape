import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ClarityTag from "@/components/ClarityTag"; // 👈 IMPORTANTE

export const metadata = {
  title: "La Pape",
  description: "Papelería creativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {/* Inyecta el script de Clarity en TODAS las páginas */}
          <ClarityTag />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

