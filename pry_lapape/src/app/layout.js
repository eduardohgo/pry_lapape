// src/app/layout.js
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Script from "next/script"; // 👈 nuevo import

export const metadata = {
  title: "La Pape",
  description: "Papelería creativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <Script
          id="contentsquare-tag"
          strategy="afterInteractive"
          src="https://t.contentsquare.net/uxa/d6ed8b7dad4d4.js" // 👈 usa aquí exactamente la URL que te dio la página
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

