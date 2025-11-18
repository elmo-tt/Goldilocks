import MagicBento from '@/components/MagicBento'
import './HowItWorksSection.css'
import { useTranslation } from 'react-i18next'

export default function HowItWorksSection() {
  const { t } = useTranslation()
  return (
    <section id="how-it-works" className="hiw">
      <div className="hiw-inner">
        <header className="hiw-head">
          <div className="eyebrow">{t('hiw.eyebrow')}</div>
          <h2 className="hiw-title">
            <span className="muted">{t('hiw.muted')}</span>
            <span className="strong">{t('hiw.strong')}</span>
          </h2>
          <p className="hiw-copy">{t('hiw.copy')}</p>
        </header>

        <MagicBento
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="208, 174, 99"
        />
      </div>
    </section>
  )
}
