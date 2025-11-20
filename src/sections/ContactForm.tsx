import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PRACTICE_AREAS } from '@/admin/data/goldlaw'
import './ContactSection.css'

export default function ContactForm() {
  const { t } = useTranslation()
  const areas = useMemo(() => PRACTICE_AREAS.map(p => p.label), [])

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
    </form>
  )
}
