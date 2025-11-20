import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export type Article = {
  id: string
  title: string
  href?: string
  image: string
}

export default function ArticlesSection() {
  const { t } = useTranslation()
  const articles: Article[] = useMemo(
    () => [
      {
        id: 'bill-cosby',
        title: 'Spencer Kuvin Takes on Sexual Battery Case Against Bill Cosby',
        image: '/images/articles/Bill-Cosby-courthouse-2016-billboard-15458.jpg',
        href: '#',
      },
      {
        id: 'press-conference',
        title: 'Spencer Kuvin Takes on Sexual Battery Case Against Bill Cosby',
        image: '/images/articles/SnapInsta.to_470163442_1924557591370300_5457905527928356302_n.jpg',
        href: '#',
      },
      {
        id: 'case-feature',
        title: 'Spencer Kuvin Takes on Sexual Battery Case Against Bill Cosby',
        image: '/images/articles/9c76037bfb42191521634b808e1834c1.jpg',
        href: '#',
      },
    ],
    []
  )

  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const cards = track.querySelectorAll<HTMLElement>('.article-card')
    const card = cards[idx]
    if (!card) return
    const desiredLeft = card.offsetLeft - track.offsetLeft
    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth)
    const clampedLeft = Math.max(0, Math.min(desiredLeft, maxLeft))
    track.scrollTo({ left: clampedLeft, behavior: 'smooth' })
  }

  const go = (dir: 1 | -1) => {
    const next = (active + dir + articles.length) % articles.length
    setActive(next)
    scrollToIndex(next)
  }

  return (
    <section id="articles" className="articles">
      <div className="articles-inner">
        <div className="articles-header">
          <div className="eyebrow">{t('articles.eyebrow')}</div>
          <h2 className="articles-title">
            <span className="muted">{t('articles.muted')}</span>
            <span>{t('articles.strong')}</span>
          </h2>
        </div>
        <div className="articles-right">
          <div className="cards-viewport" ref={trackRef}>
            {articles.map((a, i) => (
              <article
                key={a.id}
                className={`article-card${i === active ? ' active' : ''}`}
                onClick={() => {
                  setActive(i)
                  scrollToIndex(i)
                }}
              >
                <a className="tile" href={a.href || '#'}>
                  <div className="tile-image">
                    <img
                      src={a.image}
                      alt={t(`articles.items.${a.id}.title`)}
                      loading="lazy"
                      width={400}
                      height={240}
                    />
                  </div>
                  <div className="tile-title">{t(`articles.items.${a.id}.title`)}</div>
                </a>
              </article>
            ))}
          </div>
          <div className="articles-nav">
            <Link className="view-all" to="/articles#hero">{t('articles.view_all')}</Link>
            <div className="arrows">
              <button className="nav-btn" aria-label="Previous" onClick={() => go(-1)}>←</button>
              <button className="nav-btn" aria-label="Next" onClick={() => go(1)}>→</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
