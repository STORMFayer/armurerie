import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { STATUS_LABEL, type OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type Variant = 'blood' | 'ink' | 'ghost' | 'brass'

const variants: Record<Variant, string> = {
  blood:
    'bg-blood text-parch border-blood-2 hover:bg-blood-2 shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_2px_0_#3d0709]',
  ink: 'bg-ink text-parch border-black hover:bg-wood-3 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_2px_0_#000]',
  ghost: 'bg-transparent text-sepia border-sepia/40 hover:bg-sepia/10 hover:text-ink',
  brass: 'bg-brass text-ink border-[#8a6a2a] hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_2px_0_#5a4418]',
}

export function Button({
  variant = 'ink',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[2px] border font-sc tracking-wide transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' && 'px-2.5 py-1 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-5 py-3 text-lg',
        variants[variant],
        className,
      )}
    />
  )
}

export function Panel({ title, icon, actions, className, children }: { title?: ReactNode; icon?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn('parchment parchment-inner-border p-5 sm:p-6', className)}>
      {(title || actions) && (
        <header className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 font-western text-xl text-ink sm:text-2xl">
              {icon && <span className="text-blood">{icon}</span>}
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block font-sc text-sm text-sepia">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs italic text-sepia-2">{hint}</span>}
    </label>
  )
}

const statusColor: Record<OrderStatus, string> = {
  en_attente: 'text-[#9a6a12]',
  payee: 'text-sage',
  livree: 'text-[#2f4a63]',
  annulee: 'text-blood',
}

export const StatusStamp = ({ status }: { status: OrderStatus }) => <span className={cn('stamp', statusColor[status])}>{STATUS_LABEL[status]}</span>

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                className={cn(
                  'parchment parchment-inner-border fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto p-6 scroll-thin focus:outline-none',
                  wide ? 'max-w-2xl' : 'max-w-lg',
                )}
                initial={{ opacity: 0, x: '-50%', y: '-46%', rotate: -1.2, scale: 0.96 }}
                animate={{ opacity: 1, x: '-50%', y: '-50%', rotate: 0, scale: 1 }}
                exit={{ opacity: 0, x: '-50%', y: '-46%', rotate: 1, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                <div className="relative z-10">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <Dialog.Title className="font-western text-2xl text-ink">{title}</Dialog.Title>
                    <Dialog.Close className="cursor-pointer rounded p-1 text-sepia hover:bg-sepia/10 hover:text-blood" aria-label="Fermer">
                      <X size={20} />
                    </Dialog.Close>
                  </div>
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

/** Petit hook pour une confirmation « Êtes-vous sûr ? » en parchemin. */
export function useConfirm() {
  const [state, setState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null)
  const ask = (message: string) => new Promise<boolean>((resolve) => setState({ message, resolve }))
  const close = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }
  const dialog = (
    <Modal open={!!state} onOpenChange={(o) => !o && close(false)} title="Êtes-vous certain ?">
      <p className="mb-6 text-lg text-ink">{state?.message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => close(false)}>
          Non
        </Button>
        <Button variant="blood" onClick={() => close(true)}>
          Oui, j'en suis sûr
        </Button>
      </div>
    </Modal>
  )
  return { ask, dialog }
}

export function Empty({ icon, children, vivid }: { icon: ReactNode; children: ReactNode; vivid?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-sepia">
      <span className={vivid ? '' : 'opacity-60'}>{icon}</span>
      <p className="italic">{children}</p>
    </div>
  )
}

export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: string; icon: ReactNode }) {
  return (
    <div className="parchment parchment-inner-border p-5">
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="font-sc text-sepia">{label}</p>
          <p className="mt-1 font-type text-3xl text-ink">{value}</p>
          {sub && <p className="mt-1 text-sm italic text-sepia-2">{sub}</p>}
        </div>
        <span className="text-blood">{icon}</span>
      </div>
    </div>
  )
}
