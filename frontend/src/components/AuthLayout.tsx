import { Link } from 'react-router-dom'

interface Props {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block mb-6">
            <div className="text-2xl font-bold tracking-tight">
              <span className="text-white">Code</span>
              <span className="text-violet-400">Mentor</span>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold mb-2">{title}</h1>
          <p className="text-neutral-400 text-sm">{subtitle}</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-neutral-400">{footer}</div>
        )}
      </div>
    </div>
  )
}