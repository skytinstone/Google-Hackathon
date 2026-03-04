import { useState, useMemo, useRef, useEffect } from 'react'
import type { WizardState, CartItem, ShopCategory, ShopProduct, SavedProject } from '../../types'
import { STORES, SHOP_CATEGORIES, PRODUCT_CATALOG, generateStoreUrl, generateBom, getProductById } from '../../data/shopData'
import { useI18n } from '../../utils/i18n'
import { showToast } from '../../utils/toast'
import { subscribe as subscribeLogs, type LogEntry, type LogType } from '../../utils/syslog'
import TypewriterText from '../TypewriterText'

/* ── Inline System Log for sidebar ── */
const LOG_STYLE: Record<LogType, string> = {
  AUTH: 'text-green-400', NAV: 'text-accent', STEP: 'text-accent', ACT: 'text-primary/50',
  OK: 'text-green-400', ERR: 'text-red-400', INIT: 'text-yellow-400', GEN: 'text-yellow-400',
}

function SidebarSystemLog() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  useEffect(() => subscribeLogs(setEntries), [])
  if (entries.length === 0) return null
  return (
    <div className="mt-auto pt-3 border-t border-white/8">
      <p className="text-[9px] font-mono text-secondary/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Navigate Log
      </p>
      <div className="space-y-0.5 max-h-[140px] overflow-y-auto">
        {entries.slice(0, 5).map((e, i) => (
          <div key={e.id} className={`text-[9px] font-mono leading-tight ${i === 0 ? 'opacity-100' : 'opacity-60'}`}>
            <span className="text-secondary/20 mr-1">{e.time}</span>
            <span className={`${LOG_STYLE[e.type]} font-bold mr-1`}>{e.type}</span>
            <span className="text-secondary/50">▸ {e.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Props {
  state: WizardState
  cartItems: CartItem[]
  onAddToCart: (productId: string, quantity: number, sourceProjectId: string | null) => void
  onRemoveFromCart: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onClearCart: () => void
  savedProjects?: SavedProject[]
}

type View = 'select-project' | 'browse' | 'checkout'

const ALL_CATS: ShopCategory[] = ['main_board', 'sensor', 'cable', 'wiring', 'fastener', 'power', 'frame', 'accessory']

/* ================================================================
   Store Link
   ================================================================ */
function StoreLink({ store, product }: { store: typeof STORES[number]; product: ShopProduct }) {
  return (
    <a href={generateStoreUrl(store, product)} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold transition-colors hover:opacity-80"
      style={{ borderColor: `${store.color}30`, color: store.color, backgroundColor: `${store.color}08` }}>
      {store.logoChar}
    </a>
  )
}

/* ================================================================
   Product Card
   ================================================================ */
function ProductCard({ product, onAdd, isRecommended }: {
  product: ShopProduct; onAdd: (id: string, qty: number) => void; isRecommended: boolean
}) {
  const [qty, setQty] = useState(1)
  const cat = SHOP_CATEGORIES[product.category]
  return (
    <div className="p-4 rounded-xl border border-white/8 bg-component hover:border-accent/20 transition-all group">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[9px] font-mono text-secondary/50 uppercase tracking-widest">{cat.icon} {cat.label}</span>
        {isRecommended && <span className="text-[8px] font-mono font-bold text-green-400 border border-green-500/20 rounded px-1.5 py-0.5">BOM</span>}
      </div>
      <h4 className="text-sm font-mono font-bold text-primary leading-tight mb-1">{product.name}</h4>
      <p className="text-[10px] text-secondary/60 font-mono mb-2 line-clamp-2">{product.description}</p>
      <p className="text-xs font-mono text-accent mb-2">${product.priceRange.min} ~ ${product.priceRange.max}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {product.tags.slice(0, 4).map(t => (
          <span key={t} className="text-[8px] font-mono text-secondary/50 border border-white/8 rounded px-1.5 py-0.5">{t}</span>
        ))}
      </div>
      {/* Store links */}
      <div className="flex flex-wrap gap-1 mb-3">
        {STORES.map(s => <StoreLink key={s.id} store={s} product={product} />)}
      </div>
      {/* Add to cart */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-2 py-1 text-xs font-mono text-secondary hover:bg-white/5">-</button>
          <span className="px-2 py-1 text-xs font-mono text-primary min-w-[24px] text-center">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="px-2 py-1 text-xs font-mono text-secondary hover:bg-white/5">+</button>
        </div>
        <button onClick={() => { onAdd(product.id, qty); showToast(`Added ${product.name}`, 'success') }}
          className="flex-1 py-1.5 text-[10px] font-mono font-bold text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors">
          {t('shop.addToCart')}
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   ChatBot (Procurement Assistant)
   ================================================================ */
interface ChatMsg { role: 'user' | 'bot'; text: string; actions?: { label: string; productId: string }[] }

function ProcurementBot({ cartItems, onAddToCart }: {
  cartItems: CartItem[]
  onAddToCart: (id: string, qty: number) => void
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'bot', text: 'I\'m your Procurement Assistant. I can recommend compatible parts, suggest wiring accessories, and add items to your cart. Try asking about connectors, terminals, or compatible accessories!' },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  function processQuery(query: string) {
    const q = query.toLowerCase()
    const newMsgs: ChatMsg[] = [...msgs, { role: 'user', text: query }]

    // Smart matching
    const recommendations: ShopProduct[] = []
    let response = ''

    if (q.includes('wire') || q.includes('wiring') || q.includes('전선') || q.includes('배선') || q.includes('awg')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'wiring').slice(0, 3))
      response = 'Here are wiring supplies I recommend. For power lines, 16AWG silicone wire is great. For signals, go with 22AWG solid core. Don\'t forget heat shrink tubing for insulation!'
    } else if (q.includes('terminal') || q.includes('터미널') || q.includes('housing') || q.includes('하우징') || q.includes('crimp') || q.includes('압착')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p =>
        p.id.includes('jst') || p.id.includes('yh396') || p.id.includes('crimp_terminal') || p.id.includes('crimp_tool')
      ))
      response = 'Here are connector and terminal kits. JST-XH (2.54mm) is standard for sensors. YH396/VH3.96 is great for power connections. I\'ve included a crimping tool too!'
    } else if (q.includes('bolt') || q.includes('screw') || q.includes('nut') || q.includes('나사') || q.includes('너트') || q.includes('볼트')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'fastener').slice(0, 4))
      response = 'Here are fastener kits. M3 is standard for PCB mounting, M2.5 for Raspberry Pi/SBC standoffs, and M4 for frame assembly.'
    } else if (q.includes('usb') || q.includes('port') || q.includes('포트')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.id.includes('usb_port') || p.id.includes('usb3') || p.id.includes('usbc')))
      response = 'Here are USB options: panel mount ports for enclosures, and cables for data/power. USB-C is recommended for modern setups.'
    } else if (q.includes('power') || q.includes('전원') || q.includes('adapter') || q.includes('어댑터')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'power').slice(0, 3))
      response = 'Here are power supply options. For Jetson boards, you need 65W+ USB-C PD. For Raspberry Pi, 27W USB-C is recommended.'
    } else if (q.includes('recommend') || q.includes('추천') || q.includes('suggest') || q.includes('what do i need')) {
      // Check cart and suggest complementary items
      const cartProductIds = cartItems.map(c => c.productId)
      const cartProducts = cartProductIds.map(id => getProductById(id)).filter(Boolean) as ShopProduct[]
      const hasWiring = cartProducts.some(p => p.category === 'wiring')
      const hasFasteners = cartProducts.some(p => p.category === 'fastener')
      const hasPower = cartProducts.some(p => p.category === 'power')

      if (!hasWiring) recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'wiring').slice(0, 2))
      if (!hasFasteners) recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'fastener').slice(0, 2))
      if (!hasPower) recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'power').slice(0, 1))

      response = cartItems.length === 0
        ? 'Your cart is empty. Start by selecting a project and adding main components, then I can suggest accessories!'
        : `Based on your cart (${cartItems.length} items), I recommend adding:${!hasWiring ? ' wiring supplies,' : ''}${!hasFasteners ? ' fasteners,' : ''}${!hasPower ? ' power supply,' : ''} here are my suggestions:`
    } else {
      // General keyword search
      const found = PRODUCT_CATALOG.filter(p =>
        p.name.toLowerCase().includes(q) || p.nameKo.includes(query) || p.tags.some(t => t.toLowerCase().includes(q))
      ).slice(0, 3)
      if (found.length > 0) {
        recommendations.push(...found)
        response = `Found ${found.length} matching product(s):`
      } else {
        response = 'I couldn\'t find an exact match. Try searching for: wire, terminal, USB, bolt, screw, power, or ask me for recommendations!'
      }
    }

    const actions = recommendations.map(p => ({ label: `${p.name} ($${p.priceRange.min})`, productId: p.id }))
    newMsgs.push({ role: 'bot', text: response, actions: actions.length > 0 ? actions : undefined })
    setMsgs(newMsgs)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-mono font-bold text-primary">Procurement Assistant</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl px-3 py-2 text-xs font-mono ${
              m.role === 'user' ? 'bg-accent/20 text-primary' : 'bg-white/5 text-secondary'
            }`}>
              <p className="leading-relaxed">{m.text}</p>
              {m.actions && (
                <div className="mt-2 space-y-1.5">
                  {m.actions.map(a => (
                    <button key={a.productId} onClick={() => { onAddToCart(a.productId, 1); showToast('Added to cart', 'success') }}
                      className="w-full text-left px-2 py-1.5 rounded-lg border border-accent/20 text-accent text-[10px] hover:bg-accent/10 transition-colors flex items-center justify-between">
                      <span className="truncate mr-2">{a.label}</span>
                      <span className="flex-shrink-0 text-[8px] opacity-60">+ Cart</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); if (!input.trim()) return; processQuery(input.trim()); setInput('') }}
        className="p-3 border-t border-white/8 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about parts..."
          className="flex-1 bg-background/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50" />
        <button type="submit" className="px-3 py-2 bg-accent/20 text-accent text-xs font-mono font-bold rounded-lg hover:bg-accent/30 transition-colors">Send</button>
      </form>
    </div>
  )
}

/* ================================================================
   Checkout Panel
   ================================================================ */
function CheckoutPanel({ cartItems, onBack, onClearCart }: {
  cartItems: CartItem[]; onBack: () => void; onClearCart: () => void
}) {
  const [step, setStep] = useState<'review' | 'shipping' | 'payment' | 'done'>('review')
  const [shipping, setShipping] = useState({ name: '', address: '', phone: '', email: '' })

  const products = cartItems.map(c => ({ ...c, product: getProductById(c.productId) })).filter(c => c.product)
  const totalMin = products.reduce((s, c) => s + (c.product!.priceRange.min * c.quantity), 0)
  const totalMax = products.reduce((s, c) => s + (c.product!.priceRange.max * c.quantity), 0)

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center text-3xl mb-4">✓</div>
        <h3 className="text-xl font-bold font-mono text-primary mb-2">Order Submitted</h3>
        <p className="text-xs font-mono text-secondary mb-6">Your procurement request has been processed. External store links will open for final purchase.</p>
        <div className="flex gap-3">
          <button onClick={() => { onClearCart(); onBack() }} className="px-4 py-2 text-xs font-mono bg-accent text-background rounded-lg hover:bg-accent/80 transition-colors">Back to Procurement</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {['review', 'shipping', 'payment'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              step === s ? 'bg-accent text-background' : 'bg-white/10 text-secondary'
            }`}>{i + 1}</span>
            <span className="text-xs font-mono text-secondary capitalize">{s}</span>
            {i < 2 && <span className="text-secondary/30 mx-1">→</span>}
          </div>
        ))}
      </div>

      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-mono text-primary">Order Review</h3>
          <div className="space-y-2">
            {products.map(c => (
              <div key={c.productId} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 bg-component">
                <div>
                  <p className="text-xs font-mono text-primary font-bold">{c.product!.name}</p>
                  <p className="text-[10px] font-mono text-secondary">Qty: {c.quantity}</p>
                </div>
                <p className="text-xs font-mono text-accent">${(c.product!.priceRange.min * c.quantity).toFixed(0)} ~ ${(c.product!.priceRange.max * c.quantity).toFixed(0)}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-accent/20 bg-accent/5">
            <span className="text-sm font-mono font-bold text-primary">Estimated Total</span>
            <span className="text-sm font-mono font-bold text-accent">${totalMin.toFixed(0)} ~ ${totalMax.toFixed(0)}</span>
          </div>
          <button onClick={() => setStep('shipping')} className="w-full py-3 bg-accent text-background text-sm font-mono font-bold rounded-lg hover:bg-accent/80 transition-colors">Continue to Shipping</button>
          <button onClick={onBack} className="w-full py-2 text-xs font-mono text-secondary hover:text-primary transition-colors">← Back to Browse</button>
        </div>
      )}

      {step === 'shipping' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-mono text-primary">Shipping Information</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Full Name', placeholder: 'Minseok Shin' },
              { key: 'phone', label: 'Phone', placeholder: '010-XXXX-XXXX' },
              { key: 'email', label: 'Email', placeholder: 'email@example.com' },
              { key: 'address', label: 'Address', placeholder: 'Seoul, South Korea' },
            ].map(f => (
              <div key={f.key} className={f.key === 'address' ? 'col-span-2' : ''}>
                <label className="block text-[10px] font-mono text-secondary uppercase tracking-widest mb-1">{f.label}</label>
                <input value={shipping[f.key as keyof typeof shipping]} onChange={e => setShipping(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  className="w-full bg-background/60 border border-white/10 rounded-lg px-3 py-2.5 text-xs font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50" />
              </div>
            ))}
          </div>
          <button onClick={() => setStep('payment')} disabled={!shipping.name || !shipping.address}
            className="w-full py-3 bg-accent text-background text-sm font-mono font-bold rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Continue to Payment</button>
          <button onClick={() => setStep('review')} className="w-full py-2 text-xs font-mono text-secondary hover:text-primary transition-colors">← Back</button>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-mono text-primary">Payment</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'redirect', label: 'Open in Store', desc: 'Redirect to each store for individual purchase', icon: '↗' },
              { id: 'quote', label: 'Request Quote', desc: 'Send procurement request to suppliers', icon: '✉' },
            ].map(m => (
              <button key={m.id} onClick={() => {
                if (m.id === 'redirect') {
                  // Open first store for each product
                  products.slice(0, 3).forEach(c => {
                    const url = generateStoreUrl(STORES[0], c.product!)
                    window.open(url, '_blank')
                  })
                }
                setStep('done')
              }}
                className="p-5 rounded-xl border border-white/8 bg-component hover:border-accent/30 transition-all text-left">
                <span className="text-2xl mb-2 block">{m.icon}</span>
                <p className="text-sm font-mono font-bold text-primary">{m.label}</p>
                <p className="text-[10px] font-mono text-secondary mt-1">{m.desc}</p>
              </button>
            ))}
          </div>
          <div className="p-4 rounded-xl border border-accent/20 bg-accent/5">
            <p className="text-[10px] font-mono text-secondary mb-1">Total: <span className="text-accent font-bold">${totalMin.toFixed(0)} ~ ${totalMax.toFixed(0)}</span></p>
            <p className="text-[10px] font-mono text-secondary/50">Prices are estimates. Final prices may vary by store.</p>
          </div>
          <button onClick={() => setStep('shipping')} className="w-full py-2 text-xs font-mono text-secondary hover:text-primary transition-colors">← Back</button>
        </div>
      )}
    </div>
  )
}


/* ================================================================
   Main ShopPage
   ================================================================ */
export default function ShopPage({ state, cartItems, onAddToCart, onRemoveFromCart, onUpdateQuantity, onClearCart, savedProjects }: Props) {
  const { t } = useI18n()
  const [view, setView] = useState<View>(state.projectName ? 'browse' : 'select-project')
  const [selectedCat, setSelectedCat] = useState<ShopCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showBot, setShowBot] = useState(false)

  const bom = useMemo(() => state.hardware ? generateBom(state) : [], [state])
  const bomProductIds = useMemo(() => new Set(bom.map(b => b.productId)), [bom])

  const filtered = useMemo(() => {
    let list = selectedCat === 'all' ? PRODUCT_CATALOG : PRODUCT_CATALOG.filter(p => p.category === selectedCat)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.nameKo.includes(search) || p.tags.some(t => t.toLowerCase().includes(q)))
    }
    return list
  }, [selectedCat, search])

  const cartTotal = cartItems.reduce((s, c) => {
    const p = getProductById(c.productId)
    return { min: s.min + (p?.priceRange.min ?? 0) * c.quantity, max: s.max + (p?.priceRange.max ?? 0) * c.quantity }
  }, { min: 0, max: 0 })

  function handleAdd(productId: string, qty: number) {
    onAddToCart(productId, qty, state.projectName || null)
  }

  /* ── Project Selection View ── */
  if (view === 'select-project') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary font-mono tracking-tight">
            <TypewriterText text={t('shop.title')} speed={35} />
          </h1>
          <p className="text-xs text-secondary/50 font-mono mt-1">{t('shop.subtitle')}</p>
        </div>

        <div className="p-6 rounded-xl border border-white/8 bg-component mb-4">
          <p className="text-sm font-mono text-primary font-bold mb-4">{t('shop.selectProject')}</p>
          <p className="text-xs font-mono text-secondary mb-4">{t('shop.selectProjectDesc')}</p>

          {state.projectName ? (
            <button onClick={() => setView('browse')}
              className="w-full p-4 rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors text-left">
              <p className="text-sm font-mono font-bold text-accent">{state.projectName}</p>
              <p className="text-[10px] font-mono text-secondary mt-1">
                {state.hardware?.device ?? 'No hardware'} · {state.sensors.length} sensor(s) · {state.domain ?? 'No domain'}
              </p>
            </button>
          ) : (
            <p className="text-xs font-mono text-secondary/50 p-4 border border-dashed border-white/10 rounded-xl text-center">
              {t('shop.noProject')}
            </p>
          )}

          {savedProjects && savedProjects.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-mono text-secondary/50 uppercase tracking-widest">{t('shop.savedProjects')}</p>
              {savedProjects.slice(0, 5).map(p => (
                <button key={p.id} onClick={() => setView('browse')}
                  className="w-full p-3 rounded-xl border border-white/8 hover:border-accent/20 transition-colors text-left">
                  <p className="text-xs font-mono font-bold text-primary">{p.name}</p>
                  <p className="text-[10px] font-mono text-secondary">{p.hardware ?? 'N/A'} · {p.sensors?.length ?? 0} sensors</p>
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setView('browse')} className="mt-4 w-full py-2.5 text-xs font-mono text-secondary border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
            {t('shop.skipBrowse')}
          </button>
        </div>
      </div>
    )
  }

  /* ── Checkout View ── */
  if (view === 'checkout') {
    return <CheckoutPanel cartItems={cartItems} onBack={() => setView('browse')} onClearCart={onClearCart} />
  }

  /* ── Browse View ── */
  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">

      {/* ── Left Sidebar (Categories) ── */}
      <div className="w-48 flex-shrink-0 overflow-y-auto pr-2 flex flex-col">
        <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-widest mb-3">{t('shop.categories')}</p>
        <button onClick={() => setSelectedCat('all')}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono mb-1 transition-colors ${
            selectedCat === 'all' ? 'bg-accent/10 text-accent font-bold' : 'text-secondary hover:text-primary hover:bg-white/5'}`}>
          ◆ All ({PRODUCT_CATALOG.length})
        </button>
        {ALL_CATS.map(cat => {
          const meta = SHOP_CATEGORIES[cat]
          const count = PRODUCT_CATALOG.filter(p => p.category === cat).length
          return (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono mb-1 transition-colors ${
                selectedCat === cat ? 'bg-accent/10 text-accent font-bold' : 'text-secondary hover:text-primary hover:bg-white/5'}`}>
              {meta.icon} {meta.label} ({count})
            </button>
          )
        })}

        {/* BOM section */}
        {bom.length > 0 && (
          <>
            <div className="my-3 border-t border-white/8" />
            <p className="text-[10px] font-mono text-green-400/60 uppercase tracking-widest mb-2">BOM ({bom.length})</p>
            <button onClick={() => { bom.filter(b => b.required).forEach(b => handleAdd(b.productId, b.quantity)); showToast('Required items added', 'success') }}
              className="w-full px-3 py-2 rounded-lg text-[10px] font-mono text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors mb-1">
              + Add Required ({bom.filter(b => b.required).length})
            </button>
            <button onClick={() => { bom.forEach(b => handleAdd(b.productId, b.quantity)); showToast('All BOM items added', 'success') }}
              className="w-full px-3 py-2 rounded-lg text-[10px] font-mono text-secondary border border-white/10 hover:bg-white/5 transition-colors">
              + Add All
            </button>
          </>
        )}

        <SidebarSystemLog />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <button onClick={() => setView('select-project')} className="text-xs font-mono text-secondary hover:text-primary transition-colors">{t('shop.projects')}</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('shop.searchProducts')}
            className="flex-1 bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50" />
          <button onClick={() => setShowBot(b => !b)}
            className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold transition-colors ${showBot ? 'border-accent/40 text-accent bg-accent/10' : 'border-white/10 text-secondary hover:text-primary'}`}>
            {t('shop.aiBot')}
          </button>
          <button onClick={() => setShowCart(c => !c)}
            className="relative px-3 py-2 rounded-lg border border-white/10 text-xs font-mono text-secondary hover:text-primary transition-colors">
            Cart
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center px-1 text-[9px] font-bold bg-red-500 text-white rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} onAdd={handleAdd} isRecommended={bomProductIds.has(p.id)} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-secondary font-mono text-sm">{t('shop.noProducts')}</p>
              </div>
            )}
          </div>

          {/* Right Panel: Cart or Bot */}
          {(showCart || showBot) && (
            <div className="w-72 flex-shrink-0 border border-white/8 rounded-xl bg-component overflow-hidden flex flex-col">
              {showBot ? (
                <ProcurementBot cartItems={cartItems} onAddToCart={handleAdd} />
              ) : (
                <div className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary">{t('shop.cart')} ({cartItems.length})</span>
                    {cartItems.length > 0 && (
                      <button onClick={onClearCart} className="text-[10px] font-mono text-red-400 hover:text-red-300">Clear</button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {cartItems.length === 0 ? (
                      <p className="text-center text-xs font-mono text-secondary/40 py-8">{t('shop.emptyCart')}</p>
                   ) : cartItems.map(c => {
                      const p = getProductById(c.productId)
                      if (!p) return null
                      return (
                        <div key={c.productId} className="p-2.5 rounded-lg border border-white/5 bg-white/3">
                          <p className="text-[10px] font-mono text-primary font-bold truncate">{p.name}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => c.quantity > 1 ? onUpdateQuantity(c.productId, c.quantity - 1) : onRemoveFromCart(c.productId)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white/5 text-[10px] text-secondary hover:text-primary">-</button>
                              <span className="text-[10px] font-mono text-primary w-5 text-center">{c.quantity}</span>
                              <button onClick={() => onUpdateQuantity(c.productId, c.quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white/5 text-[10px] text-secondary hover:text-primary">+</button>
                            </div>
                            <span className="text-[10px] font-mono text-accent">${(p.priceRange.min * c.quantity).toFixed(0)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {cartItems.length > 0 && (
                    <div className="p-3 border-t border-white/8 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-secondary">Total</span>
                        <span className="text-xs font-mono font-bold text-accent">${cartTotal.min.toFixed(0)} ~ ${cartTotal.max.toFixed(0)}</span>
                      </div>
                      <button onClick={() => { setShowCart(false); setView('checkout') }}
                        className="w-full py-2.5 bg-accent text-background text-xs font-mono font-bold rounded-lg hover:bg-accent/80 transition-colors">
                        {t('shop.checkout')}
                      </button>
                      <button onClick={() => {
                        const csv = ['Product,Qty,Min Price,Max Price', ...cartItems.map(c => {
                          const p = getProductById(c.productId); return `"${p?.name}",${c.quantity},${p?.priceRange.min},${p?.priceRange.max}`
                        })].join('\n')
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leviosai_cart.csv'; a.click()
                        showToast('Cart exported', 'success')
                      }} className="w-full py-2 text-[10px] font-mono text-secondary border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                        {t('shop.exportCart')} (CSV)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
