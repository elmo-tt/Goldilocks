import './PracticeTwoCol.css'
import { useTranslation } from 'react-i18next'

export type PracticeTwoColProps = {
  imageUrl: string
  detail: string
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

export default function PracticeTwoCol({ imageUrl, detail }: PracticeTwoColProps) {
  const { t } = useTranslation()
  const BENEFITS: Array<{ icon: 'check' | 'loop' | 'support'; title: string; text: string }> = [
    { icon: 'check', title: t('practice_two_col.benefits.0.title'), text: t('practice_two_col.benefits.0.text') },
    { icon: 'loop', title: t('practice_two_col.benefits.1.title'), text: t('practice_two_col.benefits.1.text') },
    { icon: 'support', title: t('practice_two_col.benefits.2.title'), text: t('practice_two_col.benefits.2.text') },
  ]
  return (
    <section className="pa-two-col">
      <div className="pa2-inner">
        <div className="pa2-left">
          <h2 className="pa2-title"><span className="muted">{t('practice_two_col.title_muted')}</span> <span className="strong">{t('practice_two_col.title_strong')}</span></h2>
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
