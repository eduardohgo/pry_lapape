// src/components/ClarityTag.jsx
"use client";

import { useEffect } from "react";

export default function ClarityTag() {
  useEffect(() => {
    // Si ya existe, no lo volvemos a insertar
    if (window.clarity) return;

    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", "uf9fnd4t1s"); // 👈 TU ID

  }, []);

  // No muestra nada en la UI
  return null;
}
