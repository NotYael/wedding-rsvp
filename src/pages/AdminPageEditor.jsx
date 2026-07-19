import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../lib/supabaseClient'
import { Modal } from '../components/Modal'
import { MarkdownGuide } from '../components/MarkdownGuide'

export function AdminPageEditor({ slug, label }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    let active = true

    supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) {
          setError('Could not load this page.')
        } else {
          setContent(data.content)
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSavedAt(null)

    const { error: saveError } = await supabase
      .from('pages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('slug', slug)

    setSaving(false)

    if (saveError) {
      setError('Could not save. Please try again.')
      return
    }

    setSavedAt(new Date())
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <h1>{label}</h1>
      </header>

      <div className="admin-toolbar">
        <button type="button" onClick={() => setShowGuide(true)}>
          Formatting Guide
        </button>
      </div>

      {showGuide && (
        <Modal title="Markdown Formatting Guide" onClose={() => setShowGuide(false)}>
          <MarkdownGuide />
        </Modal>
      )}

      {loading && <p className="auth-status">Loading…</p>}
      {error && <p className="login-error">{error}</p>}

      {!loading && !error && (
        <div className="page-editor">
          <div className="page-editor-pane">
            <div className="page-editor-toolbar">
              <label htmlFor={`${slug}-editor`}>Markdown source</label>
              <div className="page-editor-actions">
                {savedAt && <span className="page-editor-saved">Saved {savedAt.toLocaleTimeString()}</span>}
                <button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <textarea
              id={`${slug}-editor`}
              className="page-editor-textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          <div className="page-editor-pane">
            <div className="page-editor-toolbar">
              <span className="page-editor-toolbar-label">Preview</span>
            </div>
            <div className="page-editor-preview">
              <article className="page-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
