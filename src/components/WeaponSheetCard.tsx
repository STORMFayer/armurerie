import { Lightbulb, OctagonAlert, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { TAG_LABEL, type Tag, type WeaponSheet } from '@/lib/guide'
import { useStore } from '@/lib/store'
import { cn, money } from '@/lib/utils'

const TAG_STYLE: Partial<Record<Tag, string>> = {
  jamais: 'border-blood bg-blood text-parch',
  combat: 'border-blood/50 text-blood',
  chasse: 'border-sage/60 text-sage',
  polyvalent: 'border-[#8a6a2a] text-[#6e4c0f]',
  holster: 'border-[#2f4a63]/60 text-[#2f4a63]',
}

/** Jauge 1→5 façon « balles » (vide = non renseigné dans la formation). */
function Gauge({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 font-sc text-sm text-sepia">{label}</span>
      {value ? (
        <span className="flex gap-1" aria-label={`${value} sur 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={cn('h-3 w-2 rounded-t-full rounded-b-[1px] border border-[#6e4c0f]/60', i <= value ? 'bg-gradient-to-b from-[#f6de86] to-[#a57a22]' : 'bg-transparent')} />
          ))}
        </span>
      ) : (
        <span className="text-xs italic text-sepia-2">non précisé</span>
      )}
    </div>
  )
}

export function WeaponSheetCard({ sheet, compact }: { sheet: WeaponSheet; compact?: boolean }) {
  const [showRaw, setShowRaw] = useState(false)
  const products = useStore((s) => s.products)
  const linked = products.filter((p) => sheet.productIds?.includes(p.id))
  const suggested = products.filter((p) => sheet.suggest?.includes(p.id))
  const never = sheet.tags.includes('jamais')

  return (
    <article className={cn('relative text-ink', !compact && 'rounded-[2px] border border-sepia/35 bg-[rgba(255,250,235,.35)] p-4', never && !compact && 'border-blood/60')}>
      {!compact && (
        <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-western text-lg">{sheet.name}</h3>
          {linked.map((p) => (
            <span key={p.id} className="font-type text-sm text-sepia">
              {money(p.price)} · {p.stock === null ? '∞' : p.stock === 0 ? 'épuisé' : `${p.stock} en stock`}
            </span>
          ))}
        </header>
      )}

      {sheet.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {sheet.tags.map((t) => (
            <span key={t} className={cn('rounded-[2px] border border-sepia/40 px-1.5 py-px font-sc text-xs text-sepia', TAG_STYLE[t])}>
              {TAG_LABEL[t]}
            </span>
          ))}
        </div>
      )}

      {never && (
        <p className="mb-2 flex items-center gap-2 rounded-[2px] bg-blood/10 px-2 py-1 font-sc text-blood">
          <OctagonAlert size={16} /> Arme à ne jamais vendre
        </p>
      )}

      {(sheet.damage || sheet.rate || sheet.range) && (
        <div className="mb-2 space-y-0.5">
          <Gauge label="Dégâts" value={sheet.damage} />
          <Gauge label="Cadence" value={sheet.rate} />
          <Gauge label="Portée" value={sheet.range} />
        </div>
      )}

      <p className="leading-snug">{sheet.summary}</p>

      {sheet.advice && (
        <p className="mt-2 flex gap-2 rounded-[2px] bg-brass/15 px-2 py-1.5 text-[15px]">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#8a6418]" />
          <span>
            <span className="font-sc">Conseil : </span>
            {sheet.advice}
          </span>
        </p>
      )}

      {suggested.length > 0 && (
        <p className="mt-2 text-sm text-sepia">
          <span className="font-sc">À proposer avec : </span>
          {suggested.map((p) => p.name).join(', ')}
        </p>
      )}

      <button onClick={() => setShowRaw((v) => !v)} className="mt-2 flex cursor-pointer items-center gap-1 text-xs text-sepia-2 hover:text-ink">
        <ScrollText size={12} /> {showRaw ? 'Masquer' : 'Voir'} la note de formation
      </button>
      {showRaw && <p className="mt-1 border-l-2 border-sepia/40 pl-2 font-type text-xs text-sepia">« {sheet.raw} »</p>}
    </article>
  )
}
