import TypewriterText from '../TypewriterText'
import { useI18n } from '../../utils/i18n'
import SystemInfoPanel from '../SystemInfoPanel'
import WorldMap from '../WorldMap'

// TODO: Replace with your actual YouTube channel or video URL
const YOUTUBE_URL = 'https://www.youtube.com/your-channel'

interface Props {
  chatOpen?: boolean
  onNavigate?: (tab: string) => void
}

export default function ContactPage({ chatOpen, onNavigate }: Props) {
  const { t } = useI18n()
  const team = [
    {
      name: 'Minseok Shin',
      role: 'Lead Engineer',
      email: 'stevenshin16@gmail.com',
      github: 'github.com/skytinstone',
      avatar: 'S',
    },
  ]

  return (
    <div className="relative h-full overflow-y-auto">
      {/* Background: World Map (fixed so it stays visible during scroll) */}
      <div className="fixed inset-0 pointer-events-none select-none" style={{ zIndex: 0, opacity: 0.15 }}>
        <WorldMap />
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-6 py-6" style={{ zIndex: 1 }}>
        <SystemInfoPanel />

        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-accent uppercase tracking-[0.25em] font-mono mb-1">{t('contact.title')}</p>
          <h2 className="text-2xl font-bold text-primary font-mono tracking-tight">
            <TypewriterText text={t('contact.subtitle')} speed={45} />
          </h2>
          <p className="text-xs text-secondary mt-1.5">{t('contact.subtitle')}</p>
        </div>

        {/* 2-Column Layout */}
        <div className="flex gap-5 items-start">
          {/* ══════ Left Column ══════ */}
          <div className="w-[360px] flex-shrink-0 space-y-3">
            {/* Contact email banner */}
            <div className="p-3 rounded-xl border border-accent/20 bg-accent/5 backdrop-blur-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
                <span className="text-accent text-[9px] font-mono font-bold">MAIL</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-mono text-accent/60 uppercase tracking-widest">{t('contact.email')}</p>
                <a href="mailto:stevenshin16@gmail.com" className="text-xs text-primary font-semibold hover:text-accent transition-colors">
                  stevenshin16@gmail.com
                </a>
                <p className="text-[9px] text-secondary mt-0.5">Response within 24 hours</p>
              </div>
              <a
                href="mailto:stevenshin16@gmail.com"
                className="flex-shrink-0 px-2.5 py-1.5 border border-accent/30 text-accent text-[9px] font-mono rounded-lg hover:bg-accent/10 transition-colors"
              >
                {t('contact.send')}
              </a>
            </div>

            {/* About */}
            <div className="p-3.5 rounded-xl border border-white/8 bg-component/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 mb-2.5">
                <img src="/leviosai.png" alt="LeviosAI" className="w-6 h-6 object-contain" />
                <div>
                  <p className="text-primary font-bold text-xs">LeviosAI</p>
                  <p className="text-[9px] text-accent font-mono">Edge AI Optimization Platform</p>
                </div>
              </div>
              <p className="text-secondary text-[10px] leading-relaxed">
                {t('contact.developerDesc')}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {['React + Vite', 'FastAPI', 'Tailwind CSS v4', 'TypeScript'].map(tech => (
                  <span key={tech} className="text-[8px] px-2 py-0.5 bg-white/6 border border-white/10 text-secondary rounded-full font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Team */}
            <div>
              <p className="text-[8px] font-mono text-secondary/50 uppercase tracking-widest mb-2">Team</p>
              <div className="space-y-2">
                {team.map(member => (
                  <div key={member.name} className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-component/80 backdrop-blur-sm">
                    <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-primary text-base font-bold font-mono flex-shrink-0">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-bold text-xs">{member.name}</p>
                      <p className="text-accent text-[9px] font-mono">{member.role}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <a href={`mailto:${member.email}`}
                          className="flex items-center gap-1 text-[9px] text-secondary hover:text-primary transition-colors font-mono">
                          <span>◉</span>{member.email}
                        </a>
                        <a href={`https://${member.github}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] text-secondary hover:text-primary transition-colors font-mono">
                          <span>⌥</span>{member.github}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media */}
            <div>
              <p className="text-[8px] font-mono text-secondary/50 uppercase tracking-widest mb-2">Social Media</p>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-white/8 bg-component/80 backdrop-blur-sm hover:border-red-500/40 hover:bg-red-500/5 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0 group-hover:border-red-500/50 transition-colors">
                  <span className="text-red-400 text-[8px] font-mono font-bold">YT</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-primary font-semibold text-[10px] group-hover:text-red-400 transition-colors">
                    LeviosAI YouTube Channel
                  </p>
                  <p className="text-[9px] text-secondary">Demo videos &amp; tutorials</p>
                </div>
                <span className="text-secondary/30 group-hover:text-red-400 transition-colors text-xs">↗</span>
              </a>
            </div>
          </div>

          {/* ══════ Right Column — Location ══════ */}
          <div className="flex-1">
            <p className="text-[8px] font-mono text-secondary/50 uppercase tracking-widest mb-2">Location</p>
            <div className="rounded-xl border border-white/8 overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-2.5 bg-component/80 border-b border-white/6 flex items-center justify-between">
                <div>
                  <p className="text-primary font-semibold text-xs">IFC Seoul</p>
                  <p className="text-[10px] text-secondary font-mono mt-0.5">10 Gukjegeumyung-ro, Yeongdeungpo-gu, Seoul</p>
                </div>
                <a
                  href="https://maps.google.com/?q=IFC+Seoul+Yeouido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-accent font-mono hover:underline flex-shrink-0"
                >
                  Open Maps ↗
                </a>
              </div>
              <iframe
                title="IFC Seoul Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.9067893965217!2d126.92490377693386!3d37.524426172534264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2012d5c6db7%3A0x6b7bb9a5bce4c2ed!2sIFC%20Seoul!5e0!3m2!1sko!2skr!4v1740000000000!5m2!1sko!2skr"
                width="100%"
                height="720"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[9px] text-secondary/30 font-mono">
            LeviosAI · Built for Google AI Hackathon 2026
          </p>
        </div>
      </div>

    </div>
  )
}
