import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './FAQSection.css'

type QA = { q: string; a: string }

export default function FAQSection() {
  const { t } = useTranslation()
  const items: QA[] = useMemo(() => {
    const N = 8
    return Array.from({ length: N }, (_, i) => ({
      q: t(`faq.items.${i}.q`),
      a: t(`faq.items.${i}.a`),
    }))
  }, [t])

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="faq">
      <div className="faq-inner">
        <div className="faq-left">
          <h2 className="faq-title">
            <span className="muted">{t('faq.title_muted')}</span>
            <span>{t('faq.title_strong')}</span>
          </h2>
          <a className="faq-card" href="#">
            <div className="faq-card-title">{t('faq.card_title')}</div>
            <div className="faq-card-link">{t('faq.card_link')}</div>
          </a>
        </div>
        <div className="faq-right">
          <div className="faq-list">
            {items.map((item, i) => {
              const isOpen = openIndex === i
              const panelId = `faq-panel-${i}`
              const btnId = `faq-btn-${i}`
              return (
                <div key={i} className={`faq-item${isOpen ? ' open' : ''}`}>
                  <button
                    id={btnId}
                    className="faq-q"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-plus" aria-hidden="true"></span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className="faq-a"
                    hidden={!isOpen}
                  >
                    <p>{item.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
