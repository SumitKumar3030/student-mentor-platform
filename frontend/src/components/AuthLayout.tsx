import { Link } from 'react-router-dom'
import PairPulseLogo from './PairPulseLogo'

interface Props {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      
      {/* LEFT SIDE - WHITE FORM */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 relative z-10">
        <div className="w-full max-w-sm mx-auto">
          
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-12 group">
            <PairPulseLogo className="w-8 h-8" />
            <span className="text-xl font-bold text-slate-900">PairPulse</span>
          </Link>

          {/* Headings */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>

          {/* Form Content */}
          {children}

          {/* Footer Links */}
          {footer && (
            <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>
          )}
        </div>

        {/* Brand IP Footer (Absolute to the bottom of the left panel) */}
        <div className="absolute bottom-8 left-6 md:left-12 lg:left-24 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">An IP by</span>
          <img src="/itspossible-logo.png" alt="It'sPossible ip" className="h-6 object-contain grayscale" />
        </div>
      </div>

      {/* RIGHT SIDE - DARK & ANIMATED */}
      <div className="hidden lg:flex flex-1 relative bg-[#0a0a0a] items-center justify-center overflow-hidden rounded-2xl">
        
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#FF5722]/20 rounded-full blur-[80px] animate-pulse delay-1000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Glassmorphism Content Card */}
        <div className="relative z-10 max-w-md w-full mx-8 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center mb-6 border border-brand-500/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4 leading-snug">
            "The best way to teach code is to code together."
          </h2>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Experience real-time collaboration, HD video calls, and AI-powered coding assistance. Everything you need to mentor or learn in one place.
          </p>

          <div className="flex items-center gap-4 text-sm font-medium text-white">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px]">👨‍🏫</div>
              <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px]">🎓</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px]">💻</div>
            </div>
            <span>Join thousands of coders</span>
          </div>
        </div>
      </div>

    </div>
  )
}