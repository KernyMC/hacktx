import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" };

export default function PixelButton({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`px-btn ${variant === "soft" ? "px-btn-soft" : ""} px-[18px] py-[9px] text-[16px] ${className}`}
      {...rest}
    />
  );
}
