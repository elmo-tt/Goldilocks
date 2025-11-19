import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import { useTranslation } from 'react-i18next'
import './TeamPage.css'
import { LAWYERS, type Lawyer } from '@/admin/data/goldlaw'
import { useState } from 'react'

export default function TeamPage() {
  const { t } = useTranslation()
  const [activeLawyer, setActiveLawyer] = useState<Lawyer | null>(null)
  const orderedLawyers = (() => {
    const craig = LAWYERS.find(l => l.name.startsWith('Craig'))
    const spencer = LAWYERS.find(l => l.name.startsWith('Spencer'))
    const rest = LAWYERS.filter(l => l !== craig && l !== spencer)
    return [
      ...(craig ? [craig] : []),
      ...(spencer ? [spencer] : []),
      ...rest,
    ]
  })()

  const IMG: Record<string, string> = {
    'Craig M. Goldenfarb, Esq.': '/images/lawyers/craig-goldenfarb.jpg',
    'Spencer T. Kuvin, Esq.': '/images/lawyers/spencer-kuvin.jpg',
    'Jorge L. Maxion, Esq.': '/images/lawyers/jorge-maxion.jpg',
    'Jeffrey D. Kirby, Esq.': '/images/lawyers/jeff-kirby.jpg',
    'Rafael J. Roca, Esq. BSC.': '/images/lawyers/rafel-roca.jpg',
    'Michael A. Wasserman, Esq.': '/images/lawyers/mike-wasserman.jpg',
    'Timothy D. Kenison, Esq.': '/images/lawyers/tim-kennison.jpg',
    'Paul McBride, Esq.': '/images/lawyers/paul-mcbride.jpg',
    'Michael H. Kugler, Esq.': '/images/lawyers/michael-kugler.jpg',
    'Ursula C. Cogswell, Esq.': '/images/lawyers/ursula-cogswell.jpg',
    'Bryan Graves, Esq.': '/images/lawyers/bryan-graves.jpg',
  }

  const DETAILS: Record<string, AttorneyDetail> = {
    'Craig M. Goldenfarb, Esq.': {
      code: 'craig_goldenfarb',
      bioHeading: 'Craig Goldenfarb: A Leader and Expert Personal Injury Lawyer',
      bioParagraphs: [
        "After a highly successful career as a litigator, Craig's primary focus is building the teams that directly manage client cases, and overseeing the firm's largest cases. He still oversees pre-suit and litigation matters that involve significant loss, such as catastrophic injury, medical malpractice, vehicle accidents, and wrongful death cases.",
        'Craig Goldenfarb is an expert personal injury lawyer and a nationally recognized speaker to community organizations, lawyers, and other legal professionals on a variety of topics concerning personal injury law, civil litigation, and the justice system. He is the founder of several charitable causes that support higher education and heart health.',
        'Craig and his family live in Palm Beach County. When he is not fighting for clients, he enjoys supporting local community organizations and spending time with his wife and children.',
      ],
      education: [
        { school: 'University of Florida', detail: 'Doctorate of Jurisprudence', year: '1995' },
        { school: 'Duke University', detail: 'Undergraduate Studies', year: '1991' },
      ],
      affiliations: [],
      awards: [],
      cases: [
        { amount: '$3.5M', caption: 'Motorcyclist killed by drunk driver' },
        { amount: '$375,000', caption: "Driver's car was keyed" },
      ],
    },
    'Spencer T. Kuvin, Esq.': {
      code: 'spencer_kuvin',
      bioHeading: 'Spencer Kuvin: A Leading Personal Injury Lawyer',
      bioParagraphs: [
        'Although he began his career defending large, multi-national corporations and insurance companies, Spencer Kuvin has spent the last 20 years of his highly distinguished legal career representing folks against the giants he once defended, relishing the challenge of standing up for those that seemingly have the odds stacked against them.',
        'As GOLDLAW’s Chief Legal Officer and Litigation Director, Spencer Kuvin handles many of the most critical personal injury cases for the firm. He has been particularly successful orchestrating the litigation process in high-profile cases related to wrongful death, nursing home abuse/neglect, sexual assault, car crashes, and brain injury.',
      ],
      education: [
        { school: 'St. Thomas University School of Law', detail: 'Doctorate of Jurisprudence', year: '1996' },
        { school: 'Florida State University', detail: 'B.S. in Economics (Communications Minor)', year: '1991' },
      ],
      affiliations: [
        'Board Certified Civil Trial Attorney, Florida Bar',
        'Florida Bar Association',
        'United States Supreme Court',
        'U.S. Court of Appeals, Eleventh Circuit',
        'U.S. District Court, Southern, Middle & Northern Districts of Florida',
        'Former President, Palm Beach County Justice Association',
        'Florida Justice Association, Eagle Member',
        'Palm Beach County Bar Association',
      ],
      awards: ['Martindale-Hubbell AV Preeminent rating', 'Listed in The Best Lawyers in America since 2012'],
      cases: [
        { amount: '$7.25M', caption: 'Auto wrongful death involving child (Francisco, Rivera v. Safeco)' },
        { amount: '$5.25M', caption: 'Auto crash, rear-end collision (Higgins v. Geico)' },
      ],
    },
    'Jorge L. Maxion, Esq.': {
      code: 'jorge_maxion',
      bioHeading: 'Jorge L. Maxion: A Diverse Career in Personal Injury Law',
      bioParagraphs: [
        'During his tenure as a Magistrate, Jorge presided over pretrial motions and non-jury trials in foreclosure cases when Florida faced one of the highest foreclosure backlogs in the nation.',
        'He now applies that litigation experience to efficiently prepare personal injury cases for trial and obtain just compensation for injured clients, while serving the Hispanic community as a bilingual attorney and frequent community radio guest.',
      ],
      education: [
        { school: 'University of Miami School of Law', detail: 'Doctorate of Jurisprudence', year: '1987' },
        { school: 'Georgetown University', detail: 'Bachelor of Arts in Government', year: '1983' },
      ],
      affiliations: [
        'Florida Bar Association',
        'Palm Beach County Bar Association',
        'PBC Hispanic Bar Association',
        'American Board of Trial Advocates (ABOTA)',
        'Palm Beach County Justice Association',
      ],
      awards: [],
      cases: [
        { amount: '$2.3M', caption: 'Trip and fall case' },
        { amount: '$810K', caption: 'Slip and fall case' },
      ],
    },
    'Jeffrey D. Kirby, Esq.': {
      code: 'jeffrey_kirby',
      bioHeading: 'Jeffrey D. Kirby: A Skilled Personal Injury Lawyer',
      bioParagraphs: [
        'After graduating from the Samford University Cumberland School of Law, Jeffrey Kirby began his career in personal injury defense, representing insurance companies and self-insured businesses.',
        'Since 2000, he has litigated personal injury cases on behalf of injured clients and their families, with significant experience in pedestrian crashes, medical malpractice, nursing home abuse, car accidents, negligent security, and defective products.',
      ],
      education: [
        { school: 'Samford University, Cumberland School of Law', detail: 'Doctorate of Jurisprudence', year: '1990' },
        { school: 'Florida State University', detail: 'B.S. in International Affairs', year: '1987' },
      ],
      affiliations: [
        'Florida Bar Association',
        'Palm Beach County Bar Association',
        'South PBC Bar Association',
        'Palm Beach County Justice Association',
        'Martin County Bar Association',
      ],
      awards: [],
      cases: [
        { amount: '$7.2M', caption: 'Auto wrongful death of child (Francisco Rivera v. Safeco)' },
        { amount: '$5.2M', caption: 'Auto crash, rear-end collision (Thomas Higgins v. GEICO)' },
      ],
    },
    'Rafael J. Roca, Esq. BSC.': {
      code: 'rafael_roca',
      bioHeading: 'Rafael Roca: A Skilled Advocate for Personal Injury Cases',
      bioParagraphs: [
        'Born in Cuba and raised in Miami, Rafael Roca has devoted his career to representing injured clients and serving Hispanic communities in Palm Beach County.',
        'A Board-Certified Civil Trial Lawyer, he has secured millions in verdicts and settlements in wrongful death, catastrophic automobile accidents, and slip-and-fall cases, while holding leadership roles in numerous civic and legal organizations.',
      ],
      education: [
        { school: 'St. Thomas University School of Law', detail: 'Doctorate of Jurisprudence', year: '1987' },
        { school: 'Florida State University', detail: 'Bachelor of Arts', year: '1984' },
      ],
      affiliations: [
        'Florida Bar Association — Board Certified: Civil Trial Law',
        'Hispanic Human Resources Council — Vice President of Board; Past President (2000–2001)',
        '15th Judicial Circuit Judicial Nominating Committee — Chair (2007)',
        'PBC Hispanic Bar Association — Vice President of the Board',
        'Palm Beach County Justice Association — Past President, current member',
        'Legal Aid Society — Board of Trustees Member',
        'St. Thomas School of Law — Board of Advisors Member',
      ],
      awards: ['Super Lawyers; Million Dollar Advocates Forum; Florida Justice Association; American Association for Justice (various recognitions)'],
      cases: [
        { amount: '$2.7M', caption: 'Truck collision on I-95 (settlement)' },
        { amount: '$2.5M', caption: 'Servin v. Construction Co. — workplace death involving boom lift' },
      ],
    },
    'Michael A. Wasserman, Esq.': {
      code: 'michael_wasserman',
      bioHeading: 'Michael Wasserman: From Trial Consultant to Personal Injury Lawyer',
      bioParagraphs: [
        'After graduating from Tulane University School of Law, Michael Wasserman worked as a trial consultant and Public Defender in Tallahassee and Miami, trying more than 50 jury trials and over 100 trials total.',
        'He later litigated insurance defense and employment cases before transitioning to personal injury law, where he now brings decades of trial experience to complex cases involving auto accidents, premises liability, medical malpractice, nursing home abuse and neglect, and wrongful death.',
      ],
      education: [
        { school: 'Tulane School of Law', detail: 'Doctorate of Jurisprudence', year: '1992' },
        { school: 'State University of New York, Albany', detail: 'B.A.', year: '1989' },
      ],
      affiliations: [
        'Florida Bar Association',
        'Palm Beach County Bar Association',
        'Palm Beach County Justice Association',
        'Dade County Bar Association',
        'Broward County Bar Association',
        'Florida Association of Criminal Defense Lawyers',
        'U.S. District Court — Southern, Middle & Northern Districts of Florida',
      ],
      awards: [],
      cases: [
        { amount: '$825K', caption: 'Premises liability' },
        { amount: '$675K', caption: 'Nursing home abuse' },
      ],
    },
    'Paul McBride, Esq.': {
      code: 'paul_mcbride',
      bioHeading: 'Paul McBride: A Dedicated Lawyer for Your Legal Needs',
      bioParagraphs: [
        'A graduate of the Levin College of Law at the University of Florida, Paul McBride served as President of the Criminal Law Association and Executive VP of the Trial Team, earning UF’s highest pro bono honor and trying several jury trials before graduation.',
        'Inspired by his own experience with the court system, he became a prosecutor handling special victims and domestic violence cases, later joining a large national personal injury firm before coming to GOLDLAW, where he handles cases ranging from car crashes and trip-and-fall incidents to wrongful death, products liability, negligent security, medical malpractice, and sexual assault.',
      ],
      education: [
        { school: 'Levin College of Law – University of Florida', detail: 'Doctorate of Jurisprudence', year: '2017' },
        { school: 'State University of New York at Albany', detail: 'B.S. in Business Administration & Political Science', year: '2014' },
        { school: 'Cayuga Community College', detail: 'A.S. in Business Administration', year: '2011' },
      ],
      affiliations: [
        'Palm Beach County Bar Association',
        'U.S. District Court — Southern & Middle Districts of Florida',
        'Florida Justice Association',
        'Speak Up For Kids — Board of Directors',
        'AMIkids Orlando — Board of Directors',
      ],
      awards: [],
      cases: [
        { amount: '$653K', caption: 'Trip and fall — retired nurse required surgery after big-box store fall' },
        { amount: '$500K', caption: 'Bicycle vs. pickup truck — bicyclist struck in crosswalk' },
      ],
    },
    'Timothy D. Kenison, Esq.': {
      code: 'timothy_kenison',
      bioHeading: 'Timothy Kenison: A Trial and Appellate Attorney with a Passion for Justice',
      bioParagraphs: [
        'A graduate of the University of Florida and Temple University Beasley School of Law, Timothy Kenison began his career as a Public Defender in West Palm Beach, trying sixteen felony jury trials as first chair in serious cases including capital sexual battery and carjacking.',
        'He later defended hospitals and medical providers before joining GOLDLAW in 2020, where he uses his combined trial and appellate experience to represent negligence victims in complex personal injury and medical cases.',
      ],
      education: [
        { school: 'Temple University Beasley School of Law', detail: 'Doctorate of Jurisprudence', year: '2003' },
        { school: 'University of Florida', detail: 'B.A. in Political Science', year: '1997' },
      ],
      affiliations: [],
      awards: [],
      cases: [
        { amount: '$3.5M', caption: 'Confidential settlement — resident abuse and neglect at assisted living facility' },
        { amount: '$700K', caption: 'Confidential settlement — negligent security at shopping center (knee injury)' },
      ],
    },
    'Michael H. Kugler, Esq.': {
      code: 'michael_kugler',
      bioHeading: 'Michael Kugler: From State Attorney to Champion for Victims',
      bioParagraphs: [
        'Michael Kugler began his legal career at the Office of the State Attorney in Palm Beach County, trying over 100 jury trials ranging from DUI to capital sexual battery and death penalty cases, and giving a voice to child victims as part of the Special Victims Unit.',
        'He now prosecutes catastrophic injury and wrongful death cases against major automakers, medical device manufacturers, and large hospital systems, combining tenacity, compassion, and a strong sense of ethics in his work for negligence victims.',
      ],
      education: [
        { school: 'Nova Southeastern University Law School', detail: 'Doctorate of Jurisprudence', year: '2006' },
        { school: 'University of Miami', detail: 'Bachelor of Arts, Business Administration', year: '2002' },
      ],
      affiliations: [
        'Florida Bar Association',
        'Palm Beach County Bar Association',
        'Palm Beach County Justice Association',
        'Florida Justice Association',
        'Palm Beach County Commission on Ethics — Chair',
        'Jewish Federation of Palm Beach County',
      ],
      awards: [],
      cases: [
        { amount: '$8.0M', caption: 'Confidential — medical malpractice' },
        { amount: '$5.0M', caption: 'Confidential — birth injury' },
      ],
    },
    'Ursula C. Cogswell, Esq.': {
      code: 'ursula_cogswell',
      bioHeading: 'Ursula C. Cogswell: Veteran Trial Attorney and Compassionate Advocate',
      bioParagraphs: [
        'Ursula C. Cogswell is a dedicated civil litigator with more than 20 years of courtroom experience, known for her strategic insight and trial acumen.',
        'She handles a wide range of serious personal injury matters, including motor vehicle and trucking accidents, premises and products liability, construction site accidents, negligent security, accidental drownings, wrongful death, traumatic brain injuries, sexual assault, nursing home abuse and neglect, medical malpractice, and complex multijurisdictional claims.',
      ],
      education: [
        { school: 'University of Miami School of Law', detail: 'Juris Doctor, cum laude', year: '2000' },
        { school: 'Florida International University', detail: 'B.S. in Business Administration, with honors', year: undefined },
      ],
      affiliations: [],
      awards: ['Fluent in Spanish; conversational in French', 'National and international competitive ballroom dancer', 'Advocate for animal welfare'],
      cases: [],
    },
    'Bryan Graves, Esq.': {
      code: 'bryan_graves',
      bioHeading: 'Bryan Graves: Advocate for the Injured',
      bioParagraphs: [
        'South Florida native Bryan Graves has devoted his career to fighting for injury victims and holding large corporations and insurers accountable.',
        'He began his practice in the U.S. Virgin Islands working on complex class actions involving asbestos exposure and tobacco litigation, and now represents clients across South Florida and the Treasure Coast in automobile, motorcycle, and trucking accidents, wrongful death, products liability, negligent security, premises liability, workplace injuries, and violent crime cases.',
      ],
      education: [
        { school: 'Florida International University College of Law', detail: 'Juris Doctor (Dean’s Scholar; Pro Bono Service Award)', year: undefined },
        { school: 'Florida State University', detail: 'Bachelor of Science in Business Finance', year: undefined },
      ],
      affiliations: [],
      awards: ['Successfully recovered millions of dollars for injury victims', 'First lawsuit drafted against Big Tobacco', 'Extensive class action experience in the U.S. Virgin Islands'],
      cases: [],
    },
  }

  return (
    <>
      <StickyNav />
      <div id="hero" style={{ position: 'absolute', top: 0, height: 1, width: 1, overflow: 'hidden' }} />
      <main className="team-page">
        <section className="team-hero">
          <div className="team-hero-inner">
            <h1 className="team-title">
              <span className="muted">{t('team_page.title_muted')}</span>
              <span className="strong">{t('team_page.title_strong')}</span>
            </h1>
          </div>
        </section>
        <section className="team-content">
          <div className="team-inner">
            <ul className="team-grid">
              {orderedLawyers.map((lawyer) => (
                <li
                  key={lawyer.name}
                  className="team-card"
                  onClick={() => setActiveLawyer(lawyer)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveLawyer(lawyer)
                  }}
                >
                  <div className="team-photo-box">
                    <span className="team-plus" aria-hidden="true">+</span>
                    <img className="team-photo" src={IMG[lawyer.name]} alt={lawyer.name} />
                  </div>
                  <div className="team-name">{lawyer.name}</div>
                  <div className="team-role">{lawyer.role}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      {activeLawyer && (
        <AttorneyPanel
          lawyer={activeLawyer}
          imageSrc={IMG[activeLawyer.name]}
          details={DETAILS[activeLawyer.name]}
          onClose={() => setActiveLawyer(null)}
        />
      )}
      <FooterSection />
    </>
  )
}

type AttorneyPanelProps = {
  lawyer: Lawyer
  imageSrc?: string
  details?: AttorneyDetail
  onClose: () => void
}

type AttorneyDetail = {
  code: string
  bioHeading: string
  bioParagraphs: string[]
  education: { school: string; detail: string; year?: string }[]
  affiliations?: string[]
  awards?: string[]
  cases?: { amount: string; caption: string }[]
}

function AttorneyPanel({ lawyer, imageSrc, details, onClose }: AttorneyPanelProps) {
  const { t, i18n } = useTranslation()
  const isEs = i18n.language.startsWith('es')

  const localizedBioParagraphs = details
    ? details.bioParagraphs.map((p, idx) =>
        isEs
          ? t(`team_attorney_details.${details.code}.bio_p${idx + 1}`, { defaultValue: p })
          : p
      )
    : []

  const localizedCases = details?.cases
    ? details.cases.map((c, idx) => ({
        amount: isEs
          ? t(`team_attorney_details.${details.code}.case${idx + 1}_amount`, { defaultValue: c.amount })
          : c.amount,
        caption: isEs
          ? t(`team_attorney_details.${details.code}.case${idx + 1}_caption`, { defaultValue: c.caption })
          : c.caption,
      }))
    : []
  return (
    <div className="attorney-overlay" role="dialog" aria-modal="true">
      <div
        className="attorney-backdrop"
        onClick={onClose}
        onTouchStart={onClose}
      />
      <div className="attorney-panel">
        <div className="attorney-inner">
          <div className="attorney-col-left">
            <div className="attorney-photo-shell">
              {imageSrc && <img className="attorney-photo" src={imageSrc} alt={lawyer.name} />}
            </div>
            {details?.education?.length ? (
              <div className="attorney-section">
                <div className="attorney-section-title">{t('team_attorney.education')}</div>
                {details.education.map((edu) => (
                  <div key={edu.school + edu.detail} className="attorney-edu-item">
                    <div>
                      <div className="attorney-edu-school">{edu.school}</div>
                      <div className="attorney-edu-detail">{edu.detail}</div>
                    </div>
                    {edu.year && <div className="attorney-edu-year">{edu.year}</div>}
                  </div>
                ))}
              </div>
            ) : null}
            {details?.affiliations && details.affiliations.length > 0 && (
              <div className="attorney-section">
                <div className="attorney-section-title">{t('team_attorney.professional_affiliations')}</div>
                <ul className="attorney-list">
                  {details.affiliations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {details?.awards && details.awards.length > 0 && (
              <div className="attorney-section">
                <div className="attorney-section-title">{t('team_attorney.awards')}</div>
                <ul className="attorney-list">
                  {details.awards.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="attorney-col-right">
            <header className="attorney-header">
              <div>
                <h2 className="attorney-name">{lawyer.name}</h2>
                <p className="attorney-role">{lawyer.role}</p>
              </div>
              <button
                className="attorney-close"
                type="button"
                onClick={onClose}
                onTouchStart={onClose}
                aria-label={t('team_attorney.close_profile')}
              >
                ×
              </button>
            </header>
            {details?.cases && details.cases.length > 0 && (
              <section className="attorney-notable">
                <h3 className="attorney-subtitle">{t('team_attorney.notable_case_wins')}</h3>
                <div className="attorney-cases">
                  {localizedCases.slice(0, 2).map((c) => (
                    <div key={c.amount + c.caption} className="attorney-case-card">
                      <div className="attorney-case-amount">{c.amount}</div>
                      <div className="attorney-case-caption">{c.caption}</div>
                      <span className="attorney-case-arrow">→</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {details && (
              <section className="attorney-bio">
                <h3 className="attorney-subtitle">
                  {isEs
                    ? t(`team_attorney_details.${details.code}.bio_heading`, { defaultValue: details.bioHeading })
                    : details.bioHeading}
                </h3>
                <div className="attorney-bio-copy">
                  {localizedBioParagraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
