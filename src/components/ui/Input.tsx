import type { InputHTMLAttributes } from "react";

type InputProps = {
  label?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, id, name, ...rest }: InputProps) {
  const inputId = id ?? name;
  return (
    <label
      htmlFor={inputId}
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      {label ? (
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
          {label}
        </span>
      ) : null}
      <input id={inputId} name={name} className="wyd-input" {...rest} />
    </label>
  );
}

export default Input;
