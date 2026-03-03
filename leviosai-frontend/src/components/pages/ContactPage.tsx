import TypewriterText from '../TypewriterText'

// TODO: Replace with your actual YouTube channel or video URL
const YOUTUBE_URL = 'https://www.youtube.com/your-channel'

export default function ContactPage() {
  const team = [
    {
      name: 'Minseok Shin',
      role: 'Lead Engineer',
      email: 'stevenshin16@gmail.com',
      github: 'github.com/stevenshin16',
      avatar: 'S',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Contact</p>
        <h2 className="text-3xl font-bold text-primary font-mono tracking-tight">
          <TypewriterText text="Get in Touch" speed={45} />
        </h2>
        <p className="text-secondary mt-2">Questions, feedback, or collaboration inquiries</p>
      </div>

      {/* Contact email banner */}
      <div className="p-5 rounded-2xl border border-accent/20 bg-accent/5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-xs font-mono font-bold">MAIL</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-accent/70 uppercase tracking-widest mb-0.5">Direct Contact</p>
          <a href="mailto:stevenshin16@gmail.com" className="text-primary font-semibold hover:text-accent transition-colors">
            stevenshin16@gmail.com
          </a>
          <p className="text-xs text-secondary mt-0.5">Response within 24 hours</p>
        </div>
        <a
          href="mailto:stevenshin16@gmail.com"
          className="flex-shrink-0 px-4 py-2 border border-accent/30 text-accent text-xs font-mono rounded-xl hover:bg-accent/10 transition-colors"
        >
          Send Email
        </a>
      </div>

      {/* About */}
      <div className="p-6 rounded-2xl border border-white/8 bg-component">
        <div className="flex items-center gap-3 mb-4">
          <img src="/leviosai.png" alt="LeviosAI" className="w-8 h-8 object-contain" />
          <div>
            <p className="text-primary font-bold">LeviosAI</p>
            <p className="text-xs text-accent font-mono">Edge AI Optimization Platform</p>
          </div>
        </div>
        <p className="text-secondary text-sm leading-relaxed">
          LeviosAI is an end-to-end Edge AI deployment platform built for the Google AI Hackathon.
          It guides engineers through domain selection, hardware configuration, model optimization,
          and automated code generation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['React + Vite', 'FastAPI', 'Tailwind CSS v4', 'TypeScript'].map(t => (
            <span key={t} className="text-[10px] px-2.5 py-1 bg-white/6 border border-white/10 text-secondary rounded-full font-mono">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-4">Team</p>
        <div className="space-y-3">
          {team.map(member => (
            <div key={member.name} className="flex items-center gap-5 p-5 rounded-2xl border border-white/8 bg-component">
              <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-primary text-2xl font-bold font-mono flex-shrink-0">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary font-bold text-lg">{member.name}</p>
                <p className="text-accent text-xs font-mono mt-0.5">{member.role}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <a href={`mailto:${member.email}`}
                    className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors font-mono">
                    <span>◉</span>{member.email}
                  </a>
                  <a href={`https://${member.github}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors font-mono">
                    <span>⌥</span>{member.github}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location — Google Maps IFC Seoul */}
      <div>
        <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-4">Location</p>
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-5 py-4 bg-component border-b border-white/6 flex items-center justify-between">
            <div>
              <p className="text-primary font-semibold text-sm">IFC Seoul</p>
              <p className="text-xs text-secondary font-mono mt-0.5">10 Gukjegeumyung-ro, Yeongdeungpo-gu, Seoul</p>
            </div>
            <a
              href="https://maps.google.com/?q=IFC+Seoul+Yeouido"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent font-mono hover:underline flex-shrink-0"
            >
              Open Maps ↗
            </a>
          </div>
          <iframe
            title="IFC Seoul Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3163.9067893965217!2d126.92490377693386!3d37.524426172534264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2012d5c6db7%3A0x6b7bb9a5bce4c2ed!2sIFC%20Seoul!5e0!3m2!1sko!2skr!4v1740000000000!5m2!1sko!2skr"
            width="100%"
            height="280"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* YouTube */}
      <div>
        <p className="text-xs font-mono text-secondary/60 uppercase tracking-widest mb-4">Video</p>
        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-component hover:border-red-500/40 hover:bg-red-500/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0 group-hover:border-red-500/50 transition-colors">
            <span className="text-red-400 text-xs font-mono font-bold">YT</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-primary font-semibold text-sm group-hover:text-red-400 transition-colors">
              LeviosAI YouTube Channel
            </p>
            <p className="text-xs text-secondary mt-0.5">Demo videos &amp; tutorials</p>
          </div>
          <span className="text-secondary/30 group-hover:text-red-400 transition-colors">↗</span>
        </a>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-white/5 text-center">
        <p className="text-xs text-secondary/40 font-mono">
          LeviosAI · Built for Google AI Hackathon 2026
        </p>
      </div>
    </div>
  )
}
