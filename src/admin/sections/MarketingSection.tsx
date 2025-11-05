import { useState } from 'react'
import { CTA } from '../data/goldlaw'

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

export default function MarketingSection() {
  const [seoInput, setSeoInput] = useState('')
  const [seoOut, setSeoOut] = useState('')

  const [articleIn, setArticleIn] = useState('')
  const [articleOut, setArticleOut] = useState('')

  const [socialIn, setSocialIn] = useState('')
  const [socialOut, setSocialOut] = useState('')

  const [creativeIn, setCreativeIn] = useState('')
  const [creativeOut, setCreativeOut] = useState('')

  const genSEO = () => {
    setSeoOut(`Keywords: west palm beach truck accident lawyer, semi-truck injury attorney, free consultation\nMeta: Trusted Truck Accident Lawyers | GOLDLAW — Get Answers Today\nSchema: LocalBusiness + LegalService (practiceArea=Truck Accident)\nInternal links: /truck-accident/what-to-do, /about/attorneys, /contact\nCTA: Call ${CTA.phone} or request a free consultation at ${CTA.contactUrl}\nGaps: Add FAQ about FMCSA regs & statute of limitations.`)
  }

  const genArticle = () => {
    setArticleOut(`# Staying Safe Around Large Trucks in Florida\n\nWhen you share the road with tractor-trailers, small choices can prevent serious harm...\n\nCTA: Call GOLDLAW at ${CTA.phone} or request a free consultation: ${CTA.contactUrl}\n\nSources: FMCSA, NHTSA, FLHSMV.`)
  }

  const genSocial = () => {
    setSocialOut(`Facebook: Hurt in a truck crash? You have questions — we have answers. Call ${CTA.phone}. #TruckAccident #WestPalmBeach\nInstagram: 3 tips to stay safe around semis → swipe. Contact: ${CTA.contactUrl} #RoadSafety #GOLDLAW\nLinkedIn: Florida trucking claims: what evidence your case needs. Free consult: ${CTA.contactUrl} #LegalInsights`)
  }

  const genCreative = () => {
    setCreativeOut(`Script: 30s explainer with 3 scenes (problem → proof → CTA)\nStoryboard: 6 frames with text overlays and logo end card\nDesign: Billboard headline — HURT BY A TRUCK? Call ${CTA.phone}. Colorway: Royal Blue & Gold.`)
  }

  return (
    <div className="section marketing-layout">
      <div>
        <div className="card" style={{ minHeight: 280 }}>
          <h3>Channel Trends</h3>
          <div style={{ color: 'var(--ops-muted)' }}>Weekly CPL, CPCase, ROAS (mock). Use the right rail to generate assets.</div>
        </div>
      </div>

      <div className="right-rail">
        <Panel title="SEO Optimization">
          <input className="input" placeholder="URL or topic (e.g., West Palm Beach truck accidents)" value={seoInput} onChange={e => setSeoInput(e.target.value)} />
          <div className="actions">
            <button className="button" onClick={genSEO}>Generate SEO</button>
          </div>
          <textarea placeholder="Output" value={seoOut} onChange={() => {}} />
        </Panel>

        <Panel title="Article Creation">
          <input className="input" placeholder="URL or sample paragraph" value={articleIn} onChange={e => setArticleIn(e.target.value)} />
          <div className="actions">
            <button className="button" onClick={genArticle}>Generate Draft</button>
          </div>
          <textarea placeholder="Output" value={articleOut} onChange={() => {}} />
        </Panel>

        <Panel title="Social Tags & Captions">
          <input className="input" placeholder="Topic (e.g., Truck safety tips)" value={socialIn} onChange={e => setSocialIn(e.target.value)} />
          <div className="actions">
            <button className="button" onClick={genSocial}>Generate Posts</button>
          </div>
          <textarea placeholder="Output" value={socialOut} onChange={() => {}} />
        </Panel>

        <Panel title="Content Creation — Script / Storyboard / Design">
          <input className="input" placeholder="Campaign goal or prompt" value={creativeIn} onChange={e => setCreativeIn(e.target.value)} />
          <div className="actions">
            <button className="button" onClick={genCreative}>Generate Plan</button>
          </div>
          <textarea placeholder="Output" value={creativeOut} onChange={() => {}} />
        </Panel>
      </div>
    </div>
  )
}
