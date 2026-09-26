import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderItem } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const moneyFmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money = (n: number) => `$${moneyFmt.format(round2(n))}`

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const orderNo = (n: number) => `N° ${String(n).padStart(4, '0')}`

export function computeTotals(items: OrderItem[], discountPct: number, taxPct: number) {
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0))
  const discount = round2((subtotal * clamp(discountPct, 0, 100)) / 100)
  const tax = round2(((subtotal - discount) * Math.max(0, taxPct)) / 100)
  const total = round2(subtotal - discount + tax)
  return { subtotal, discount, tax, total }
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const isToday = (ts: number) => new Date(ts).toDateString() === new Date().toDateString()

/** Nombre saisi → nombre valide ≥ 0 */
export const toNum = (v: string) => {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}
