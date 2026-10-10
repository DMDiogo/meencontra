import { ASSETS } from "./assets";

const API = "/api";

export function photoUrl(fotos) {
  const first = Array.isArray(fotos) ? fotos[0] : fotos;
  if (!first) return ASSETS.restaurante;
  if (typeof first === "string" && first.startsWith("http")) return first;
  if (typeof first === "string" && first.startsWith("/")) return first;
  return `/uploads/${first}`;
}

export function allPhotoUrls(fotos) {
  if (!Array.isArray(fotos) || fotos.length === 0) return [photoUrl(fotos)];
  return fotos.map((f) => {
    if (typeof f === "string" && (f.startsWith("http") || f.startsWith("/"))) return f;
    return `/uploads/${f}`;
  });
}

export async function listarEmpresas() {
  const res = await fetch(`${API}/empresas`);
  if (!res.ok) throw new Error("Erro ao listar empresas");
  return res.json();
}

export async function criarEmpresa(formData) {
  const res = await fetch(`${API}/empresas`, { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || "Erro ao cadastrar empresa");
  return data;
}

export async function atualizarEmpresa(id, formData) {
  const res = await fetch(`${API}/empresas/${id}`, { method: "PUT", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erro ao atualizar empresa");
  return data;
}

export async function eliminarEmpresa(id) {
  const res = await fetch(`${API}/empresas/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erro ao eliminar empresa");
  return data;
}

export async function loginAdmin(username, password) {
  const res = await fetch(`${API}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Credenciais inválidas");
  return data;
}
