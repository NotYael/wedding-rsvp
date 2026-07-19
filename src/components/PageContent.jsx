import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../lib/supabaseClient'

export function PageContent({ slug }) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          setPage(data)
        }
        setLoading(false)
      })

    const channel = supabase
      .channel(`page-${slug}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pages', filter: `slug=eq.${slug}` },
        (payload) => setPage(payload.new),
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [slug])

  if (loading) return <p className="status-message">Loading…</p>
  if (error) return <p className="login-error">{error}</p>

  return (
    <article className="page-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
    </article>
  )
}
