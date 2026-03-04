import { useState, useEffect } from 'react'

// Simplified world map as dot-matrix grid (longitude/latitude mapped to grid)
// Each row is a string where '#' = land, ' ' = water
const MAP_ROWS = [
  '                                                                                ',
  '                          ####                                                  ',
  '                   ####  ######  #### ###                                       ',
  '                  ###### ######## ########                                      ',
  '           ##    ######### ################   ##                                ',
  '          ###   ################################                                ',
  '          ###   #####  ########################                                 ',
  '          ###  #####   ########################    ####                         ',
  '      ############# ############################  ######                        ',
  '     ############# ############################ # ######                        ',
  '    ############## ##################################  #                         ',
  '    ############## ##################################                           ',
  '   ##############  ###################################                          ',
  '   #############   ####################################                         ',
  '    ###########     ################################### ##                       ',
  '     #########       #################################  ##                      ',
  '     ########         ##############################    ##                      ',
  '      ######           ###########################                              ',
  '       ####             ########################                                ',
  '        ##               #####################    ##                            ',
  '         #                ################       ####                           ',
  '                           ############         ######                          ',
  '                            #########          ########                         ',
  '                             #####              #######                         ',
  '                              ##                 #####                          ',
  '                                                  ###                           ',
  '                                                   #                            ',
  '                                                                                ',
]

// Convert lat/lng to grid position
function geoToGrid(lat: number, lng: number): { x: number; y: number } {
  const cols = MAP_ROWS[0].length
  const rows = MAP_ROWS.length
  const x = Math.round(((lng + 180) / 360) * cols)
  const y = Math.round(((90 - lat) / 180) * rows)
  return { x: Math.max(0, Math.min(cols - 1, x)), y: Math.max(0, Math.min(rows - 1, y)) }
}

export default function WorldMap() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then((data: { latitude?: number; longitude?: number }) => {
        if (data.latitude && data.longitude) {
          setLocation({ lat: data.latitude, lng: data.longitude })
        }
      })
      .catch(() => null)
  }, [])

  const dot = location ? geoToGrid(location.lat, location.lng) : null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
        <pre className="text-[6px] leading-[8px] font-mono text-accent tracking-[2px] relative">
          {MAP_ROWS.map((row, y) => (
            <div key={y} className="whitespace-pre">
              {row.split('').map((ch, x) => {
                const isDot = dot && dot.x === x && dot.y === y
                if (isDot) {
                  return <span key={x} className="text-green-400 animate-pulse" style={{ opacity: 1, fontSize: '8px' }}>●</span>
                }
                return <span key={x}>{ch === '#' ? '·' : ' '}</span>
              })}
            </div>
          ))}
        </pre>
      </div>
      {/* Green glow at location */}
      {dot && (
        <div
          className="absolute w-4 h-4 rounded-full bg-green-400/30 animate-pulse"
          style={{
            left: `${(dot.x / MAP_ROWS[0].length) * 100}%`,
            top: `${(dot.y / MAP_ROWS.length) * 100}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)',
          }}
        />
      )}
    </div>
  )
}
