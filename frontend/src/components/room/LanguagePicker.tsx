import { LANGUAGES } from '@/lib/languages'
import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export default function LanguagePicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find((l) => l.id === value) || LANGUAGES[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-700 rounded-lg text-sm transition-colors"
      >
        <span className="font-medium">{current.label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                onChange(lang.id)
                setOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-800 transition-colors flex items-center justify-between ${
                lang.id === value ? 'bg-violet-500/10 text-violet-300' : ''
              }`}
            >
              <span>{lang.label}</span>
              <span className="text-xs text-neutral-500 font-mono">.{lang.extension}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}