// src/app/layout.js
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "La Pape",
  description: "Papelería creativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Script de Contentsquare directamente en el head */}
        <script
          id="contentsquare-tag"
          src="https://t.contentsquare.net/uxa/d6ed8b7dad4d.js"
          async
        ></script>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

