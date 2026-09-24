import Image from "next/image";

interface AtomEchoLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function AtomEchoLogo({
  size = 30,
  className = "",
  showText = true,
}: AtomEchoLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative overflow-hidden rounded-[6px] bg-black border border-[var(--color-line)] shadow-xs flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Atom & Echo Logo"
          width={size}
          height={size}
          priority
          className="object-cover w-full h-full"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-[var(--color-ink)]">
            <span className="tracking-wide">ATOM &amp; ECHO</span>
            <span className="rounded bg-[var(--color-base-subtle)] border border-[var(--color-line)] px-1 py-0.5 text-[9px] font-mono font-medium text-[var(--color-ink-secondary)] uppercase">
              OS
            </span>
          </div>
          <span className="mt-1 text-[10.5px] font-medium text-[var(--color-ink-tertiary)] tracking-tight">
            Agency Operating System
          </span>
        </div>
      )}
    </div>
  );
}
