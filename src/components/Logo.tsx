import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 32, text: "text-lg" },
  md: { icon: 40, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const { icon, text } = sizes[size];
  
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-lg"
        style={{ width: icon, height: icon }}
      >
        <Image
          src="/logo.svg"
          alt="LetLog"
          width={icon}
          height={icon}
          className="w-full h-full"
          priority
        />
      </div>
      {showText && (
        <span className={`font-semibold tracking-tight ${text}`}>
          <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Let</span>
          <span className="text-slate-900 dark:text-white">Log</span>
        </span>
      )}
    </Link>
  );
}

export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <div 
      className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-lg"
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.svg"
        alt="LetLog"
        width={size}
        height={size}
        className="w-full h-full"
        priority
      />
    </div>
  );
}
