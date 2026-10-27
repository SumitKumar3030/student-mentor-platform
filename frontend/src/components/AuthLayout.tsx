import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";
import PairPulseLogo from "./PairPulseLogo";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: Props) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-md relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-10 group antialiased"
          >
            <PairPulseLogo className="w-9 h-9 group-hover:scale-105 transition-transform will-change-transform" />
            <span className="text-2xl font-bold text-white tracking-tight flex items-center gap-1">
              PairPulse
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-neutral-400 mb-8">{subtitle}</p>

          {children}

          {footer && (
            <div className="mt-8 text-center text-sm text-neutral-400">
              {footer}
            </div>
          )}
        </div>

        {/* Small IP footer for auth pages */}
        <div className="absolute bottom-6 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-[15px] text-neutral-500 tracking-widest font-bold">
            An IP by
          </span>
          <img
            src="/itspossible-logo.png"
            alt="It'sPossible ip"
            className="h-8 object-contain "
          />
        </div>
      </div>

      {/* Right side - Visual/Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-neutral-900 items-center justify-center overflow-hidden border-l border-neutral-800">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />

        <div className="relative z-10 max-w-lg p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-brand-500/20">
            <Code2 className="text-brand-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            "The best way to teach code is to code together."
          </h2>
          <p className="text-neutral-400">
            Real-time collaboration, video calls, and recording. Everything you
            need in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
