"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  adminFetch,
  clearClientAuthToken,
  getClientAuthToken,
  getClientUser,
} from "@/lib/admin-fetch";
import { AdminShell } from "@/components/admin/AdminShell";
import { LoginForm } from "@/components/admin/LoginForm";

interface SessionUser {
  name: string;
  role: string;
}

export function AdminSessionGate({
  initialUser,
  children,
}: {
  initialUser: SessionUser | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  // Restaura sessão em memória/sessionStorage imediatamente ao montar e valida com o servidor
  useEffect(() => {
    if (initialUser) return;
    const token = getClientAuthToken();
    if (!token) return;

    let active = true;
    const cachedUser = getClientUser();

    adminFetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.authenticated && data.user) {
          setUser({ name: data.user.name, role: data.user.role });
        } else if (cachedUser && data?.authenticated !== false) {
          setUser(cachedUser);
        } else {
          clearClientAuthToken();
        }
      })
      .catch(() => {
        if (active && cachedUser) {
          setUser(cachedUser);
        }
      });

    return () => {
      active = false;
    };
  }, [initialUser]);

  if (!user) {
    return (
      <div className="editorial-texture flex min-h-screen flex-col items-center justify-center bg-canvas px-5 py-12">
        <div className="w-full max-w-md space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-terracotta"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao site do restaurante
          </Link>

          <div className="rounded-3xl border border-line bg-card p-8 shadow-[0_18px_45px_-28px_rgba(31,25,20,0.22)]">
            <div className="mb-7">
              <Image
                src="/images/divino-logo.png"
                alt="diVino Restaurante"
                width={165}
                height={73}
                priority
                className="h-14 w-auto object-contain"
              />
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                Sistema Interno
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
                Acesso da Equipe
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                Gerencie reservas, cardápio digital, fechamento de mesas e o
                financeiro.
              </p>
            </div>

            <LoginForm onAuthenticated={(loggedUser) => setUser(loggedUser)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      userName={user.name}
      userRole={user.role}
      onLogout={() => setUser(null)}
    >
      {children}
    </AdminShell>
  );
}
