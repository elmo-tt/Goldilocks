import './PracticeTwoCol.css'
import { useTranslation } from 'react-i18next'

export type PracticeTwoColProps = {
  imageUrl: string
  detail: string
  areaKey?: string
}

 

function Icon({ type }: { type: 'check' | 'loop' | 'support' }) {
  if (type === 'check') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"/>
      </svg>
    )
  }
  if (type === 'loop') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 1v4h-2V4H9a5 5 0 100 10h1v-2H9a3 3 0 010-6h6v3l5-4-5-4zM7 19v-4h2v1h6a5 5 0 100-10h-1V4h1a7 7 0 110 14H9v-3l-5 4 5 4z"/>
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a5 5 0 015 5v3h2a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1h2V7a5 5 0 015-5zm3 8V7a3 3 0 10-6 0v3h6z"/>
    </svg>
  )
}

export default function PracticeTwoCol({ imageUrl, detail, areaKey }: PracticeTwoColProps) {
  const { t } = useTranslation()
  const titleMuted = areaKey ? t(`practice_two_col_pages.${areaKey}.title_muted`, { defaultValue: t('practice_two_col.title_muted') }) : t('practice_two_col.title_muted')
  const titleStrong = areaKey ? t(`practice_two_col_pages.${areaKey}.title_strong`, { defaultValue: t('practice_two_col.title_strong') }) : t('practice_two_col.title_strong')
  const BENEFITS: Array<{ icon: 'check' | 'loop' | 'support'; title: string; text: string }> = [0,1,2].map((i) => ({
    icon: (i === 0 ? 'check' : i === 1 ? 'loop' : 'support') as 'check' | 'loop' | 'support',
    title: areaKey ? t(`practice_two_col_pages.${areaKey}.benefits.${i}.title`, { defaultValue: t(`practice_two_col.benefits.${i}.title`) }) : t(`practice_two_col.benefits.${i}.title`),
    text: areaKey ? t(`practice_two_col_pages.${areaKey}.benefits.${i}.text`, { defaultValue: t(`practice_two_col.benefits.${i}.text`) }) : t(`practice_two_col.benefits.${i}.text`),
  }))
  return (
    <section className="pa-two-col">
      <div className="pa2-inner">
        <div className="pa2-left">
          <h2 className="pa2-title"><span className="muted">{titleMuted}</span> <span className="strong">{titleStrong}</span></h2>
          <p className="pa2-detail">{detail}</p>
          <ul className="pa2-benefits">
            {BENEFITS.map((b, i) => (
              <li className="benefit" key={i}>
                <span className="b-icon" aria-hidden="true"><Icon type={b.icon} /></span>
                <div className="b-lines">
                  <div className="b-title">{b.title}</div>
                  <div className="b-text">{b.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="pa2-right">
          <img src={imageUrl} alt="Practice area" />
        </div>
      </div>
    </section>
  )
}
