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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-between">
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
            <PairPulseLogo className="w-9 h-9 group-hover:scale-105 transition-transform" />
            <span className="text-2xl font-bold text-white tracking-tight">PairPulse</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-neutral-400 mb-8">{subtitle}</p>

          {children}

          {footer && (
            <div className="mt-8 text-center text-sm text-neutral-400">{footer}</div>
          )}
        </div>
      </div>

      {/* Small IP footer for auth pages */}
      <div className="py-6 flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">An IP by</span>
        <img src="/brand-logo.png" alt="It'sPossible ip" className="h-5 object-contain" />
      </div>
    </div>
  )
}