// src/app/layout.js
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Script from "next/script"; // 👈 IMPORTANTE

export const metadata = {
  title: "La Pape",
  description: "Papelería creativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Tag de Contentsquare */}
        <Script
          id="contentsquare-tag"
          strategy="afterInteractive"
          src="https://t.contentsquare.net/uxa/d6ed8b7dad4d.js" // 👈 usa AQUÍ exactamente la URL que te sale en “Tag installation”
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

