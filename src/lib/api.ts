import axios from "axios";

// Centralized API client. Stub instance with request interceptor that
// attaches a mock bearer token from localStorage.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Serialize a JS Date to a clean local ISO string (YYYY-MM-DDTHH:mm:ss)
// without timezone suffix to match backend expectations.
export function toIsoLocal(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Build a FormData object for multipart uploads. The file is appended under
// the "file" key to match backend multipart/form-data contracts.
export function buildFileFormData(file: File, extra?: Record<string, string>) {
  const fd = new FormData();
  fd.append("file", file);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  }
  return fd;
}

export type FieldErrorMap = Record<string, string>;

// Normalizes server-side validation errors. Backends may return
// { errors: { field: "msg" } } or a flat map; we accept both.
export function parseFieldErrors(payload: unknown): FieldErrorMap {
  if (!payload || typeof payload !== "object") return {};
  const obj = payload as Record<string, unknown>;
  const raw = (obj.errors && typeof obj.errors === "object" ? obj.errors : obj) as Record<string, unknown>;
  const out: FieldErrorMap = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
    else if (Array.isArray(v) && typeof v[0] === "string") out[k] = v[0] as string;
  }
  return out;
}
