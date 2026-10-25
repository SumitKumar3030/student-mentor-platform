import { Link } from 'react-router-dom'
import { Video, Code2, Zap, ArrowRight } from 'lucide-react'
import PairPulseLogo from '@/components/PairPulseLogo'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 overflow-hidden relative flex flex-col">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Navbar */}
      <nav className="relative z-10 border-b border-neutral-800/50 bg-[#0a0a0a]/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PairPulseLogo className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-white">PairPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          Live 1-on-1 Mentorship
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Code together. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-[#FF5722]">
            Learn faster.
          </span>
        </h1>
        
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
          A real-time collaborative code editor with built-in video calling, 
          cursor sync, and recording. The ultimate workspace for mentors and students.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25">
            Start a Session <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white rounded-xl font-semibold transition-all">
            Join with Code
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 text-left w-full">
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
              <Code2 className="text-brand-400" size={20} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Live Code Sync</h3>
            <p className="text-sm text-neutral-400">Type together in real-time with Monaco editor. Sub-millisecond latency via WebSockets.</p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Video className="text-green-400" size={20} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">HD Video Calling</h3>
            <p className="text-sm text-neutral-400">Peer-to-peer WebRTC video and audio. Screen share your code while talking.</p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-[#FF5722]/10 flex items-center justify-center mb-4">
              <Zap className="text-[#FF5722]" size={20} />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Instant Recording</h3>
            <p className="text-sm text-neutral-400">Record your entire screen with one click. Share the link with students later.</p>
          </div>
        </div>
      </main>

      {/* Footer / Brand IP */}
      <footer className="relative z-10 border-t border-neutral-800/50 py-8 mt-auto bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            © {new Date().getFullYear()} PairPulse. All rights reserved.
          </div>
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">An IP by</span>
            <img src="/brand-logo.png" alt="It'sPossible ip" className="h-8 object-contain" />
          </div>
        </div>
      </footer>
    </div>
  )
}