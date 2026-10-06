import { AnimatePresence, motion } from 'framer-motion'
import { History, Minus, Plus, RotateCcw, Ticket, Trash2, Trophy } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, Empty, Field, Panel, useConfirm } from '@/components/ui'
import { drawWinner, useExtras, type RaffleEntry } from '@/lib/extras'
import { prefersReducedMotion } from '@/lib/motion'
import { fmtDate } from '@/lib/utils'
import { ExtrasUnavailable } from '@/pages/Partenaires'

export default function Tombola() {
  const { available, entries, draws, addTickets, setTickets, deleteEntry, recordDraw, resetRaffle } = useExtras()
  const [name, setName] = useState('')
  const [tickets, setTicketsInput] = useState('1')
  const [prize, setPrize] = useState('')
  const [rolling, setRolling] = useState<string | null>(null)
  const [winner, setWinner] = useState<RaffleEntry | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const { ask, dialog } = useConfirm()

  const total = entries.reduce((s, e) => s + e.tickets, 0)
  const sorted = [...entries].sort((a, b) => b.tickets - a.tickets || a.name.localeCompare(b.name, 'fr'))
  const safe = async (f: () => Promise<unknown>) => {
    try {
      await f()
    } catch (err) {
      toast.error(`Base de données : ${(err as Error).message}`)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = Math.floor(Number(tickets))
    if (!name.trim()) return toast.error('Indiquez le nom et le prénom du participant.')
    if (!Number.isFinite(n) || n < 1) return toast.error('Au moins 1 ticket.')
    await safe(async () => {
      await addTickets(name, n)
      toast.success(`${n} ticket(s) pour ${name.trim()}.`)
      setName('')
      setTicketsInput('1')
      nameRef.current?.focus()
    })
  }

  async function draw() {
    if (!entries.length || rolling) return
    if (!(await ask(`Lancer le tirage au sort entre ${entries.length} participant(s) pour ${total} ticket(s) ?`))) return
    const win = drawWinner(entries)!
    setWinner(null)
    // petite animation : les noms défilent puis ralentissent sur le gagnant
    if (!prefersReducedMotion()) {
      const names = entries.map((e) => e.name)
      for (let i = 0; i < 26; i++) {
        setRolling(names[Math.floor(Math.random() * names.length)])
        await new Promise((r) => setTimeout(r, 40 + i * i * 0.9))
      }
    }
    setRolling(null)
    setWinner(win)
    await safe(() => recordDraw({ winner: win.name, winnerTickets: win.tickets, totalTickets: total, participants: entries.length, prize: prize.trim() }))
  }

  if (available === false)
    return (
      <Panel title="Tombola" icon={<Ticket />}>
        <ExtrasUnavailable />
      </Panel>
    )

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <Panel
        title="Tombola"
        icon={<Ticket />}
        actions={
          entries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (await ask('Nouvelle tombola : vider la liste des participants ? (l’historique des tirages est conservé)')) await safe(resetRaffle)
              }}
            >
              <RotateCcw size={14} /> Nouvelle tombola
            </Button>
          )
        }
      >
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-end">
          <Field label="Nom & prénom">
            <input ref={nameRef} className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Arthur Morgan" list="tombola-noms" />
          </Field>
          <Field label="Tickets achetés">
            <input className="field" inputMode="numeric" value={tickets} onChange={(e) => setTicketsInput(e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Button type="submit" variant="blood">
            <Plus size={17} /> Ajouter
          </Button>
          <datalist id="tombola-noms">
            {entries.map((e) => (
              <option key={e.id} value={e.name} />
            ))}
          </datalist>
        </form>
        <p className="mt-2 text-[14.5px] text-sepia italic">Si le participant est déjà inscrit, ses nouveaux tickets s’ajoutent aux précédents.</p>

        <div className="mt-5 flex items-baseline justify-between border-b border-white/8 pb-2">
          <p className="label text-[16px] text-sepia">{entries.length} participant(s)</p>
          <p className="font-type text-3xl tracking-[.02em]">
            {total} <span className="text-[18px] text-sepia">ticket(s)</span>
          </p>
        </div>

        {sorted.length === 0 ? (
          <Empty icon={<Ticket size={32} />}>Aucun participant pour l’instant.</Empty>
        ) : (
          <ul className="divide-y divide-white/[.06]">
            {sorted.map((e) => {
              const pct = total ? (e.tickets / total) * 100 : 0
              return (
                <li key={e.id} className="group flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px]">{e.name}</p>
                    <div className="statbar mt-1.5 max-w-xs">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-14 text-right text-[14px] text-sepia">{pct.toFixed(1)} %</span>
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/[.03]">
                    <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => safe(() => (e.tickets > 1 ? setTickets(e.id, e.tickets - 1) : deleteEntry(e.id)))} aria-label="Retirer un ticket">
                      <Minus size={13} />
                    </button>
                    <span className="w-10 text-center font-type text-[19px]">{e.tickets}</span>
                    <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => safe(() => setTickets(e.id, e.tickets + 1))} aria-label="Ajouter un ticket">
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    className="cursor-pointer rounded p-1 text-sepia-2 opacity-60 transition hover:text-blood group-hover:opacity-100"
                    onClick={async () => {
                      if (await ask(`Retirer ${e.name} de la tombola ?`)) await safe(() => deleteEntry(e.id))
                    }}
                    aria-label={`Retirer ${e.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <div className="space-y-5 self-start lg:sticky lg:top-24">
        {/* ——— Tirage ——— */}
        <section className="glass-panel p-5">
          <h2 className="flex items-center gap-2.5 font-western text-[28px] tracking-[.08em]">
            <Trophy className="text-brass" /> TIRAGE AU SORT
          </h2>
          <Field label="Lot (facultatif)" className="mt-3">
            <input className="field" value={prize} onChange={(e) => setPrize(e.target.value)} maxLength={120} placeholder="Revolver Cattleman gravé…" />
          </Field>

          <div className="mt-4 grid min-h-32 place-items-center rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
            <AnimatePresence mode="wait">
              {rolling ? (
                <motion.p key="roll" className="font-western text-4xl tracking-[.04em] text-parch-2">
                  {rolling.toUpperCase()}
                </motion.p>
              ) : winner ? (
                <motion.div key={winner.id} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
                  <p className="label text-[15px] text-brass">Le gagnant est</p>
                  <p className="font-western text-5xl leading-none tracking-[.04em] [text-shadow:0_0_30px_rgba(214,165,77,.45)]">{winner.name.toUpperCase()}</p>
                  <p className="mt-1 text-[15px] text-sepia">
                    avec {winner.tickets} ticket(s) sur {total}
                    {prize.trim() && ` · ${prize.trim()}`}
                  </p>
                </motion.div>
              ) : (
                <motion.p key="idle" className="text-sepia italic">
                  {entries.length ? 'Chaque ticket compte pour une chance.' : 'Ajoutez des participants pour lancer le tirage.'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={draw}
            disabled={!entries.length || !!rolling}
            className="mt-4 w-full cursor-pointer rounded-2xl border border-white/15 bg-gradient-to-b from-[#e6b65d] to-[#a8741f] py-3 font-western text-[26px] tracking-[.18em] text-[#1a120c] shadow-[0_14px_34px_-12px_rgba(214,165,77,.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
          >
            TIRER AU SORT
          </button>
        </section>

        {/* ——— Historique ——— */}
        <section className="glass-panel p-5">
          <h2 className="flex items-center gap-2.5 font-western text-[24px] tracking-[.08em]">
            <History className="text-blood" size={20} /> HISTORIQUE DES TIRAGES
          </h2>
          {draws.length === 0 ? (
            <p className="mt-3 text-sepia italic">Aucun tirage pour le moment.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/[.06]">
              {draws.slice(0, 12).map((d) => (
                <li key={d.id} className="py-2">
                  <p className="text-[16.5px]">
                    <b className="font-semibold">{d.winner}</b> {d.prize && <span className="text-brass">· {d.prize}</span>}
                  </p>
                  <p className="text-[13.5px] text-sepia">
                    {fmtDate(d.createdAt)} · {d.winnerTickets}/{d.totalTickets} tickets · {d.participants} participant(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {dialog}
    </div>
  )
}
