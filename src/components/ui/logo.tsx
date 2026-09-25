import Image from "next/image";

interface AtomEchoLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: "icon" | "wordmark";
  theme?: "dark" | "light" | "auto";
}

export function AtomEchoLogo({
  size = 28,
  className = "",
  showText = true,
  variant = "icon",
  theme = "auto",
}: AtomEchoLogoProps) {
  if (variant === "wordmark" || showText) {
    if (theme === "light") {
      return (
        <div className={`inline-flex items-center shrink-0 ${className}`}>
          <Image
            src="/brand-wordmark-dark.svg"
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
    if (theme === "dark") {
      return (
        <div className={`inline-flex items-center shrink-0 ${className}`}>
          <Image
            src="/brand-wordmark-white.svg"
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
    return (
      <div className={`inline-flex items-center shrink-0 ${className}`}>
        <Image
          src="/brand-wordmark-dark.svg"
          alt="Atom & Echo"
          width={Math.round(size * 2.73)}
          height={size}
          priority
          unoptimized
          className="theme-logo-light h-auto object-contain select-none"
          style={{ maxHeight: size }}
        />
        <Image
          src="/brand-wordmark-white.svg"
          alt="Atom & Echo"
          width={Math.round(size * 2.73)}
          height={size}
          priority
          unoptimized
          className="theme-logo-dark h-auto object-contain select-none"
          style={{ maxHeight: size }}
        />
      </div>
    );
  }

  if (theme === "light") {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/icon-symbol-dark.png"
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
  if (theme === "dark") {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/icon-symbol-white.png"
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
  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src="/icon-symbol-dark.png"
        alt="Atom & Echo"
        width={size}
        height={size}
        priority
        className="theme-logo-light object-contain select-none"
        style={{ width: size, height: size }}
      />
      <Image
        src="/icon-symbol-white.png"
        alt="Atom & Echo"
        width={size}
        height={size}
        priority
        className="theme-logo-dark object-contain select-none"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
