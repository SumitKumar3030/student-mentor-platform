import Editor from '@monaco-editor/react'
import { useRef, useCallback, useEffect } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useRoomStore } from '@/store/roomStore'

interface Props {
  monacoLanguage: string
  value: string
  onChange: (value: string) => void
  onCursorMove?: (position: { lineNumber: number; column: number }) => void
  readOnly?: boolean
}

export default function CodeEditor({
  monacoLanguage,
  value,
  onChange,
  onCursorMove,
  readOnly = false,
}: Props) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])
  const remoteCursors = useRoomStore((s) => s.remoteCursors)

  const handleMount = useCallback(
    (editor: MonacoEditor.IStandaloneCodeEditor) => {
      editorRef.current = editor
      setTimeout(() => editor.focus(), 100)

      editor.updateOptions({
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Fira Code, Menlo, monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        tabSize: 2,
      })

      // Listen for cursor moves
      editor.onDidChangeCursorPosition((e) => {
        onCursorMove?.({ lineNumber: e.position.lineNumber, column: e.position.column })
      })
    },
    [onCursorMove]
  )

  // Update remote cursor decorations
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const decorations = remoteCursors.map((cursor) => ({
      range: {
        startLineNumber: cursor.position.lineNumber,
        startColumn: cursor.position.column,
        endLineNumber: cursor.position.lineNumber,
        endColumn: cursor.position.column,
      },
      options: {
        className: 'remote-cursor',
        beforeContentClassName: 'remote-cursor-label',
        hoverMessage: { value: cursor.name },
        stickiness: 1,
      },
    }))

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations)
  }, [remoteCursors])

  return (
    <Editor
      height="100%"
      language={monacoLanguage}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      theme="vs-dark"
      options={{ readOnly, automaticLayout: true }}
    />
  )
}