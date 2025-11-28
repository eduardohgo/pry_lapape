export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());

export const isStrongPassword = (value) => typeof value === "string" && value.length >= 8;

export const isValidRole = (value) =>
  ["CLIENTE", "TRABAJADOR", "DUENO", "ADMIN"].includes((value || "").toUpperCase());

export const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
