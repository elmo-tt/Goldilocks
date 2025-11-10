import '@/sections/HeroSection.css'
import '@/styles/global.css'
import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import PracticeAreaTemplate from '@/pages/practice/PracticeAreaTemplate'
import type { PracticeAreaData } from '@/pages/practice/PracticeAreaTemplate'

export default function PracticeAreaTemplatePreview() {
  const area: PracticeAreaData = {
    key: 'motor-accidents',
    name: 'Motor Accidents',
    heroUrl: '/images/practice/motor-accidents-hero.png',
    headline: 'Turning Crash Claims Into Cash Outcomes',
    details:
      'From fender benders to catastrophic collisions, Goldlaw navigates the legal roadblocks so you can recover with peace of mind.',
    ratingScore: '4.8',
    ratingCount: 918,
  }

  return (
    <>
      <StickyNav />
      <PracticeAreaTemplate area={area} />
      <FooterSection />
    </>
  )
}
