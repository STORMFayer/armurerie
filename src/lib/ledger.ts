import { create } from 'zustand'
import { supabase } from './db'
import type { Buyback } from './rachat'
import type { Order, Product } from './types'
import { orderNo, round2, uid } from './utils'

/* ——— Livre de compte ———
 * Lignes automatiques (calculées depuis les commandes) : ventes encaissées (+) et frais admin / taxes de fabrication (−).
 * Lignes manuelles (table armurerie_ledger) : dépôts, retraits, ajustements du solde sur le relevé en jeu.
 */

export type LedgerKind = 'depot' | 'retrait' | 'ajustement' | 'vente' | 'taxe' | 'rachat' | 'revente'

export interface LedgerEntry {
  id: string
  kind: LedgerKind
  author: string
  label: string
  amount: number // signé
  createdAt: number
  manual: boolean
}

export const KIND_LABEL: Record<LedgerKind, string> = {
  depot: 'Dépôt',
  retrait: 'Retrait',
  ajustement: 'Ajustement',
  vente: 'Vente',
  taxe: 'Frais admin / Taxes',
  rachat: 'Rachat',
  revente: 'Revente occasion',
}

const TABLE = 'armurerie_ledger'

/* eslint-disable @typescript-eslint/no-explicit-any */
const toEntry = (r: any): LedgerEntry => ({
  id: r.id,
  kind: r.kind,
  author: r.author ?? '',
  label: r.label ?? '',
  amount: Number(r.amount),
  createdAt: Date.parse(r.created_at),
  manual: true,
})

interface LedgerState {
  available: boolean | null
  entries: LedgerEntry[]
  load: () => Promise<void>
  add: (e: { kind: 'depot' | 'retrait' | 'ajustement'; author: string; label: string; amount: number }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useLedger = create<LedgerState>((set) => ({
  available: null,
  entries: [],
  load: async () => {
    if (!supabase) return set({ available: false })
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at')
    if (error) return set({ available: false })
    set({ available: true, entries: (data ?? []).map(toEntry) })
  },
  add: async (e) => {
    // dépôt = positif, retrait = négatif, ajustement = signé tel quel
    const amount = round2(e.kind === 'retrait' ? -Math.abs(e.amount) : e.kind === 'depot' ? Math.abs(e.amount) : e.amount)
    const entry: LedgerEntry = { id: uid(), kind: e.kind, author: e.author.trim(), label: e.label.trim(), amount, createdAt: Date.now(), manual: true }
    const { error } = await supabase!.from(TABLE).insert({ id: entry.id, kind: entry.kind, author: entry.author, label: entry.label, amount })
    if (error) throw new Error(error.message)
    set((s) => ({ entries: [...s.entries, entry] }))
  },
  remove: async (id) => {
    const { error } = await supabase!.from(TABLE).delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ entries: s.entries.filter((x) => x.id !== id) }))
  },
}))

export function subscribeLedger(onChange: () => void) {
  if (!supabase) return () => {}
  let t: ReturnType<typeof setTimeout> | undefined
  const ch = supabase
    .channel('armurerie-ledger')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      clearTimeout(t)
      t = setTimeout(onChange, 250)
    })
    .subscribe()
  return () => {
    clearTimeout(t)
    supabase!.removeChannel(ch)
  }
}

/** Toutes les lignes (auto + manuelles), triées par date, avec le solde courant après chaque ligne. */
export function buildJournal(orders: Order[], products: Product[], manual: LedgerEntry[], buybacks: Buyback[] = []) {
  const auto: LedgerEntry[] = []
  // armes d'occasion : rachat (−) puis revente (+)
  for (const b of buybacks) {
    auto.push({ id: `r-${b.id}`, kind: 'rachat', author: b.boughtBy ?? '—', label: `Rachat ${b.name} à ${b.boughtFrom}`, amount: -b.buyPrice, createdAt: b.boughtAt, manual: false })
    if (b.soldAt != null)
      auto.push({ id: `rv-${b.id}`, kind: 'revente', author: b.soldBy ?? '—', label: `Revente ${b.name} (occasion) à ${b.soldTo ?? '—'}`, amount: b.soldPrice ?? 0, createdAt: b.soldAt, manual: false })
  }
  for (const o of orders) {
    if (o.status !== 'payee' && o.status !== 'livree') continue
    auto.push({
      id: `v-${o.id}`,
      kind: 'vente',
      // comme en jeu : l'auteur est l'employé, le client apparaît dans le détail
      author: o.seller ?? '—',
      label: `Vente ${orderNo(o.number)} à ${o.clientName} — ${o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}`,
      amount: o.total,
      createdAt: o.createdAt,
      manual: false,
    })
    for (const i of o.items) {
      const tax = products.find((p) => p.id === i.productId)?.craftTax ?? 0
      if (!tax) continue
      auto.push({
        id: `t-${o.id}-${i.productId}`,
        kind: 'taxe',
        author: 'Banque',
        label: `Frais admin / Taxes : ${i.name} ×${i.qty}`,
        amount: -round2(tax * i.qty),
        createdAt: o.createdAt + 1, // juste après la vente
        manual: false,
      })
    }
  }
  const all = [...auto, ...manual].sort((a, b) => a.createdAt - b.createdAt)
  let balance = 0
  return all.map((e) => ({ ...e, balance: (balance = round2(balance + e.amount)) }))
}

export type Period = 'jour' | 'semaine' | 'mois'

/** Bornes [début, fin[ de la période décalée de `offset` (0 = actuelle, -1 = précédente…). */
export function periodRange(period: Period, offset: number) {
  const now = new Date()
  if (period === 'jour') {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    return { start: s.getTime(), end: new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1).getTime(), label: s.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }
  }
  if (period === 'semaine') {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
    const end = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7)
    const f = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return { start: monday.getTime(), end: end.getTime(), label: `Semaine du ${f(monday)} au ${f(new Date(end.getTime() - 86400000))}` }
  }
  const s = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const label = s.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return { start: s.getTime(), end: new Date(s.getFullYear(), s.getMonth() + 1, 1).getTime(), label: label[0].toUpperCase() + label.slice(1) }
}
