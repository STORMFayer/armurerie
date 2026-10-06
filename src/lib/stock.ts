import { toast } from 'sonner'
import { create } from 'zustand'
import { supabase } from './db'
import type { OrderItem, Product } from './types'
import { round2 } from './utils'

/* ——— Stock de matières premières (cuir, planches, fer, plomb…) ———
 * Chaque vente consomme la recette des articles ; alerte quand une matière passe sous son seuil critique.
 * La vente n'est jamais bloquée (on peut encaisser même à 0).
 */

export interface Material {
  id: string
  name: string
  stock: number
  threshold: number
  unitCost: number
  position: number
}

const TABLE = 'armurerie_materials'

/* eslint-disable @typescript-eslint/no-explicit-any */
const toMaterial = (r: any): Material => ({
  id: r.id,
  name: r.name,
  stock: Number(r.stock),
  threshold: Number(r.threshold),
  unitCost: Number(r.unit_cost),
  position: Number(r.position),
})

interface StockState {
  available: boolean | null
  materials: Material[]
  load: () => Promise<void>
  /** applique un mouvement (+ réception, − consommation) en base et localement */
  adjust: (id: string, delta: number) => Promise<void>
  save: (m: Material) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useStock = create<StockState>((set, get) => ({
  available: null,
  materials: [],
  load: async () => {
    if (!supabase) return set({ available: false })
    const { data, error } = await supabase.from(TABLE).select('*').order('position')
    if (error) return set({ available: false })
    set({ available: true, materials: (data ?? []).map(toMaterial) })
  },
  adjust: async (id, delta) => {
    if (!delta) return
    set((s) => ({ materials: s.materials.map((m) => (m.id === id ? { ...m, stock: Math.max(0, round2(m.stock + delta)) } : m)) }))
    const { error } = await supabase!.rpc('armurerie_adjust_material', { p_id: id, p_delta: delta })
    if (error) toast.error(`Stock : ${error.message}`)
  },
  save: async (m) => {
    const { error } = await supabase!
      .from(TABLE)
      .upsert({ id: m.id, name: m.name, stock: m.stock, threshold: m.threshold, unit_cost: m.unitCost, position: m.position })
    if (error) throw new Error(error.message)
    set((s) => ({ materials: [...s.materials.filter((x) => x.id !== m.id), m].sort((a, b) => a.position - b.position) }))
  },
  remove: async (id) => {
    const { error } = await supabase!.from(TABLE).delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ materials: s.materials.filter((x) => x.id !== id) }))
    void get
  },
}))

export function subscribeStock(onChange: () => void) {
  if (!supabase) return () => {}
  let t: ReturnType<typeof setTimeout> | undefined
  const ch = supabase
    .channel('armurerie-stock')
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

export const isCritical = (m: Material) => m.stock <= m.threshold

/** Coût de fabrication d'un article : frais admin / taxes + matières (au coût unitaire saisi dans Stock). */
export function unitCost(p: Product | undefined, materials: Material[]) {
  if (!p) return 0
  let c = p.craftTax ?? 0
  for (const [id, q] of Object.entries(p.recipe ?? {})) c += q * (materials.find((m) => m.id === id)?.unitCost ?? 0)
  return round2(c)
}

/** true si l'article a une fiche de fabrication connue (taxe ou recette). */
export const hasCostSheet = (p: Product | undefined) => !!p && ((p.craftTax ?? 0) > 0 || Object.keys(p.recipe ?? {}).length > 0)

/** Quantités de matières consommées par une liste d'articles. */
export function consumption(items: OrderItem[], products: Product[]) {
  const need = new Map<string, number>()
  for (const i of items) {
    const r = products.find((p) => p.id === i.productId)?.recipe ?? {}
    for (const [id, q] of Object.entries(r)) need.set(id, (need.get(id) ?? 0) + q * i.qty)
  }
  return need
}

/** Mouvement de stock pour une vente : sign −1 = consomme, +1 = restitue (annulation / suppression). */
export async function moveStockFor(items: OrderItem[], products: Product[], sign: 1 | -1) {
  const st = useStock.getState()
  if (!st.available) return
  const need = consumption(items, products)
  const before = new Map(st.materials.map((m) => [m.id, isCritical(m)]))
  await Promise.all([...need].map(([id, q]) => st.adjust(id, sign * q)))
  if (sign < 0) {
    // alerte seulement pour les matières qui viennent de passer sous le seuil
    const crossed = useStock.getState().materials.filter((m) => isCritical(m) && !before.get(m.id) && need.has(m.id))
    for (const m of crossed) toast.warning(`Stock critique : ${m.name} (${m.stock}) — pensez à commander.`, { duration: 8000 })
  }
}
