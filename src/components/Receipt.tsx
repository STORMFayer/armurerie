import { useStore } from '@/lib/store'
import type { Order } from '@/lib/types'
import { fmtDate, money, orderNo } from '@/lib/utils'
import { StatusStamp } from './ui'

export function Receipt({ order }: { order: Order }) {
  const settings = useStore((s) => s.settings)
  return (
    <div className="print-area parchment relative mx-auto max-w-sm p-6 font-type text-ink">
      <div className="text-center">
        <p className="font-western text-2xl">{settings.shopName}</p>
        <p className="text-xs italic text-sepia">{settings.town}</p>
        <p className="ornament my-2 text-xs">✦</p>
        <p className="text-sm">
          {orderNo(order.number)} — {fmtDate(order.createdAt)}
        </p>
        <p className="text-sm">Client : {order.clientName}</p>
      </div>

      <table className="mt-4 w-full text-sm">
        <tbody>
          {order.items.map((i) => (
            <tr key={i.productId} className="align-top">
              <td className="pr-2">
                {i.qty} × {i.name}
                {i.serials?.length ? <span className="block text-[11px] text-sepia">N° série : {i.serials.join(', ')}</span> : null}
              </td>
              <td className="text-right whitespace-nowrap">{money(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 space-y-0.5 border-t border-dashed border-sepia/60 pt-2 text-sm">
        <Line label="Sous-total" value={money(order.subtotal)} />
        {order.discount > 0 && <Line label={`Remise ${order.discountPct}%`} value={`− ${money(order.discount)}`} />}
        {order.tax > 0 && <Line label={`Taxe ${order.taxPct}%`} value={`+ ${money(order.tax)}`} />}
        <div className="flex justify-between border-t-2 border-double border-sepia/60 pt-1 text-lg">
          <span>TOTAL</span>
          <span>{money(order.total)}</span>
        </div>
        {order.received > 0 && (
          <>
            <Line label="Reçu" value={money(order.received)} />
            <Line label="Monnaie rendue" value={money(order.change)} />
          </>
        )}
      </div>

      {order.note && <p className="mt-3 text-xs italic">Note : {order.note}</p>}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs italic text-sepia">Merci, et bonne route.</p>
        <StatusStamp status={order.status} />
      </div>
    </div>
  )
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span>{value}</span>
  </div>
)
