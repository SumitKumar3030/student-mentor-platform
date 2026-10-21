import { create } from 'zustand'
import { getLanguage } from '@/lib/languages'

interface RemoteCursor {
  userId: string
  name: string
  position: { lineNumber: number; column: number }
}

interface RoomState {
  code: string
  language: string
  remoteCursors: RemoteCursor[]
  setCode: (code: string) => void
  setLanguage: (language: string) => void
  setRemoteCursor: (cursor: RemoteCursor) => void
  clearRemoteCursor: (userId: string) => void
  clearAllRemoteCursors: () => void
  reset: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
  code: '',
  language: 'javascript',
  remoteCursors: [],

  setCode: (code) => set({ code }),

  setLanguage: (language) => {
    const lang = getLanguage(language)
    set({ language, code: lang.defaultCode })
  },

  setRemoteCursor: (cursor) =>
    set((state) => {
      const others = state.remoteCursors.filter((c) => c.userId !== cursor.userId)
      return { remoteCursors: [...others, cursor] }
    }),

  clearRemoteCursor: (userId) =>
    set((state) => ({
      remoteCursors: state.remoteCursors.filter((c) => c.userId !== userId),
    })),

  clearAllRemoteCursors: () => set({ remoteCursors: [] }),

  reset: () => set({ code: '', language: 'javascript', remoteCursors: [] }),
}))