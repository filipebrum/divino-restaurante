"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { saveClientSession } from "@/lib/admin-fetch";

interface LoginFormProps {
  onAuthenticated?: (user: { name: string; role: string }) => void;
}

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@divinorestaurante.com.br");
  const [password, setPassword] = useState("divino123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusMsg("Autenticando...");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setStatusMsg(null);
        setError(
          `Resposta inesperada do servidor (HTTP ${res.status}). Tente recarregar o preview.`
        );
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg(null);
        setError(data.error || `Falha no login (HTTP ${res.status}).`);
        return;
      }

      if (data.token && data.user) {
        saveClientSession(data.token, {
          name: data.user.name,
          role: data.user.role,
        });
      }

      setStatusMsg("Acesso liberado! Abrindo painel...");

      if (onAuthenticated && data.user) {
        onAuthenticated({ name: data.user.name, role: data.user.role });
        return;
      }

      router.push("/admin");
    } catch (err) {
      setStatusMsg(null);
      setError(
        `Erro de conexão ao autenticar${
          err instanceof Error ? `: ${err.message}` : "."
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      method="POST"
      action="/api/auth/login-form"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {statusMsg && !error && (
        <div className="rounded-xl border border-olive/30 bg-olive/10 px-4 py-2.5 text-xs font-medium text-olive">
          {statusMsg}
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
        >
          E-mail
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink focus:border-terracotta focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
        >
          Senha
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink focus:border-terracotta focus:outline-none"
        />
      </div>

      <button
        type="submit"
        id="admin-login-submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-terracotta disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            Acessar Painel Interno
          </>
        )}
      </button>

      <div className="rounded-xl border border-line-soft bg-paper/60 p-3.5 text-xs text-ink-soft">
        <p className="font-semibold text-ink">Acesso inicial de demonstração:</p>
        <p className="mt-1 font-mono text-[11px]">
          admin@divinorestaurante.com.br · divino123
        </p>
      </div>
    </form>
  );
}
