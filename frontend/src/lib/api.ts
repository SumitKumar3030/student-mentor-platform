const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data as T
}

export interface SessionInfo {
  id: string
  code: string
  joinToken: string
  mentorId: string
  studentId: string | null
  language: string
  status: 'active' | 'ended' | 'abandoned'
  durationMinutes: number
  startedAt: string
}

export interface HistorySession {
  id: string
  title: string
  code: string
  status: string
  startedAt: string
  endedAt: string | null
  role: string
  mentorName: string
  studentName: string | null
  recording: { share_token: string; duration_seconds: number } | null
}

export const sessionsApi = {
  create: (userId: string, title: string, language: string, durationMinutes: number) =>
    request<{ id: string; code: string; joinToken: string; language: string; durationMinutes: number }>(
      '/api/sessions/create',
      {
        method: 'POST',
        body: JSON.stringify({ userId, title, language, durationMinutes }),
      }
    ),

  resolve: (slug: string) =>
    request<SessionInfo>(`/api/sessions/resolve/${slug}`),

  join: (sessionId: string, userId: string) =>
    request<{ id: string; role: 'mentor' | 'student' }>(
      `/api/sessions/${sessionId}/join`,
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    ),

  end: (sessionId: string, userId: string, language?: string, code?: string) =>
    request<{ ok: true }>(`/api/sessions/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({ userId, language, code }),
    }),

  snapshot: (sessionId: string, language: string, code: string) =>
    request<{ ok: true }>(`/api/sessions/${sessionId}/snapshot`, {
      method: 'POST',
      body: JSON.stringify({ language, code }),
    }),

    history: (userId: string) =>
    request<{
      sessions: Array<{
        id: string;
        title: string;
        code: string;
        status: string;
        startedAt: string;
        endedAt: string | null;
        durationMinutes: number;
        role: string;
        mentorName: string;
        studentName: string | null;
        recording: { share_token: string; duration_seconds: number } | null;
        aiSummary: string | null;
      }>;
      stats: {
        totalSessions: number;
        totalMinutes: number;
        totalRecordings: number;
        role: string;
      }
    }>(`/api/sessions/history/${userId}`),
}