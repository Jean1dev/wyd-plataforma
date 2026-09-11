"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function LauncherUpload() {
  const [file, setFile] = useState<File>();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true); setProgress(0); setStatus(undefined);
    try {
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", "/api/admin/launcher/upload");
        request.setRequestHeader("Content-Type", "application/zip");
        request.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded * 100 / event.total)); };
        request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`Upload respondeu HTTP ${request.status}.`));
        request.onerror = () => reject(new Error("Falha de rede durante o upload."));
        request.send(file);
      });
      setProgress(100); setStatus("Client publicado. Novas instalações usarão este pacote.");
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  return <section className="wyd-panel" style={{ padding: 24, maxWidth: 720 }}><p style={{ color: "var(--parchment-200)", marginTop: 0 }}>Envie o pacote ZIP que será instalado pelo launcher. O arquivo substitui o pacote anterior no bucket do projeto.</p><input type="file" accept=".zip,application/zip" disabled={busy} onChange={(event) => setFile(event.target.files?.[0])} /><p style={{ minHeight: 24, color: "var(--text-muted)" }}>{file ? `${file.name} — ${(file.size / 1024 / 1024).toFixed(1)} MB` : "Selecione um arquivo .zip"}</p><Button type="button" disabled={!file || busy} onClick={() => void upload()}>{busy ? `Enviando ${progress}%` : "Publicar client"}</Button>{status && <p style={{ color: status.startsWith("Client") ? "var(--emerald-400)" : "var(--red-300)" }}>{status}</p>}</section>;
}
