import '@/sections/HeroSection.css'
import '@/styles/global.css'
import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import RelatedArticles from '@/sections/RelatedArticles'
import '@/sections/RelatedArticles.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import ArticleTemplate from '@/pages/articles/ArticleTemplate'
import type { Article } from '@/shared/articles/store'

export default function ArticleTemplatePreview() {
  const sample: Article = {
    id: 'preview',
    slug: 'preview-article',
    title: 'Truck Safety Changes Coming to Florida? What Drivers Should Know',
    excerpt:
      'Lawmakers are proposing updates to trucking safety. Here’s what it could mean for Florida drivers and injury victims — and the practical steps to protect your rights.',
    tags: ['Research', 'Truck'],
    heroUrl: '/images/articles/9c76037bfb42191521634b808e1834c1.jpg',
    heroDataUrl: undefined,
    body: `# What is changing?
Florida may adopt tighter rules around inspections, underride guards, and rest breaks. The goal: fewer severe crashes.

# Why it matters
Large trucks carry more momentum. When negligence causes harm, the consequences are serious. Stronger standards can reduce risk — but victims still need immediate evidence and medical care.

# What to do after a crash
1) Document the scene and vehicles.
2) Get medical care the same day.
3) Preserve dash cam and telematics if available.
4) Talk to counsel before insurers.

CTA: Request a free consultation today.`,
    status: 'published',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
  }

  return (
    <>
      <StickyNav />
      {/* Minimal hero anchor to enable StickyNav topbar behavior */}
      <div id="hero" style={{ position: 'absolute', top: 0, height: 1, width: 1, overflow: 'hidden' }} />

      <ArticleTemplate article={sample} />

      {/* Related articles variant for template base */}
      <RelatedArticles />

      <FooterSection />
    </>
  )
}
