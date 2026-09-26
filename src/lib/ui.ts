import { create } from 'zustand'

export type TabId = 'caisse' | 'commandes' | 'clients' | 'catalogue' | 'guide' | 'bilan'

/** État d'interface partagé (onglet actif) — non sauvegardé. */
export const useUi = create<{ tab: TabId; setTab: (t: TabId) => void }>((set) => ({
  tab: 'caisse',
  setTab: (tab) => {
    set({ tab })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
}))
