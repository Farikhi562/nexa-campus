/**
 * Renderer teks ringan — cuma dukung **bold** dan paragraf (pisah baris
 * kosong). Sengaja tidak pakai library markdown eksternal (tidak ada di
 * dependency project, dan kebutuhannya simpel: cuma rangkuman materi).
 */
export default function SimpleMarkdown({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{renderInline(paragraph)}</p>
      ))}
    </div>
  )
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} className="font-black text-slate-950">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}
