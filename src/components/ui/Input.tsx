import type { InputHTMLAttributes } from "react";

type InputProps = {
  label?: string;
  /** Steel rim + scroll end caps — for the few hero forms (login, signup). */
  ornate?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, ornate, id, name, className, ...rest }: InputProps) {
  const inputId = id ?? name;
  return (
    <label htmlFor={inputId} className={ornate ? "wyd-field wyd-field--ornate" : "wyd-field"}>
      {label ? <span className="wyd-field__label">{label}</span> : null}
      <input
        id={inputId}
        name={name}
        className={["wyd-input", ornate ? "wyd-input--ornate" : "", className ?? ""].filter(Boolean).join(" ")}
        {...rest}
      />
    </label>
  );
}

export default Input;
