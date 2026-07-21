"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";
import {
  Crosshair,
  Download,
  Eye,
  Move,
  RefreshCw,
  RotateCcw,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button, Checkbox, Input } from "@/components/ui";
import {
  ATTRIBUTE_MAP_DIM,
  ATTRIBUTE_MAP_SIZE,
  ATTRIBUTE_MAP_WORLD_MAX,
  ATTRIBUTE_MAP_WORLD_SCALE,
  type AttributeMapInfo,
  type AttributeMapRect,
  type AttributeMapTransformOperation,
  type AttributeMapTransformResult,
  type AttributeMapValueCount,
} from "@/lib/attribute-map/types";

type LoadStatus = "idle" | "loading" | "ok" | "forbidden" | "invalid" | "upstream" | "error";
type PreviewMode = "current" | "generated";
type PointerDrag =
  | { mode: "pan"; pointerId: number; startX: number; startY: number; centerX: number; centerY: number }
  | { mode: "select"; pointerId: number; startCellX: number; startCellY: number };

type HoverCell = {
  cellX: number;
  cellY: number;
  value: number;
};

const OPERATIONS: { value: AttributeMapTransformOperation; label: string; operandLabel: string }[] = [
  {
    value: "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS",
    label: "Regra legado PvP/XP",
    operandLabel: "Ignorado",
  },
  {
    value: "ATTRIBUTE_MAP_TRANSFORM_OPERATION_ASSIGN_VALUE",
    label: "Definir valor",
    operandLabel: "Valor",
  },
  {
    value: "ATTRIBUTE_MAP_TRANSFORM_OPERATION_SET_BITS",
    label: "Marcar bits",
    operandLabel: "Máscara",
  },
  {
    value: "ATTRIBUTE_MAP_TRANSFORM_OPERATION_CLEAR_BITS",
    label: "Limpar bits",
    operandLabel: "Máscara",
  },
  {
    value: "ATTRIBUTE_MAP_TRANSFORM_OPERATION_TOGGLE_BITS",
    label: "Alternar bits",
    operandLabel: "Máscara",
  },
];

const panel: CSSProperties = {
  background: "var(--grad-panel)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--bevel-raise), var(--shadow-md)",
  overflow: "hidden",
};

const panelPad: CSSProperties = { padding: 18 };

const panelTitle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--gold-300)",
  margin: 0,
};

const muted: CSSProperties = {
  color: "var(--text-muted)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  lineHeight: 1.45,
};

const mono: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
};

const fieldGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
  gap: 12,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: 42,
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-base)",
  color: "var(--parchment-100)",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "var(--bevel-in)",
  padding: "9px 11px",
};

const iconButton: CSSProperties = {
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--iron-400)",
  background: "var(--surface-inset)",
  color: "var(--gold-300)",
  cursor: "pointer",
};

function statusMessage(status: LoadStatus) {
  if (status === "loading") return "Carregando AttributeMap.dat...";
  if (status === "forbidden") return "Acesso restrito a moderadores.";
  if (status === "invalid") return "AttributeMap.dat indisponível, ausente ou com tamanho diferente de 1024x1024.";
  if (status === "upstream") return "web-api indisponível. Tente novamente em instantes.";
  if (status === "error") return "Não foi possível carregar o mapa.";
  return "";
}

function statusFromHttp(status: number): LoadStatus {
  if (status === 403) return "forbidden";
  if (status === 422) return "invalid";
  if (status === 502) return "upstream";
  return "error";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cellToWorldStart(cell: number) {
  return clamp(cell * ATTRIBUTE_MAP_WORLD_SCALE, 0, ATTRIBUTE_MAP_WORLD_MAX);
}

function cellToWorldEnd(cell: number) {
  return clamp(cell * ATTRIBUTE_MAP_WORLD_SCALE + ATTRIBUTE_MAP_WORLD_SCALE - 1, 0, ATTRIBUTE_MAP_WORLD_MAX);
}

function rectToCellBounds(rect: AttributeMapRect) {
  return {
    minCellX: Math.floor(rect.min_x / ATTRIBUTE_MAP_WORLD_SCALE),
    minCellY: Math.floor(rect.min_y / ATTRIBUTE_MAP_WORLD_SCALE),
    maxCellX: Math.floor(rect.max_x / ATTRIBUTE_MAP_WORLD_SCALE),
    maxCellY: Math.floor(rect.max_y / ATTRIBUTE_MAP_WORLD_SCALE),
  };
}

function rectFromCells(aX: number, aY: number, bX: number, bY: number): AttributeMapRect {
  const minCellX = clamp(Math.min(aX, bX), 0, ATTRIBUTE_MAP_DIM - 1);
  const minCellY = clamp(Math.min(aY, bY), 0, ATTRIBUTE_MAP_DIM - 1);
  const maxCellX = clamp(Math.max(aX, bX), 0, ATTRIBUTE_MAP_DIM - 1);
  const maxCellY = clamp(Math.max(aY, bY), 0, ATTRIBUTE_MAP_DIM - 1);
  return {
    min_x: cellToWorldStart(minCellX),
    min_y: cellToWorldStart(minCellY),
    max_x: cellToWorldEnd(maxCellX),
    max_y: cellToWorldEnd(maxCellY),
  };
}

function valueColor(value: number): [number, number, number, number] {
  if (value === 1) return [47, 107, 69, 255];
  if ((value & 64) === 64) return [176, 58, 54, 255];
  if ((value & 128) === 128) return [91, 143, 176, 255];
  if ((value & 4) === 4) return [200, 163, 91, 255];
  if (value === 0) return [34, 44, 36, 255];

  const hue = (value * 47) % 360;
  const c = 0.42;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = 0.24;
  const [r, g, b] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), 255];
}

function valueCss(value: number) {
  const [r, g, b] = valueColor(value);
  return `rgb(${r}, ${g}, ${b})`;
}

function bytesFromBase64(dataBase64: string) {
  const raw = atob(dataBase64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function meaningLabel(value: number, info: AttributeMapInfo | null) {
  const exact = info?.meanings.find((meaning) => !meaning.bit && meaning.value === value);
  if (exact) return exact.name;
  const bits = info?.meanings.filter((meaning) => meaning.bit && (value & meaning.value) === meaning.value) ?? [];
  if (bits.length > 0) return bits.map((meaning) => meaning.name).join(" + ");
  return "Conteúdo legado";
}

function binaryByte(value: number) {
  return value.toString(2).padStart(8, "0");
}

function HistogramGrid({ histogram, info }: { histogram: AttributeMapValueCount[]; info: AttributeMapInfo | null }) {
  const max = Math.max(1, ...histogram.map((bucket) => bucket.count));
  const top = useMemo(
    () =>
      [...histogram]
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .filter((bucket) => bucket.count > 0),
    [histogram],
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
          gap: 3,
        }}
      >
        {histogram.map((bucket) => {
          const opacity = bucket.count === 0 ? 0.22 : 0.35 + 0.65 * Math.log1p(bucket.count) / Math.log1p(max);
          return (
            <span
              key={bucket.value}
              title={`${bucket.value} - ${bucket.count.toLocaleString("pt-BR")} - ${meaningLabel(bucket.value, info)}`}
              style={{
                height: 12,
                borderRadius: 2,
                background: valueCss(bucket.value),
                opacity,
                border: bucket.count > 0 ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.04)",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {top.map((bucket) => (
          <div
            key={bucket.value}
            style={{
              display: "grid",
              gridTemplateColumns: "46px 1fr 82px",
              alignItems: "center",
              gap: 8,
              ...mono,
              color: "var(--text-body)",
            }}
          >
            <span style={{ color: "var(--gold-300)" }}>{bucket.value}</span>
            <span
              style={{
                height: 8,
                borderRadius: "var(--radius-pill)",
                background: "var(--surface-inset)",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: `${Math.max(1, (bucket.count / max) * 100)}%`,
                  height: "100%",
                  background: valueCss(bucket.value),
                }}
              />
            </span>
            <span style={{ textAlign: "right", color: "var(--text-muted)" }}>
              {bucket.count.toLocaleString("pt-BR")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeltaList({ result }: { result: AttributeMapTransformResult }) {
  const deltas = result.afterHistogram
    .map((after, index) => ({ value: after.value, delta: after.count - (result.beforeHistogram[index]?.count ?? 0) }))
    .filter((entry) => entry.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 8);

  if (deltas.length === 0) {
    return <div style={muted}>Histograma sem alteração líquida.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 7 }}>
      {deltas.map((entry) => (
        <div
          key={entry.value}
          style={{
            display: "grid",
            gridTemplateColumns: "46px 1fr",
            gap: 10,
            alignItems: "center",
            ...mono,
          }}
        >
          <span style={{ color: "var(--gold-300)" }}>{entry.value}</span>
          <span style={{ color: entry.delta > 0 ? "var(--emerald-400)" : "var(--blood-400)" }}>
            {entry.delta > 0 ? "+" : ""}
            {entry.delta.toLocaleString("pt-BR")}
          </span>
        </div>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </span>
  );
}

export function AttributeMapTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<PointerDrag | null>(null);

  const [status, setStatus] = useState<LoadStatus>("idle");
  const [info, setInfo] = useState<AttributeMapInfo | null>(null);
  const [mapBytes, setMapBytes] = useState<Uint8Array | null>(null);
  const [generatedBytes, setGeneratedBytes] = useState<Uint8Array | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("current");
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 640 });
  const [view, setView] = useState({ centerX: ATTRIBUTE_MAP_DIM / 2, centerY: ATTRIBUTE_MAP_DIM / 2, zoom: 1 });
  const [hover, setHover] = useState<HoverCell | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [rectEnabled, setRectEnabled] = useState(false);
  const [rect, setRect] = useState<AttributeMapRect>({ min_x: 0, min_y: 0, max_x: 511, max_y: 511 });
  const [operation, setOperation] = useState<AttributeMapTransformOperation>(
    "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS",
  );
  const [operand, setOperand] = useState("64");
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [filterMode, setFilterMode] = useState<"exact" | "mask">("exact");
  const [exactValue, setExactValue] = useState("0");
  const [maskValue, setMaskValue] = useState("64");
  const [matchValue, setMatchValue] = useState("0");
  const [transformStatus, setTransformStatus] = useState<LoadStatus>("idle");
  const [transformResult, setTransformResult] = useState<AttributeMapTransformResult | null>(null);

  const activeOperation = OPERATIONS.find((op) => op.value === operation) ?? OPERATIONS[0];
  const isLegacy = operation === "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS";
  const selectedBytes = previewMode === "generated" ? generatedBytes : mapBytes;
  const histogram = transformResult && previewMode === "generated" ? transformResult.afterHistogram : info?.histogram ?? [];
  const visibleSha256 = previewMode === "generated" ? transformResult?.newSha256 : info?.sha256;

  const transform = useMemo(() => {
    const baseScale = Math.min(canvasSize.width, canvasSize.height) / ATTRIBUTE_MAP_DIM;
    const scale = baseScale * view.zoom;
    const destX = canvasSize.width / 2 - view.centerX * scale;
    const destY = canvasSize.height / 2 - view.centerY * scale;
    return { baseScale, scale, destX, destY };
  }, [canvasSize.height, canvasSize.width, view.centerX, view.centerY, view.zoom]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const source = imageCanvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(canvasSize.width));
    const height = Math.max(1, Math.floor(canvasSize.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10, 8, 5, 0.92)";
    ctx.fillRect(0, 0, width, height);

    if (!source) {
      ctx.fillStyle = "rgba(221, 202, 164, 0.55)";
      ctx.font = "14px var(--font-body)";
      ctx.textAlign = "center";
      ctx.fillText(statusMessage(status) || "Mapa não carregado.", width / 2, height / 2);
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      source,
      transform.destX,
      transform.destY,
      ATTRIBUTE_MAP_DIM * transform.scale,
      ATTRIBUTE_MAP_DIM * transform.scale,
    );

    if (rectEnabled) {
      const cells = rectToCellBounds(rect);
      const x = transform.destX + cells.minCellX * transform.scale;
      const y = transform.destY + cells.minCellY * transform.scale;
      const w = (cells.maxCellX - cells.minCellX + 1) * transform.scale;
      const h = (cells.maxCellY - cells.minCellY + 1) * transform.scale;
      ctx.fillStyle = "rgba(200, 163, 91, 0.12)";
      ctx.strokeStyle = "rgba(236, 214, 164, 0.95)";
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    }

    if (hover && transform.scale >= 3) {
      ctx.strokeStyle = "rgba(174, 209, 228, 0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        transform.destX + hover.cellX * transform.scale,
        transform.destY + hover.cellY * transform.scale,
        transform.scale,
        transform.scale,
      );
    }
  }, [canvasSize.height, canvasSize.width, hover, rect, rectEnabled, status, transform]);

  const rebuildImage = useCallback((bytes: Uint8Array | null) => {
    if (!bytes || bytes.length !== ATTRIBUTE_MAP_SIZE) {
      imageCanvasRef.current = null;
      return;
    }

    const imageCanvas = document.createElement("canvas");
    imageCanvas.width = ATTRIBUTE_MAP_DIM;
    imageCanvas.height = ATTRIBUTE_MAP_DIM;
    const ctx = imageCanvas.getContext("2d");
    if (!ctx) return;

    const image = ctx.createImageData(ATTRIBUTE_MAP_DIM, ATTRIBUTE_MAP_DIM);
    for (let i = 0; i < bytes.length; i += 1) {
      const [r, g, b, a] = valueColor(bytes[i]);
      const offset = i * 4;
      image.data[offset] = r;
      image.data[offset + 1] = g;
      image.data[offset + 2] = b;
      image.data[offset + 3] = a;
    }
    ctx.putImageData(image, 0, 0);
    imageCanvasRef.current = imageCanvas;
  }, []);

  const loadMap = useCallback(async () => {
    setStatus("loading");
    setTransformResult(null);
    setGeneratedBytes(null);
    setPreviewMode("current");

    try {
      const [infoRes, dataRes] = await Promise.all([
        fetch("/api/admin/attribute-map/info", { cache: "no-store" }),
        fetch("/api/admin/attribute-map/data", { cache: "no-store" }),
      ]);

      if (!infoRes.ok) {
        setStatus(statusFromHttp(infoRes.status));
        setInfo(null);
        setMapBytes(null);
        return;
      }
      if (!dataRes.ok) {
        setStatus(statusFromHttp(dataRes.status));
        setInfo(null);
        setMapBytes(null);
        return;
      }

      const infoJson = (await infoRes.json().catch(() => ({}))) as { info?: AttributeMapInfo };
      const buffer = await dataRes.arrayBuffer();
      if (buffer.byteLength !== ATTRIBUTE_MAP_SIZE) {
        setStatus("error");
        setMapBytes(null);
        return;
      }

      setInfo(infoJson.info ?? null);
      setMapBytes(new Uint8Array(buffer));
      setView({ centerX: ATTRIBUTE_MAP_DIM / 2, centerY: ATTRIBUTE_MAP_DIM / 2, zoom: 1 });
      setStatus("ok");
    } catch {
      setStatus("upstream");
      setInfo(null);
      setMapBytes(null);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMap(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMap]);

  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(260, Math.floor(entry.contentRect.width));
      setCanvasSize({ width, height: width });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    rebuildImage(selectedBytes);
    drawCanvas();
  }, [drawCanvas, rebuildImage, selectedBytes]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  function pointFromEvent(e: ReactPointerEvent<HTMLCanvasElement> | WheelEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
  }

  function cellFromPoint(point: { x: number; y: number }) {
    const cellX = Math.floor((point.x - transform.destX) / transform.scale);
    const cellY = Math.floor((point.y - transform.destY) / transform.scale);
    if (cellX < 0 || cellY < 0 || cellX >= ATTRIBUTE_MAP_DIM || cellY >= ATTRIBUTE_MAP_DIM) return null;
    return { cellX, cellY };
  }

  function updateHover(e: ReactPointerEvent<HTMLCanvasElement>) {
    const point = pointFromEvent(e);
    const bytes = selectedBytes;
    if (!point || !bytes) {
      setHover(null);
      return null;
    }
    const cell = cellFromPoint(point);
    if (!cell) {
      setHover(null);
      return null;
    }
    const value = bytes[cell.cellY * ATTRIBUTE_MAP_DIM + cell.cellX];
    setHover({ ...cell, value });
    return cell;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const cell = updateHover(e);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (selectMode && cell) {
      dragRef.current = { mode: "select", pointerId: e.pointerId, startCellX: cell.cellX, startCellY: cell.cellY };
      setRectEnabled(true);
      setRect(rectFromCells(cell.cellX, cell.cellY, cell.cellX, cell.cellY));
      return;
    }

    const point = pointFromEvent(e);
    if (!point) return;
    dragRef.current = {
      mode: "pan",
      pointerId: e.pointerId,
      startX: point.x,
      startY: point.y,
      centerX: view.centerX,
      centerY: view.centerY,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const cell = updateHover(e);
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    if (drag.mode === "select") {
      if (cell) setRect(rectFromCells(drag.startCellX, drag.startCellY, cell.cellX, cell.cellY));
      return;
    }

    const point = pointFromEvent(e);
    if (!point) return;
    const nextCenterX = drag.centerX - (point.x - drag.startX) / transform.scale;
    const nextCenterY = drag.centerY - (point.y - drag.startY) / transform.scale;
    setView((current) => ({
      ...current,
      centerX: clamp(nextCenterX, 0, ATTRIBUTE_MAP_DIM),
      centerY: clamp(nextCenterY, 0, ATTRIBUTE_MAP_DIM),
    }));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }

  function onWheel(e: WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const point = pointFromEvent(e);
    if (!point) return;

    const currentScale = transform.scale;
    const mapX = view.centerX + (point.x - canvasSize.width / 2) / currentScale;
    const mapY = view.centerY + (point.y - canvasSize.height / 2) / currentScale;
    const nextZoom = clamp(view.zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2), 1, 64);
    const nextScale = transform.baseScale * nextZoom;

    setView({
      zoom: nextZoom,
      centerX: clamp(mapX - (point.x - canvasSize.width / 2) / nextScale, 0, ATTRIBUTE_MAP_DIM),
      centerY: clamp(mapY - (point.y - canvasSize.height / 2) / nextScale, 0, ATTRIBUTE_MAP_DIM),
    });
  }

  function zoomBy(factor: number) {
    setView((current) => ({ ...current, zoom: clamp(current.zoom * factor, 1, 64) }));
  }

  function resetView() {
    setView({ centerX: ATTRIBUTE_MAP_DIM / 2, centerY: ATTRIBUTE_MAP_DIM / 2, zoom: 1 });
  }

  function updateRectField(field: keyof AttributeMapRect, value: string) {
    const numeric = Number(value);
    if (!Number.isInteger(numeric)) return;
    setRect((current) => ({ ...current, [field]: clamp(numeric, 0, ATTRIBUTE_MAP_WORLD_MAX) }));
  }

  async function submitTransform(e: FormEvent) {
    e.preventDefault();
    setTransformStatus("loading");

    const payload = {
      operation,
      operand: isLegacy ? 0 : Number(operand),
      ...(rectEnabled ? { rect } : {}),
      ...(filterEnabled
        ? {
            filter:
              filterMode === "exact"
                ? { enabled: true, exact_value: Number(exactValue), mask: 0, match_value: 0 }
                : { enabled: true, exact_value: 0, mask: Number(maskValue), match_value: Number(matchValue) },
          }
        : {}),
    };

    try {
      const res = await fetch("/api/admin/attribute-map/transform", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as AttributeMapTransformResult;
      if (!res.ok) {
        setTransformStatus(statusFromHttp(res.status));
        return;
      }

      const bytes = bytesFromBase64(data.dataBase64);
      if (bytes.length !== ATTRIBUTE_MAP_SIZE) {
        setTransformStatus("error");
        return;
      }

      setGeneratedBytes(bytes);
      setTransformResult(data);
      setPreviewMode("generated");
      setTransformStatus("ok");
    } catch {
      setTransformStatus("upstream");
    }
  }

  const hoverWorld = hover
    ? {
        minX: cellToWorldStart(hover.cellX),
        minY: cellToWorldStart(hover.cellY),
        maxX: cellToWorldEnd(hover.cellX),
        maxY: cellToWorldEnd(hover.cellY),
      }
    : null;
  const selectedCells = rectToCellBounds(rect);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
        gap: 18,
      }}
    >
      <section style={panel}>
        <div
          style={{
            ...panelPad,
            borderBottom: "1px solid var(--iron-400)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={panelTitle}>Mapa</h2>
            <span style={{ ...mono, color: previewMode === "generated" ? "var(--steel-300)" : "var(--text-muted)" }}>
              {previewMode === "generated" ? "Prévia gerada" : "Arquivo atual"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button type="button" title="Mover" onClick={() => setSelectMode(false)} style={iconButton}>
              <Move size={16} />
            </button>
            <button
              type="button"
              title="Selecionar área"
              onClick={() => setSelectMode((current) => !current)}
              style={{
                ...iconButton,
                borderColor: selectMode ? "var(--gold-600)" : "var(--iron-400)",
                color: selectMode ? "var(--gold-300)" : "var(--text-muted)",
              }}
            >
              <Crosshair size={16} />
            </button>
            <button type="button" title="Aproximar" onClick={() => zoomBy(1.35)} style={iconButton}>
              <ZoomIn size={16} />
            </button>
            <button type="button" title="Afastar" onClick={() => zoomBy(1 / 1.35)} style={iconButton}>
              <ZoomOut size={16} />
            </button>
            <button type="button" title="Centralizar" onClick={resetView} style={iconButton}>
              <RotateCcw size={16} />
            </button>
            <Button type="button" size="sm" variant="ghost" onClick={() => void loadMap()} disabled={status === "loading"}>
              <RefreshCw size={15} />
              Recarregar
            </Button>
          </div>
        </div>

        <div style={{ ...panelPad, display: "grid", gap: 14 }}>
          <div
            ref={canvasWrapRef}
            style={{
              width: "100%",
              maxWidth: 900,
              margin: "0 auto",
              border: "1px solid var(--iron-400)",
              background: "var(--surface-inset)",
              boxShadow: "var(--bevel-in)",
              overflow: "hidden",
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={() => setHover(null)}
              onWheel={onWheel}
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "1 / 1",
                cursor: selectMode ? "crosshair" : "grab",
                touchAction: "none",
              }}
            />
          </div>

          {status !== "ok" ? <div style={muted}>{statusMessage(status)}</div> : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <div style={{ background: "var(--surface-inset)", border: "1px solid var(--iron-400)", padding: 12 }}>
              <Label>Cursor</Label>
              {hover && hoverWorld ? (
                <div style={{ display: "grid", gap: 5, marginTop: 8, ...mono }}>
                  <span>
                    célula {hover.cellX}, {hover.cellY}
                  </span>
                  <span>
                    mundo X {hoverWorld.minX}-{hoverWorld.maxX} · Y {hoverWorld.minY}-{hoverWorld.maxY}
                  </span>
                  <span>
                    valor {hover.value} · 0x{hover.value.toString(16).padStart(2, "0").toUpperCase()} ·{" "}
                    {binaryByte(hover.value)}
                  </span>
                  <span style={{ color: "var(--gold-300)" }}>{meaningLabel(hover.value, info)}</span>
                </div>
              ) : (
                <div style={{ ...muted, marginTop: 8 }}>Fora do mapa.</div>
              )}
            </div>

            <div style={{ background: "var(--surface-inset)", border: "1px solid var(--iron-400)", padding: 12 }}>
              <Label>Arquivo</Label>
              <div style={{ display: "grid", gap: 5, marginTop: 8, ...mono }}>
                <span>
                  dim {info?.dim ?? ATTRIBUTE_MAP_DIM} · escala {info?.worldScale ?? ATTRIBUTE_MAP_WORLD_SCALE}
                </span>
                <span>bytes {selectedBytes?.length.toLocaleString("pt-BR") ?? "-"}</span>
                <span style={{ overflowWrap: "anywhere" }}>sha256 {visibleSha256 ?? "-"}</span>
              </div>
            </div>

            <div style={{ background: "var(--surface-inset)", border: "1px solid var(--iron-400)", padding: 12 }}>
              <Label>Retângulo</Label>
              <div style={{ display: "grid", gap: 5, marginTop: 8, ...mono }}>
                <span>{rectEnabled ? `${rect.min_x},${rect.min_y} - ${rect.max_x},${rect.max_y}` : "Mapa completo"}</span>
                <span>
                  células {selectedCells.minCellX},{selectedCells.minCellY} - {selectedCells.maxCellX},
                  {selectedCells.maxCellY}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside style={{ display: "grid", gap: 18, alignContent: "start" }}>
        <section style={panel}>
          <div style={{ ...panelPad, borderBottom: "1px solid var(--iron-400)" }}>
            <h2 style={panelTitle}>Transformação</h2>
          </div>
          <form onSubmit={submitTransform} style={{ ...panelPad, display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <Label>Operação</Label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as AttributeMapTransformOperation)}
                style={selectStyle}
              >
                {OPERATIONS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label={activeOperation.operandLabel}
              type="number"
              min={isLegacy ? 0 : operation === "ATTRIBUTE_MAP_TRANSFORM_OPERATION_ASSIGN_VALUE" ? 0 : 1}
              max={255}
              value={isLegacy ? "0" : operand}
              onChange={(e) => setOperand(e.target.value)}
              disabled={isLegacy}
            />

            <div style={{ display: "grid", gap: 10 }}>
              <Checkbox label="Usar retângulo" checked={rectEnabled} onChange={(e) => setRectEnabled(e.target.checked)} />
              {rectEnabled ? (
                <div style={fieldGrid}>
                  <Input label="min_x" type="number" min={0} max={ATTRIBUTE_MAP_WORLD_MAX} value={rect.min_x} onChange={(e) => updateRectField("min_x", e.target.value)} />
                  <Input label="min_y" type="number" min={0} max={ATTRIBUTE_MAP_WORLD_MAX} value={rect.min_y} onChange={(e) => updateRectField("min_y", e.target.value)} />
                  <Input label="max_x" type="number" min={0} max={ATTRIBUTE_MAP_WORLD_MAX} value={rect.max_x} onChange={(e) => updateRectField("max_x", e.target.value)} />
                  <Input label="max_y" type="number" min={0} max={ATTRIBUTE_MAP_WORLD_MAX} value={rect.max_y} onChange={(e) => updateRectField("max_y", e.target.value)} />
                </div>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <Checkbox label="Usar filtro" checked={filterEnabled} onChange={(e) => setFilterEnabled(e.target.checked)} />
              {filterEnabled ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <Label>Modo</Label>
                    <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as "exact" | "mask")} style={selectStyle}>
                      <option value="exact">Valor exato</option>
                      <option value="mask">Máscara de bits</option>
                    </select>
                  </label>
                  {filterMode === "exact" ? (
                    <Input label="exact_value" type="number" min={0} max={255} value={exactValue} onChange={(e) => setExactValue(e.target.value)} />
                  ) : (
                    <div style={fieldGrid}>
                      <Input label="mask" type="number" min={1} max={255} value={maskValue} onChange={(e) => setMaskValue(e.target.value)} />
                      <Input label="match_value" type="number" min={0} max={255} value={matchValue} onChange={(e) => setMatchValue(e.target.value)} />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <Button type="submit" variant="steel" disabled={transformStatus === "loading" || status !== "ok"}>
              <Wand2 size={16} />
              Aplicar e revisar
            </Button>

            {transformStatus !== "idle" && transformStatus !== "ok" ? (
              <div style={muted}>{statusMessage(transformStatus) || "Transformação recusada. Revise os campos."}</div>
            ) : null}
          </form>
        </section>

        {transformResult ? (
          <section style={panel}>
            <div style={{ ...panelPad, borderBottom: "1px solid var(--iron-400)" }}>
              <h2 style={panelTitle}>Resultado</h2>
            </div>
            <div style={{ ...panelPad, display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <div style={{ background: "var(--surface-inset)", border: "1px solid var(--iron-400)", padding: 10 }}>
                  <Label>Células</Label>
                  <div style={{ ...mono, marginTop: 7, color: "var(--gold-300)" }}>
                    {transformResult.changedCount.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div style={{ background: "var(--surface-inset)", border: "1px solid var(--iron-400)", padding: 10 }}>
                  <Label>Arquivo</Label>
                  <div style={{ ...mono, marginTop: 7 }}>{transformResult.filename}</div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 6, ...mono, color: "var(--text-muted)" }}>
                <span style={{ overflowWrap: "anywhere" }}>original {transformResult.originalSha256}</span>
                <span style={{ overflowWrap: "anywhere" }}>novo {transformResult.newSha256}</span>
              </div>
              <DeltaList result={transformResult} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button
                  type="button"
                  onClick={() => generatedBytes && downloadBytes(generatedBytes, transformResult.filename)}
                  disabled={!generatedBytes}
                >
                  <Download size={16} />
                  Baixar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPreviewMode("generated")}>
                  <Eye size={16} />
                  Prévia
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <section style={panel}>
          <div style={{ ...panelPad, borderBottom: "1px solid var(--iron-400)" }}>
            <h2 style={panelTitle}>Histograma</h2>
          </div>
          <div style={panelPad}>
            {histogram.length > 0 ? <HistogramGrid histogram={histogram} info={info} /> : <div style={muted}>Sem dados.</div>}
          </div>
        </section>
      </aside>
    </div>
  );
}
