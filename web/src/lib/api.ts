import { ASSETS } from "./assets";
import { DEMO_EMPRESAS } from "./demoData";
import { getSupabase } from "./supabase";
import type { Empresa, EmpresaStatus } from "./types";

type EmpresaRow = {
  id: number;
  nome: string;
  negocio: string | null;
  localizacao: string | null;
  biografia: string | null;
  status: EmpresaStatus;
  created_at: string | null;
  telefone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  horario_funcionamento: unknown;
  empresa_fotos: { path: string; posicao: number }[];
};

/** Campos extra que a empresa passa a trazer (contactos, horário e data de criação). */
type EmpresaExtra = {
  telefone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  horario_funcionamento: unknown;
  created_at: string | null;
};

type EmpresaInput = {
  nome: string;
  negocio: string | null;
  localizacao: string | null;
  biografia: string | null;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  horario_funcionamento?: unknown;
};

const BUCKET = "empresas";
const MAX_FOTOS = 5;
const EMPRESA_COLUMNS =
  "id, nome, negocio, localizacao, biografia, status, created_at, telefone, email, website, instagram, horario_funcionamento, empresa_fotos(path, posicao)";
const DEMO_PUBLICADAS: Empresa[] = DEMO_EMPRESAS.filter(
  (empresa) => empresa.negocio === "Restaurantes" || empresa.negocio === "Hotéis",
);

function toEmpresa(row: EmpresaRow): Empresa {
  const storage = getSupabase().storage.from(BUCKET);
  const fotos = [...(row.empresa_fotos || [])]
    .sort((a, b) => a.posicao - b.posicao)
    .map(({ path }) => storage.getPublicUrl(path).data.publicUrl);
  const negocio = row.negocio || "Serviços";

  const empresa: Empresa & EmpresaExtra = {
    id: row.id,
    nome: row.nome,
    negocio,
    localizacao: row.localizacao || "",
    biografia: row.biografia || "",
    fotos,
    tags: [],
    preco: "",
    priceLevel: "mid",
    rating: null,
    reviews: 0,
    isDemo: false,
    status: row.status,
    telefone: row.telefone,
    email: row.email,
    website: row.website,
    instagram: row.instagram,
    horario_funcionamento: row.horario_funcionamento,
    created_at: row.created_at,
  };
  return empresa;
}

function readEmpresaInput(formData: FormData): EmpresaInput {
  const input: EmpresaInput = {
    nome: String(formData.get("nome") || "").trim(),
    negocio: String(formData.get("negocio") || "").trim() || null,
    localizacao: String(formData.get("localizacao") || "").trim() || null,
    biografia: String(formData.get("biografia") || "").trim() || null,
  };

  // Campos novos: só entram se vierem no formulário, para não apagar dados quando
  // outro ecrã (ex.: o do administrador) edita a empresa sem os enviar.
  for (const key of ["telefone", "email", "website", "instagram"] as const) {
    if (formData.has(key)) input[key] = String(formData.get(key) || "").trim() || null;
  }
  if (formData.has("horario_funcionamento")) {
    const raw = String(formData.get("horario_funcionamento") || "").trim();
    if (!raw) {
      input.horario_funcionamento = null;
    } else {
      try {
        input.horario_funcionamento = JSON.parse(raw);
      } catch {
        throw new Error("Horário de funcionamento inválido.");
      }
    }
  }
  return input;
}

function readPhotoFiles(formData: FormData): File[] {
  const files = formData.getAll("fotos").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_FOTOS) throw new Error("Uma empresa pode ter no máximo 5 fotos.");
  if (files.some((file) => !file.type.startsWith("image/"))) {
    throw new Error("Só são aceites ficheiros de imagem.");
  }
  return files;
}

async function uploadPhotos(empresaId: number, files: File[]): Promise<string[]> {
  const storage = getSupabase().storage.from(BUCKET);
  const paths: string[] = [];
  try {
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${empresaId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      paths.push(path);
    }
  } catch (error) {
    try {
      await removeStoragePhotos(paths);
    } catch (cleanupError) {
      const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      throw new Error(`O envio das fotos falhou e a limpeza dos ficheiros temporários também: ${cleanupMessage}`);
    }
    throw error;
  }
  return paths;
}

async function removeStoragePhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await getSupabase().storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

async function listEmpresaRows(publicadasOnly: boolean, donoId?: string): Promise<Empresa[]> {
  let query = getSupabase()
    .from("empresas")
    .select(EMPRESA_COLUMNS)
    .order("created_at", { ascending: false });
  if (publicadasOnly) query = query.eq("status", "publicada");
  if (donoId) query = query.eq("dono_id", donoId);

  const { data, error } = await query;
  if (error) throw error;
  return ((data || []) as unknown as EmpresaRow[]).map(toEmpresa);
}

export async function listarEmpresas(): Promise<Empresa[]> {
  try {
    const empresas = await listEmpresaRows(false);
    return empresas.length > 0 ? empresas : DEMO_PUBLICADAS;
  } catch {
    return DEMO_PUBLICADAS;
  }
}

/**
 * Empresas do utilizador com sessão iniciada (painel do proprietário).
 * Ao contrário de `listarEmpresas`, nunca devolve dados de demonstração:
 * quem ainda não criou nenhuma empresa vê uma lista vazia.
 */
export async function listarMinhasEmpresas(): Promise<Empresa[]> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user) return [];
  return listEmpresaRows(false, data.user.id);
}

export async function listarEmpresasPublicadas(): Promise<Empresa[]> {
  try {
    const empresas = await listEmpresaRows(true);
    return empresas.length > 0 ? empresas : DEMO_PUBLICADAS;
  } catch {
    return DEMO_PUBLICADAS;
  }
}

export async function criarEmpresa(formData: FormData): Promise<Empresa> {
  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Inicia sessão para cadastrar uma empresa.");

  const files = readPhotoFiles(formData);
  const { data, error } = await supabase
    .from("empresas")
    .insert({ ...readEmpresaInput(formData), dono_id: authData.user.id, status: "pendente" })
    .select("id")
    .single();
  if (error) throw error;

  let uploadedPaths: string[] = [];
  try {
    uploadedPaths = await uploadPhotos(data.id, files);
    if (uploadedPaths.length > 0) {
      const { error: photosError } = await supabase.from("empresa_fotos").insert(
        uploadedPaths.map((path, index) => ({ empresa_id: data.id, path, posicao: index + 1 })),
      );
      if (photosError) throw photosError;
    }
  } catch (error) {
    let storageCleanupError: unknown;
    try {
      await removeStoragePhotos(uploadedPaths);
    } catch (cleanupError) {
      storageCleanupError = cleanupError;
    }
    const { error: rollbackError } = await supabase.from("empresas").delete().eq("id", data.id);
    const cleanupMessage =
      storageCleanupError instanceof Error ? storageCleanupError.message : storageCleanupError ? String(storageCleanupError) : "";
    const rollbackMessage = rollbackError?.message || "";
    if (cleanupMessage || rollbackMessage) {
      throw new Error(
        `Falha ao concluir o cadastro. Limpeza de fotos: ${cleanupMessage || "concluída"}. Anulação da empresa: ${rollbackMessage || "concluída"}.`,
      );
    }
    throw error;
  }

  const saved = await listEmpresaRows(false);
  const empresa = saved.find((item) => item.id === data.id);
  if (!empresa) throw new Error("A empresa foi criada, mas não foi possível recarregá-la.");
  return empresa;
}

export async function atualizarEmpresa(id: number | string, formData: FormData): Promise<Empresa> {
  const supabase = getSupabase();
  const empresaId = Number(id);
  if (!Number.isInteger(empresaId)) throw new Error("Identificador de empresa inválido.");
  const files = readPhotoFiles(formData);
  const replaceAllPhotos = formData.get("substituir_fotos") === "on";
  const { data: oldPhotos, error: oldPhotosError } = files.length
    ? await supabase.from("empresa_fotos").select("path, posicao").eq("empresa_id", empresaId)
    : { data: [], error: null };
  if (oldPhotosError) throw oldPhotosError;
  const existingPhotos = oldPhotos || [];
  const freePositions = replaceAllPhotos
    ? Array.from({ length: MAX_FOTOS }, (_, index) => index + 1)
    : Array.from({ length: MAX_FOTOS }, (_, index) => index + 1).filter(
        (position) => !existingPhotos.some((photo) => photo.posicao === position),
      );
  if (files.length > freePositions.length) {
    throw new Error(
      replaceAllPhotos
        ? "Uma empresa pode ter no máximo 5 fotos."
        : "Não há espaço para tantas fotos novas. Marca a opção para substituir as fotos atuais.",
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("empresas")
    .update(readEmpresaInput(formData))
    .eq("id", empresaId)
    .select("id")
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) throw new Error("Empresa não encontrada ou sem permissão para editar.");

  if (files.length > 0) {
    const newPaths = await uploadPhotos(empresaId, files);
    const photoRows = newPaths.map((path, index) => ({
      empresa_id: empresaId,
      path,
      posicao: freePositions[index],
    }));

    if (replaceAllPhotos) {
      const { error: deleteOldError } = await supabase.from("empresa_fotos").delete().eq("empresa_id", empresaId);
      if (deleteOldError) {
        await removeStoragePhotos(newPaths);
        throw deleteOldError;
      }
    }

    const { error: savePhotosError } = await supabase.from("empresa_fotos").insert(photoRows);
    if (savePhotosError) {
      await removeStoragePhotos(newPaths);
      if (replaceAllPhotos && existingPhotos.length > 0) {
        const { error: restoreError } = await supabase.from("empresa_fotos").insert(
          existingPhotos.map((photo) => ({ ...photo, empresa_id: empresaId })),
        );
        if (restoreError) {
          throw new Error(`Falha ao guardar fotos (${savePhotosError.message}) e restaurar as anteriores (${restoreError.message}).`);
        }
      }
      throw savePhotosError;
    }

    if (replaceAllPhotos) {
      try {
        await removeStoragePhotos(existingPhotos.map((photo) => photo.path));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`As novas fotos foram guardadas, mas não foi possível apagar as versões antigas: ${message}`);
      }
    }
  }

  const saved = await listEmpresaRows(false);
  const empresa = saved.find((item) => item.id === empresaId);
  if (!empresa) throw new Error("A empresa foi atualizada, mas não foi possível recarregá-la.");
  return empresa;
}

export async function atualizarEstadoEmpresa(id: number | string, status: EmpresaStatus): Promise<void> {
  const { data, error } = await getSupabase()
    .from("empresas")
    .update({ status })
    .eq("id", Number(id))
    .select("status")
    .single();
  if (error) throw error;
  if (data.status !== status) throw new Error("Só um administrador pode alterar o estado de publicação.");
}

export async function eliminarEmpresa(id: number | string): Promise<void> {
  const supabase = getSupabase();
  const empresaId = Number(id);
  if (!Number.isInteger(empresaId)) throw new Error("Identificador de empresa inválido.");

  const { data: photos, error: photosError } = await supabase
    .from("empresa_fotos")
    .select("path")
    .eq("empresa_id", empresaId);
  if (photosError) throw photosError;

  await removeStoragePhotos((photos || []).map((photo) => photo.path));
  const { data, error } = await supabase.from("empresas").delete().eq("id", empresaId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Empresa não encontrada ou sem permissão para eliminar.");
}

export function photoUrl(fotos: string[] | string | null | undefined): string {
  const first = Array.isArray(fotos) ? fotos[0] : fotos;
  return first || ASSETS.restaurante;
}

export function allPhotoUrls(fotos: string[] | string | null | undefined): string[] {
  if (!Array.isArray(fotos) || fotos.length === 0) return [photoUrl(fotos)];
  return fotos;
}