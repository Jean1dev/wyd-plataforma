"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@/components/ui";

type Mode = "login" | "register";

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
  const router = useRouter();
  const isRegister = mode === "register";

  function enter(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
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
        <Input label="Usuário" name="user" placeholder="seu_login" autoComplete="username" />
        {isRegister ? (
          <Input label="E-mail" name="email" type="email" placeholder="voce@email.com" autoComplete="email" />
        ) : null}
        <Input label="Senha" name="pass" type="password" placeholder="••••••••" autoComplete="current-password" />
        {isRegister ? (
          <Input label="Confirmar Senha" name="pass2" type="password" placeholder="••••••••" autoComplete="new-password" />
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

        <Button type="submit" size="lg" block>
          {isRegister ? "Forjar minha lenda" : "Entrar no Reino"}
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
