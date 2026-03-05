import { useState, useEffect } from 'react'
import { getGeoInfo, type GeoInfo } from '../utils/geoInfo'

function formatTz(tz: string, now: Date): string {
  return now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatDate(now: Date): string {
  return now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

export default function SystemInfoPanel() {
  const [tick, setTick] = useState(0)
  const [net, setNet] = useState<GeoInfo | null>(null)
  const [weather, setWeather] = useState<{ temp: string; desc: string; icon: string } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    getGeoInfo().then(geo => {
      setNet(geo)
      if (geo.latitude && geo.longitude) {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,weather_code&timezone=auto`)
          .then(r => r.json())
          .then((w: { current: { temperature_2m: number; weather_code: number } }) => {
            const code = w.current.weather_code
            let desc = 'Clear'; let icon = '☀'
            if (code >= 1 && code <= 3) { desc = 'Cloudy'; icon = '⛅' }
            else if (code >= 45 && code <= 48) { desc = 'Foggy'; icon = '🌫' }
            else if (code >= 51 && code <= 67) { desc = 'Rainy'; icon = '🌧' }
            else if (code >= 71 && code <= 77) { desc = 'Snowy'; icon = '❄' }
            else if (code >= 80 && code <= 99) { desc = 'Stormy'; icon = '⛈' }
            setWeather({ temp: `${w.current.temperature_2m}°C`, desc, icon })
          })
          .catch(() => setWeather({ temp: '—', desc: 'Unavailable', icon: '—' }))
      }
    })
  }, [])

  const liveNow = new Date(Date.now() + tick * 0)
  const trafficKb = 128 + Math.floor(Math.sin(tick * 0.3) * 40 + Math.random() * 20)

  const T = 'text-green-400'       // title / label — green
  const V = 'text-white/80'        // value / data — white
  const D = 'text-green-400/50'    // dim section header
  const L = 'text-[10px] font-mono leading-relaxed'

  return (
    <div className="fixed pointer-events-none select-none" style={{ left: 6, top: 90, zIndex: 1 }}>
      <div className="space-y-4">
        {/* Network Info */}
        <div>
          <p className={`${L} ${D} uppercase tracking-widest mb-1`}>Network Info</p>
          <p className={`${L}`}><span className={T}>IP: </span><span className={V}>{net?.ip ?? '...'}</span></p>
          <p className={`${L}`}><span className={T}>Location: </span><span className={V}>{net ? `${net.city}, ${net.country}` : '...'}</span></p>
          <p className={`${L}`}><span className={T}>Traffic: </span><span className={V}>{trafficKb} KB/s</span></p>
        </div>

        {/* Time */}
        <div>
          <p className={`${L} ${D} uppercase tracking-widest mb-1`}>Time</p>
          <p className={`${L}`}><span className={T}>Date: </span><span className={V}>{formatDate(liveNow)}</span></p>
          <p className={`${L}`}><span className={T}>Seoul &nbsp;&nbsp;</span><span className={V}>{formatTz('Asia/Seoul', liveNow)}</span></p>
          <p className={`${L}`}><span className={T}>NYC &nbsp;&nbsp;&nbsp;&nbsp;</span><span className={V}>{formatTz('America/New_York', liveNow)}</span></p>
          <p className={`${L}`}><span className={T}>London &nbsp;</span><span className={V}>{formatTz('Europe/London', liveNow)}</span></p>
        </div>

        {/* Weather */}
        <div>
          <p className={`${L} ${D} uppercase tracking-widest mb-1`}>Local Weather</p>
          {weather ? (
            <p className={`${L}`}><span className={V}>{weather.icon} {weather.temp} · {weather.desc}</span></p>
          ) : (
            <p className={`${L} ${V} animate-pulse`}>Loading...</p>
          )}
          {net?.city && <p className={`${L} text-white/30`}>{net.city}</p>}
        </div>
      </div>
    </div>
  )
}
