import Image from "next/image";

interface AtomEchoLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: "icon" | "wordmark";
  theme?: "dark" | "light";
}

export function AtomEchoLogo({
  size = 28,
  className = "",
  showText = true,
  variant = "icon",
  theme = "dark",
}: AtomEchoLogoProps) {
  if (variant === "wordmark" || showText) {
    const src = theme === "light" ? "/brand-wordmark-dark.svg" : "/brand-wordmark-white.svg";
    return (
      <div className={`inline-flex items-center shrink-0 ${className}`}>
        <Image
          src={src}
          alt="Atom & Echo"
          width={Math.round(size * 2.73)}
          height={size}
          priority
          unoptimized
          className="h-auto object-contain select-none"
          style={{ maxHeight: size }}
        />
      </div>
    );
  }

  const symbolSrc = theme === "light" ? "/icon-symbol-dark.png" : "/icon-symbol-white.png";
  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src={symbolSrc}
        alt="Atom & Echo"
        width={size}
        height={size}
        priority
        className="object-contain select-none"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
