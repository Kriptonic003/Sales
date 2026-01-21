import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export function formatError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.detail || err.message;
  }
  return "Unexpected error";
}

