import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "steel" | "ghost";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

function classes(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [
    "wyd-btn",
    `wyd-btn--${variant}`,
    `wyd-btn--${size}`,
    block ? "wyd-btn--block" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", block, className, children } = props;
  const cls = classes(variant, size, block, className);

  if ("href" in props && props.href !== undefined) {
    const {
      variant: _v,
      size: _s,
      block: _b,
      className: _c,
      children: _ch,
      href,
      ...rest
    } = props;
    void _v;
    void _s;
    void _b;
    void _c;
    void _ch;
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    block: _b,
    className: _c,
    children: _ch,
    ...rest
  } = props as ButtonAsButton;
  void _v;
  void _s;
  void _b;
  void _c;
  void _ch;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export default Button;
