import { useState, useMemo, useRef, useEffect } from 'react'
import type { WizardState, CartItem, ShopCategory, ShopProduct, SavedProject } from '../../types'
import { STORES, SHOP_CATEGORIES, PRODUCT_CATALOG, generateStoreUrl, generateBom, getProductById } from '../../data/shopData'
import { useI18n } from '../../utils/i18n'
import { showToast } from '../../utils/toast'
import TypewriterText from '../TypewriterText'

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
const STORE_DOMAINS: Record<string, string> = {
  amazon: 'amazon.com', aliexpress: 'aliexpress.com', coupang: 'coupang.com',
  naver: 'shopping.naver.com', auction: 'auction.co.kr', '11st': '11st.co.kr',
  ebay: 'ebay.com', mouser: 'mouser.com', digikey: 'digikey.com',
}

function StoreLink({ store, product, onOpenBrowser }: {
  store: typeof STORES[number]; product: ShopProduct
  onOpenBrowser?: (url: string, storeName: string, storeColor: string) => void
}) {
  const domain = STORE_DOMAINS[store.id] || ''
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : ''
  const url = generateStoreUrl(store, product)
  return (
    <button
      onClick={() => onOpenBrowser?.(url, store.name, store.color)}
      className="w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110 hover:shadow-md"
      style={{ borderColor: `${store.color}25`, backgroundColor: `${store.color}08` }}
      title={store.name}>
      {faviconUrl ? (
        <img src={faviconUrl} alt={store.name} className="w-4 h-4 rounded-sm" />
      ) : (
        <span className="text-[8px] font-mono font-bold" style={{ color: store.color }}>{store.logoChar}</span>
      )}
    </button>
  )
}

/* ── Extract brand from product name ── */
function extractBrand(name: string): { brand: string; rest: string } {
  const BRANDS = ['NVIDIA', 'Hailo', 'Raspberry Pi', 'Intel', 'AMD', 'STM32', 'NUCLEO', 'ArduCam', 'RPLIDAR', 'Livox', 'TI', 'ReSpeaker', 'INMP', 'Sony', 'Coral', 'Google']
  for (const b of BRANDS) {
    if (name.startsWith(b)) return { brand: b, rest: name.slice(b.length).trim() }
  }
  const spaceIdx = name.indexOf(' ')
  if (spaceIdx > 0) return { brand: name.slice(0, spaceIdx), rest: name.slice(spaceIdx + 1) }
  return { brand: '', rest: name }
}

/* ================================================================
   Product Row (compact, for detail panel)
   ================================================================ */
function ProductRow({ product, onAdd, isRecommended, onOpenBrowser }: {
  product: ShopProduct; onAdd: (id: string, qty: number) => void; isRecommended: boolean
  onOpenBrowser?: (url: string, storeName: string, storeColor: string) => void
}) {
  const { t } = useI18n()
  const [qty, setQty] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const { brand, rest } = extractBrand(product.name)

  return (
    <div className="rounded-lg border border-white/6 bg-component hover:border-accent/15 transition-all">
      {/* Collapsed row: Brand → Product → Price */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-mono text-secondary/30 mt-0.5">{expanded ? '▾' : '▸'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {brand && <span className="text-sm font-mono text-accent/70 font-bold flex-shrink-0">{brand}</span>}
            {isRecommended && <span className="text-xs font-mono font-bold text-green-400 border border-green-500/20 rounded px-1.5 py-0.5 flex-shrink-0">BOM</span>}
          </div>
          <p className="text-base font-mono font-bold text-primary truncate leading-snug">{rest || product.name}</p>
          <p className="text-sm font-mono text-accent">${product.priceRange.min} ~ ${product.priceRange.max}</p>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-1.5 border-t border-white/5 space-y-2">
          <p className="text-sm text-secondary/50 font-mono">{product.description}</p>
          {product.specs && (
            <p className="text-sm font-mono text-secondary/40">
              <span className="text-secondary/30">SPEC</span> {product.specs}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs font-mono text-secondary/40 border border-white/6 rounded px-1.5 py-0.5">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex gap-1.5 flex-wrap flex-1">
              {STORES.map(s => <StoreLink key={s.id} store={s} product={product} onOpenBrowser={onOpenBrowser} />)}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center border border-white/10 rounded overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-2 py-1 text-sm font-mono text-secondary hover:bg-white/5">-</button>
                <span className="px-2 py-1 text-sm font-mono text-primary min-w-[28px] text-center">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="px-2 py-1 text-sm font-mono text-secondary hover:bg-white/5">+</button>
              </div>
              <button onClick={() => { onAdd(product.id, qty); showToast(`Added ${product.name}`, 'success') }}
                className="px-3 py-1.5 text-sm font-mono font-bold text-accent border border-accent/30 rounded hover:bg-accent/10 transition-colors">
                {t('shop.addToCart')}
              </button>
            </div>
          </div>
        </div>
      )}
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

    const recommendations: ShopProduct[] = []
    let response = ''

    if (q.includes('wire') || q.includes('wiring') || q.includes('전선') || q.includes('배선') || q.includes('awg')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'wiring').slice(0, 3))
      response = 'Here are wiring supplies I recommend. For power lines, 16AWG silicone wire is great. For signals, go with 22AWG solid core.'
    } else if (q.includes('terminal') || q.includes('터미널') || q.includes('housing') || q.includes('하우징') || q.includes('crimp') || q.includes('압착')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p =>
        p.id.includes('jst') || p.id.includes('yh396') || p.id.includes('crimp_terminal') || p.id.includes('crimp_tool')
      ))
      response = 'Here are connector and terminal kits. JST-XH (2.54mm) is standard for sensors. YH396/VH3.96 is great for power connections.'
    } else if (q.includes('bolt') || q.includes('screw') || q.includes('nut') || q.includes('나사') || q.includes('너트') || q.includes('볼트')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'fastener').slice(0, 4))
      response = 'Here are fastener kits. M3 is standard for PCB mounting, M2.5 for Raspberry Pi/SBC standoffs, and M4 for frame assembly.'
    } else if (q.includes('usb') || q.includes('port') || q.includes('포트')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.id.includes('usb_port') || p.id.includes('usb3') || p.id.includes('usbc')))
      response = 'Here are USB options: panel mount ports for enclosures, and cables for data/power.'
    } else if (q.includes('power') || q.includes('전원') || q.includes('adapter') || q.includes('어댑터')) {
      recommendations.push(...PRODUCT_CATALOG.filter(p => p.category === 'power').slice(0, 3))
      response = 'Here are power supply options. For Jetson boards, you need 65W+ USB-C PD. For Raspberry Pi, 27W USB-C is recommended.'
    } else if (q.includes('recommend') || q.includes('추천') || q.includes('suggest') || q.includes('what do i need')) {
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
        : `Based on your cart (${cartItems.length} items), here are my suggestions:`
    } else {
      const found = PRODUCT_CATALOG.filter(p =>
        p.name.toLowerCase().includes(q) || p.nameKo.includes(query) || p.tags.some(t => t.toLowerCase().includes(q))
      ).slice(0, 3)
      if (found.length > 0) {
        recommendations.push(...found)
        response = `Found ${found.length} matching product(s):`
      } else {
        response = 'I couldn\'t find an exact match. Try: wire, terminal, USB, bolt, screw, power, or ask for recommendations!'
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
        <button onClick={() => { onClearCart(); onBack() }} className="px-4 py-2 text-xs font-mono bg-accent text-background rounded-lg hover:bg-accent/80 transition-colors">Back to Procurement</button>
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
   Embedded Browser Panel — fetches via CORS proxy, renders as srcdoc
   ================================================================ */
function EmbeddedBrowser({ url, storeName, storeColor, onClose }: {
  url: string; storeName: string; storeColor: string; onClose: () => void
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setHtml(null)

    let cancelled = false
    const origin = (() => { try { return new URL(url).origin } catch { return '' } })()

    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
      .then(res => { if (!res.ok) throw new Error('proxy fail'); return res.json() })
      .then(data => {
        if (cancelled) return
        let content = (data.contents ?? '') as string
        // Inject <base> tag so relative URLs resolve correctly
        if (origin && !content.includes('<base')) {
          content = content.replace(/<head[^>]*>/i, (m) => `${m}<base href="${origin}/" target="_blank">`)
        }
        setHtml(content)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [url])

  const domain = (() => { try { return new URL(url).hostname } catch { return '' } })()
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : ''

  return (
    <div className="flex-1 border-l border-white/6 flex flex-col overflow-hidden">
      {/* Browser toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/6 bg-white/3 flex-shrink-0">
        {faviconUrl && <img src={faviconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />}
        <span className="text-[10px] font-mono font-bold text-primary flex-shrink-0">{storeName}</span>
        <div className="flex-1 mx-2 px-2.5 py-1 bg-background/80 border border-white/8 rounded-md overflow-hidden">
          <p className="text-[9px] font-mono text-secondary/60 truncate">{url}</p>
        </div>
        <button
          onClick={() => window.open(url, '_blank')}
          className="text-[9px] font-mono text-secondary hover:text-primary px-2 py-1 border border-white/10 rounded-md hover:bg-white/5 transition-colors flex-shrink-0"
          title="Open in new tab"
        >
          ↗ New Tab
        </button>
        <button
          onClick={onClose}
          className="text-secondary hover:text-primary transition-colors text-sm leading-none flex-shrink-0 ml-1"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#0e1017] flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3" style={{ borderColor: storeColor, borderTopColor: 'transparent' }} />
            <p className="text-xs font-mono text-secondary/60">Loading {storeName}...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-[#0e1017] flex flex-col items-center justify-center p-8 text-center z-10">
            <div className="w-12 h-12 rounded-xl border-2 flex items-center justify-center mb-4" style={{ borderColor: storeColor }}>
              <span className="text-lg" style={{ color: storeColor }}>!</span>
            </div>
            <h3 className="text-sm font-mono font-bold text-primary mb-2">Could not load page</h3>
            <p className="text-[10px] font-mono text-secondary/40 mb-5 max-w-xs">
              The proxy could not fetch this page. You can open it directly in a new tab.
            </p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold text-white transition-colors hover:opacity-80"
              style={{ backgroundColor: storeColor }}>
              Open {storeName} in New Tab ↗
            </a>
          </div>
        )}

        {html && (
          <iframe
            srcDoc={html}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={`${storeName} - Product Search`}
          />
        )}
      </div>
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
  const [embedBrowser, setEmbedBrowser] = useState<{ url: string; storeName: string; storeColor: string } | null>(null)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 7

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [selectedCat, search])

  const cartTotal = cartItems.reduce((s, c) => {
    const p = getProductById(c.productId)
    return { min: s.min + (p?.priceRange.min ?? 0) * c.quantity, max: s.max + (p?.priceRange.max ?? 0) * c.quantity }
  }, { min: 0, max: 0 })

  function handleAdd(productId: string, qty: number) {
    onAddToCart(productId, qty, state.projectName || null)
  }

  function handleOpenBrowser(url: string, storeName: string, storeColor: string) {
    setEmbedBrowser({ url, storeName, storeColor })
    setShowCart(false)
    setShowBot(false)
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

  /* ── Browse View (Master-Detail) ── */
  return (
    <div className="flex gap-0 h-[calc(100vh-8rem)]">

      {/* ══════ Left Panel: Category List ══════ */}
      <div className="w-56 flex-shrink-0 border-r border-white/6 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-white/6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('shop.searchProducts')}
            className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-[11px] font-mono text-primary placeholder:text-secondary/30 focus:outline-none focus:border-accent/50" />
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-[9px] font-mono text-secondary/40 uppercase tracking-widest px-2 mb-2">Components</p>

          {/* All */}
          <button onClick={() => setSelectedCat('all')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono mb-0.5 transition-colors flex items-center justify-between ${
              selectedCat === 'all' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-secondary hover:text-primary hover:bg-white/5 border border-transparent'}`}>
            <span>◆ All Parts</span>
            <span className="text-[10px] text-secondary/40">{PRODUCT_CATALOG.length}</span>
          </button>

          {ALL_CATS.map(cat => {
            const meta = SHOP_CATEGORIES[cat]
            const count = PRODUCT_CATALOG.filter(p => p.category === cat).length
            const hasBom = bom.some(b => {
              const prod = getProductById(b.productId)
              return prod?.category === cat
            })
            return (
              <button key={cat} onClick={() => setSelectedCat(cat)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono mb-0.5 transition-colors flex items-center justify-between ${
                  selectedCat === cat ? 'bg-accent/10 text-accent border border-accent/20' : 'text-secondary hover:text-primary hover:bg-white/5 border border-transparent'}`}>
                <span className="flex items-center gap-2">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  {hasBom && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                </span>
                <span className="text-[10px] text-secondary/40">{count}</span>
              </button>
            )
          })}

          {/* BOM Quick Add */}
          {bom.length > 0 && (
            <>
              <div className="my-3 mx-2 border-t border-white/6" />
              <p className="text-[9px] font-mono text-green-400/60 uppercase tracking-widest px-2 mb-2">BOM ({bom.length})</p>
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
        </div>

        {/* Cart summary at bottom */}
        <div className="p-3 border-t border-white/6">
          <button onClick={() => setShowCart(c => !c)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-colors ${
              showCart ? 'bg-accent/10 text-accent border border-accent/20' : 'text-secondary border border-white/8 hover:bg-white/5'
            }`}>
            <span>Cart ({cartItems.length})</span>
            {cartItems.length > 0 && <span className="text-[10px] text-accent">${cartTotal.min.toFixed(0)}</span>}
          </button>
          {cartItems.length > 0 && (
            <button onClick={() => { setShowCart(false); setView('checkout') }}
              className="w-full mt-1.5 py-2 bg-accent text-background text-[10px] font-mono font-bold rounded-lg hover:bg-accent/80 transition-colors">
              {t('shop.checkout')} →
            </button>
          )}
        </div>
      </div>

      {/* ══════ Right Panel: Product Detail List ══════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('select-project')} className="text-[10px] font-mono text-secondary/50 hover:text-primary transition-colors">← Projects</button>
            <div className="w-px h-4 bg-white/8" />
            <h2 className="text-sm font-mono font-bold text-primary">
              {selectedCat === 'all' ? 'All Parts' : `${SHOP_CATEGORIES[selectedCat].icon} ${SHOP_CATEGORIES[selectedCat].label}`}
            </h2>
            <span className="text-[10px] font-mono text-secondary/40">{filtered.length} items</span>
          </div>
          <button onClick={() => setShowBot(b => !b)}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-colors ${showBot ? 'border-accent/40 text-accent bg-accent/10' : 'border-white/10 text-secondary hover:text-primary'}`}>
            {t('shop.aiBot')}
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Product list */}
          <div className={`overflow-y-auto p-3 flex flex-col ${embedBrowser ? 'w-[400px] flex-shrink-0' : 'flex-1 max-w-[560px]'}`}>
            <div className="space-y-1 flex-1">
              {paginatedItems.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-secondary font-mono text-sm">{t('shop.noProducts')}</p>
                  <p className="text-secondary/40 font-mono text-xs mt-1">Try a different category or search term</p>
                </div>
              )}
              {paginatedItems.map(p => (
                <ProductRow key={p.id} product={p} onAdd={handleAdd} isRecommended={bomProductIds.has(p.id)} onOpenBrowser={handleOpenBrowser} />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-white/6 flex-shrink-0">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-2.5 py-1.5 text-sm font-mono text-secondary border border-white/8 rounded hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`min-w-[32px] py-1.5 text-sm font-mono font-bold rounded transition-colors ${
                      n === currentPage ? 'bg-accent/20 text-accent border border-accent/30' : 'text-secondary border border-white/8 hover:text-primary'
                    }`}>{n}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 text-sm font-mono text-secondary border border-white/8 rounded hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">→</button>
              </div>
            )}
          </div>

          {/* ── Embedded Browser Panel ── */}
          {embedBrowser && (
            <EmbeddedBrowser
              url={embedBrowser.url}
              storeName={embedBrowser.storeName}
              storeColor={embedBrowser.storeColor}
              onClose={() => setEmbedBrowser(null)}
            />
          )}

          {/* ── Side panel: Cart or Bot (only when no embed browser) ── */}
          {!embedBrowser && (showCart || showBot) && (
            <div className="w-72 flex-shrink-0 border-l border-white/6 flex flex-col overflow-hidden">
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
