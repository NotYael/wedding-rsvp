import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const ENTRIES = [
  { label: 'Heading 1', syntax: '# Heading' },
  { label: 'Heading 2', syntax: '## Heading' },
  { label: 'Heading 3', syntax: '### Heading' },
  { label: 'Bold', syntax: '**bold text**' },
  { label: 'Italic', syntax: '*italic text*' },
  { label: 'Strikethrough', syntax: '~~strikethrough~~' },
  { label: 'Link', syntax: '[link text](https://example.com)' },
  { label: 'Image', syntax: '![alt text](https://example.com/image.jpg)' },
  { label: 'Bullet list', syntax: '- First item\n- Second item' },
  { label: 'Numbered list', syntax: '1. First item\n2. Second item' },
  { label: 'Task list', syntax: '- [ ] To do\n- [x] Done' },
  { label: 'Blockquote', syntax: '> Quoted text' },
  { label: 'Inline code', syntax: '`inline code`' },
  { label: 'Table', syntax: '| A | B |\n| --- | --- |\n| 1 | 2 |' },
  { label: 'Horizontal rule', syntax: '---' },
]

export function MarkdownGuide() {
  return (
    <div className="markdown-guide">
      <div className="markdown-guide-row markdown-guide-row-head">
        <span>Element</span>
        <span>Markdown</span>
        <span>Preview</span>
      </div>
      {ENTRIES.map((entry) => (
        <div key={entry.label} className="markdown-guide-row">
          <span className="markdown-guide-label">{entry.label}</span>
          <pre className="markdown-guide-syntax">{entry.syntax}</pre>
          <div className="markdown-guide-preview page-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.syntax}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}
