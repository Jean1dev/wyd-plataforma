import type { InputHTMLAttributes } from "react";

type CheckboxProps = {
  label: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ label, id, name, ...rest }: CheckboxProps) {
  const inputId = id ?? name;
  return (
    <label
      htmlFor={inputId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        color: "var(--text-body)",
      }}
    >
      <input
        id={inputId}
        name={name}
        type="checkbox"
        style={{
          width: 17,
          height: 17,
          accentColor: "var(--gold-600)",
          cursor: "pointer",
        }}
        {...rest}
      />
      {label}
    </label>
  );
}

export default Checkbox;
