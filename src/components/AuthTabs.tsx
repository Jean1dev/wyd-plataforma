"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@/components/ui";

type Mode = "login" | "register";
type FormStatus = "idle" | "submitting";

const errorMessages: Record<string, string> = {
  blocked: "Esta conta esta bloqueada.",
  invalid_credentials: "Usuario ou senha invalidos.",
  invalid_input: "Confira usuario, senha e e-mail.",
  name_taken: "Este usuario ja esta em uso.",
  password_mismatch: "As senhas nao conferem.",
  terms_required: "Aceite os termos para criar a conta.",
  service_unavailable: "Servico indisponivel. Tente novamente em instantes.",
};

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "10px 0",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "16px",
    color: active ? "var(--gold-400)" : "var(--text-faint)",
    borderBottom: active ? "2px solid var(--gold-500)" : "2px solid transparent",
    marginBottom: "-1px",
  };
}

export function AuthTabs() {
  const [mode, setMode] = useState<Mode>("login");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isRegister = mode === "register";

  async function enter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");

    if (isRegister) {
      const passwordConfirm = String(form.get("passwordConfirm") ?? "");
      if (password !== passwordConfirm) {
        setError("password_mismatch");
        return;
      }

      if (form.get("terms") !== "on") {
        setError("terms_required");
        return;
      }
    }

    setStatus("submitting");
    const response = await fetch(isRegister ? "/api/signup" : "/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        password,
        email: isRegister ? form.get("email") : undefined,
      }),
    }).catch(() => null);

    setStatus("idle");

    if (!response?.ok) {
      const payload = (await response?.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "service_unavailable");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        background: "var(--grad-panel)",
        border: "2px solid var(--gold-600)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--glow-gold), var(--shadow-xl)",
        padding: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          marginBottom: 22,
          borderBottom: "1px solid var(--iron-400)",
        }}
      >
        <button type="button" onClick={() => setMode("login")} style={tabStyle(!isRegister)}>
          Entrar
        </button>
        <button type="button" onClick={() => setMode("register")} style={tabStyle(isRegister)}>
          Criar Conta
        </button>
      </div>

      <form onSubmit={enter} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input label="Usuario" name="name" placeholder="seu_login" autoComplete="username" required minLength={4} maxLength={12} pattern="[A-Za-z0-9]+" />
        {isRegister ? (
          <Input label="E-mail" name="email" type="email" placeholder="voce@email.com" autoComplete="email" />
        ) : null}
        <Input label="Senha" name="password" type="password" placeholder="********" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={4} />
        {isRegister ? (
          <Input label="Confirmar Senha" name="passwordConfirm" type="password" placeholder="********" autoComplete="new-password" required minLength={4} />
        ) : null}

        {isRegister ? (
          <Checkbox label="Aceito os termos e o código do reino" name="terms" defaultChecked />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Checkbox label="Lembrar de mim" name="remember" defaultChecked />
            <a href="#" style={{ fontFamily: "var(--font-body)", fontSize: 13 }}>
              Esqueci a senha
            </a>
          </div>
        )}

        {error ? (
          <div
            role="alert"
            style={{
              border: "1px solid rgba(199, 74, 74, 0.55)",
              background: "rgba(88, 24, 24, 0.35)",
              borderRadius: "var(--radius-sm)",
              color: "#ffd6cf",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              padding: "10px 12px",
            }}
          >
            {errorMessages[error] ?? errorMessages.service_unavailable}
          </div>
        ) : null}

        <Button type="submit" size="lg" block disabled={status === "submitting"}>
          {status === "submitting" ? "Aguarde..." : isRegister ? "Forjar minha lenda" : "Entrar no Reino"}
        </Button>
        <div className="wyd-divider">
          <span>ou</span>
        </div>
        <Button href="/download" variant="steel" block>
          Baixar o Jogo
        </Button>
      </form>
    </div>
  );
}

export default AuthTabs;
