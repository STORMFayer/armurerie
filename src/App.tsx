import * as Tabs from '@radix-ui/react-tabs'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Coins, Crosshair, Download, LayoutDashboard, ScrollText, Settings2, Upload, Users } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, Field, Modal, useConfirm } from '@/components/ui'
import { hasDb, subscribe } from '@/lib/db'
import { exportData, useStore } from '@/lib/store'
import { clamp, cn, toNum } from '@/lib/utils'
import Caisse from '@/pages/Caisse'
import Catalogue from '@/pages/Catalogue'
import Clients from '@/pages/Clients'
import Commandes from '@/pages/Commandes'
import Dashboard from '@/pages/Dashboard'
import Guide from '@/pages/Guide'
import { useUi, type TabId } from '@/lib/ui'

const TABS: { id: TabId; label: string; icon: ReactNode; page: () => ReactNode }[] = [
  { id: 'caisse', label: 'Caisse', icon: <Coins size={18} />, page: () => <Caisse /> },
  { id: 'commandes', label: 'Commandes', icon: <ScrollText size={18} />, page: () => <Commandes /> },
  { id: 'clients', label: 'Clients', icon: <Users size={18} />, page: () => <Clients /> },
  { id: 'catalogue', label: 'Catalogue', icon: <Crosshair size={18} />, page: () => <Catalogue /> },
  { id: 'guide', label: 'Guide', icon: <BookOpen size={18} />, page: () => <Guide /> },
  { id: 'bilan', label: 'Bilan', icon: <LayoutDashboard size={18} />, page: () => <Dashboard /> },
]

export default function App() {
  const { tab, setTab } = useUi()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settings = useStore((s) => s.settings)
  const pending = useStore((s) => s.orders.filter((o) => o.status === 'en_attente').length)
  const cartCount = useStore((s) => s.cart.items.reduce((n, i) => n + i.qty, 0))
  const ready = useStore((s) => s.ready)

  // Chargement depuis Supabase + synchro en direct avec les autres caisses
  useEffect(() => {
    if (!hasDb) return
    const { load } = useStore.getState()
    load()
    return subscribe(load)
  }, [])

  return (
    <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabId)} className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 sm:px-6">
      {/* ——— En-tête ——— */}
      <header className="pt-8 pb-4 text-center">
        <motion.p initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.35em' }} transition={{ duration: 1 }} className="font-sc text-sm text-brass uppercase">
          Armes · Munitions · Réparations
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="title-western mt-1 text-4xl text-parch sm:text-6xl"
        >
          {settings.shopName}
        </motion.h1>
        <p className="ornament mx-auto mt-2 max-w-md font-serif text-brass/80 italic">{settings.town}</p>
      </header>

      {/* ——— Navigation style menu RDR2 ——— */}
      <nav className="sticky top-0 z-30 -mx-4 mb-6 bg-gradient-to-b from-[#1a120c] via-[#1a120c]/95 to-transparent px-4 pt-2 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <Tabs.List className="flex flex-1 gap-1 overflow-x-auto scroll-thin" aria-label="Sections">
            {TABS.map((t) => (
              <Tabs.Trigger
                key={t.id}
                value={t.id}
                className={cn(
                  'relative flex cursor-pointer items-center gap-2 px-4 py-2.5 font-sc text-lg whitespace-nowrap uppercase transition-colors outline-none focus-visible:text-parch',
                  tab === t.id ? 'text-parch' : 'text-parch/50 hover:text-parch/85',
                )}
              >
                {tab === t.id && <motion.span layoutId="brush" className="brush absolute inset-x-0 inset-y-1 -z-0" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <span className="relative z-10 flex items-center gap-2">
                  {t.icon}
                  {t.label}
                  {t.id === 'caisse' && cartCount > 0 && <Badge>{cartCount}</Badge>}
                  {t.id === 'commandes' && pending > 0 && <Badge>{pending}</Badge>}
                </span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <button onClick={() => setSettingsOpen(true)} className="cursor-pointer rounded p-2 text-parch/60 transition hover:rotate-45 hover:text-brass" aria-label="Réglages">
            <Settings2 size={22} />
          </button>
        </div>
        <div className="mt-1 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
      </nav>

      {!ready ? (
        <div className="grid flex-1 place-items-center py-24 text-center">
          <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }} className="font-western text-2xl text-parch/80">
            Ouverture du registre…
          </motion.p>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {TABS.filter((t) => t.id === tab).map((t) => (
          <Tabs.Content key={t.id} value={t.id} forceMount asChild>
            <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex-1 outline-none">
              {t.page()}
            </motion.main>
          </Tabs.Content>
        ))}
      </AnimatePresence>
      )}

      <footer className="mt-10 text-center font-serif text-sm text-parch/35 italic">{hasDb ? 'Registre partagé en direct entre toutes les caisses — sauvegarde possible via ⚙.' : 'Données enregistrées dans ce navigateur — pensez à exporter une sauvegarde (⚙).'}</footer>

      <Modal open={settingsOpen} onOpenChange={setSettingsOpen} title="Réglages de la boutique">
        <SettingsForm onDone={() => setSettingsOpen(false)} />
      </Modal>
    </Tabs.Root>
  )
}

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brass px-1 font-type text-xs text-ink">{children}</span>
)

function SettingsForm({ onDone }: { onDone: () => void }) {
  const { settings, saveSettings, importData, resetAll } = useStore()
  const [shopName, setShopName] = useState(settings.shopName)
  const [town, setTown] = useState(settings.town)
  const [tax, setTax] = useState(String(settings.taxPct))
  const fileRef = useRef<HTMLInputElement>(null)
  const { ask, dialog } = useConfirm()

  function save() {
    saveSettings({ shopName: shopName.trim() || 'Armurerie', town: town.trim(), taxPct: clamp(toNum(tax), 0, 100) })
    toast.success('Réglages enregistrés.')
    onDone()
  }

  function download() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `armurerie-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Sauvegarde téléchargée.')
  }

  async function upload(file: File) {
    try {
      const data = JSON.parse(await file.text())
      if (!(await ask('Importer cette sauvegarde remplacera toutes les données actuelles. Continuer ?'))) return
      if (importData(data)) {
        toast.success('Sauvegarde restaurée.')
        onDone()
      } else toast.error('Fichier de sauvegarde invalide.')
    } catch {
      toast.error('Impossible de lire ce fichier.')
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Nom de la boutique">
        <input className="field" value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={60} />
      </Field>
      <Field label="Ville / adresse">
        <input className="field" value={town} onChange={(e) => setTown(e.target.value)} maxLength={80} />
      </Field>
      <Field label="Taxe appliquée (%)" hint="0 pour ne pas appliquer de taxe.">
        <input className="field" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button variant="blood" onClick={save}>
          Enregistrer
        </Button>
      </div>

      <p className="ornament pt-2 font-sc">Données</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="ink" onClick={download}>
          <Download size={16} /> Exporter
        </Button>
        <Button variant="ink" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Importer
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ''
          }}
        />
      </div>
      <Button
        variant="ghost"
        className="w-full text-blood"
        onClick={async () => {
          if (await ask('Tout effacer (clients, commandes, catalogue) et repartir de zéro ?')) {
            resetAll()
            toast('Registre remis à zéro.')
            onDone()
          }
        }}
      >
        Tout remettre à zéro
      </Button>
      {dialog}
    </div>
  )
}
