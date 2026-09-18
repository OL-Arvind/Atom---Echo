import Image from "next/image";

interface AtomEchoLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function AtomEchoLogo({
  size = 32,
  className = "",
  showText = true,
}: AtomEchoLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative overflow-hidden rounded-lg bg-black border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.06)] flex items-center justify-center shrink-0"
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
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-tight text-white">
            <span>ATOM &amp; ECHO</span>
            <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-mono font-medium tracking-widest text-white uppercase">
              OS
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
            BaseWorks Cockpit
          </span>
        </div>
      )}
    </div>
  );
}
