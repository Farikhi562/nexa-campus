export default function PortalCard({ name, url, description, status }: { 
  name: string, url: string, description: string, status: 'online' | 'offline' | 'slow' 
}) {
  const statusColors = {
    online: 'bg-green-500',
    slow: 'bg-yellow-500',
    offline: 'bg-red-500'
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition group"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-slate-800 group-hover:text-blue-600">{name}</h4>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <span className="text-[10px] uppercase font-bold text-slate-400">{status}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </a>
  )
}