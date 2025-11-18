import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PRACTICE_AREAS } from '@/admin/data/goldlaw'
import './ContactSection.css'

type Review = {
  id: string
  text: string
  name: string
  area: string
}

export default function ContactSection() {
  const { t } = useTranslation()
  const reviews: Review[] = useMemo(
    () => [
      {
        id: 'karen',
        text:
          '“What a wonderful experience. At GOLDLAW, you are treated like family!! Thank you, Paul, and the entire team. Outstanding!!!!”',
        name: 'Karen R.',
        area: 'Auto Accident',
      },
      {
        id: 'jason',
        text:
          '“GOLDLAW handled my case with professionalism and compassion. Communication was clear and I always knew what to expect.”',
        name: 'Jason M.',
        area: 'Premises Liability',
      },
      {
        id: 'alyssa',
        text:
          '“From start to finish, they fought hard and got a result beyond what I imagined. They truly put clients first.”',
        name: 'Alyssa P.',
        area: 'Negligent Security',
      },
    ],
    []
  )

  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % reviews.length), 6000)
    return () => clearInterval(id)
  }, [reviews.length])

  const areas = useMemo(() => PRACTICE_AREAS.map(p => p.label), [])

  // Custom dropdown state for case type
  const [caseOpen, setCaseOpen] = useState(false)
  const [caseValue, setCaseValue] = useState('')
  const [highlight, setHighlight] = useState<number>(-1)
  const caseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (caseRef.current && !caseRef.current.contains(e.target as Node)) {
        setCaseOpen(false)
        setHighlight(-1)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selectCase = (v: string) => {
    setCaseValue(v)
    setCaseOpen(false)
  }

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Down') {
      e.preventDefault()
      setCaseOpen(true)
      setHighlight((i) => (i + 1) % areas.length)
    } else if (e.key === 'ArrowUp' || e.key === 'Up') {
      e.preventDefault()
      setCaseOpen(true)
      setHighlight((i) => (i <= 0 ? areas.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (caseOpen && highlight >= 0) selectCase(areas[highlight])
      else setCaseOpen((o) => !o)
    } else if (e.key === 'Escape') {
      setCaseOpen(false)
      setHighlight(-1)
    }
  }

  return (
    <section id="contact" className="contact">
      <div className="contact-inner">
        <div className="contact-left">
          <div className="eyebrow">{t('contact.eyebrow')}</div>
          <h2 className="contact-title">
            <span className="muted">{t('contact.title_muted')}</span> <span>{t('contact.title_strong')}</span>
          </h2>
          <div className="contact-review">
            <div className="cr-progress" style={{ ['--segments' as any]: reviews.length }}>
              {reviews.map((_, i) => (
                <span key={i} className={`cr-seg${i === active ? ' on' : ''}`} />
              ))}
            </div>
            <div className="cr-body">
              <blockquote className="cr-text">{reviews[active].text}</blockquote>
              <div className="cr-meta">
                <img src="/SVG/Google__G__logo.svg" alt="Google" className="google-g" />
                <div className="cr-lines">
                  <div className="cr-name">{reviews[active].name}</div>
                  <div className="cr-area">{reviews[active].area}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-right">
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid">
              <label className="form-field">
                <span className="form-label">{t('contact.first_name_label')}</span>
                <input className="input" type="text" name="firstName" placeholder={t('contact.first_name_placeholder')} required />
              </label>
              <label className="form-field">
                <span className="form-label">{t('contact.last_name_label')}</span>
                <input className="input" type="text" name="lastName" placeholder={t('contact.last_name_placeholder')} required />
              </label>
              <label className="form-field">
                <span className="form-label">{t('contact.email_label')}</span>
                <input className="input" type="email" name="email" placeholder={t('contact.email_placeholder')} required />
              </label>
              <label className="form-field">
                <span className="form-label">{t('contact.phone_label')}</span>
                <input className="input" type="tel" name="phone" placeholder={t('contact.phone_placeholder')} required />
              </label>
              <label className="form-field form-field-full">
                <span className="form-label">{t('contact.case_type_label')}</span>
                <div className="case-select" ref={caseRef}>
                  <button
                    type="button"
                    className={`case-trigger${caseOpen ? ' open' : ''}`}
                    aria-haspopup="listbox"
                    aria-expanded={caseOpen}
                    onClick={() => setCaseOpen((o) => !o)}
                    onKeyDown={onTriggerKey}
                  >
                    <span className={`case-value${caseValue ? '' : ' placeholder'}`}>{caseValue || t('contact.select_case_type')}</span>
                    <span className="case-arrow" aria-hidden="true">
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
                    </span>
                  </button>
                  {caseOpen && (
                    <div className="case-panel" role="listbox">
                      {areas.map((t, i) => (
                        <div
                          role="option"
                          key={t}
                          aria-selected={caseValue === t}
                          className={`case-option${caseValue === t ? ' selected' : ''}${highlight === i ? ' active' : ''}`}
                          onMouseDown={(e) => { e.preventDefault(); selectCase(t) }}
                          onMouseEnter={() => setHighlight(i)}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                  <input type="hidden" name="caseType" value={caseValue} />
                </div>
              </label>
              <label className="form-field form-field-full">
                <span className="form-label">{t('contact.tell_us_label')}</span>
                <textarea className="textarea" name="details" placeholder={t('contact.provide_details_placeholder')} rows={6} />
              </label>
            </div>

            <div className="form-actions">
              <div className="agreement">
                {t('contact.agreement')}
              </div>
              <button className="btn primary" type="submit">
                <span>{t('nav.free_case_review')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
