import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import HeroSection from '@/sections/HeroSection'
import '@/sections/HeroSection.css'
import PracticeAreas from '@/sections/PracticeAreas'
import '@/sections/PracticeAreas.css'
import ArticlesSection from '@/sections/ArticlesSection'
import '@/sections/ArticlesSection.css'
import AboutSection from '@/sections/AboutSection'
import '@/sections/AboutSection.css'
import HowItWorksSection from '@/sections/HowItWorksSection'
import '@/sections/HowItWorksSection.css'
import TestimonialsSection from '@/sections/TestimonialsSection'
import '@/sections/TestimonialsSection.css'
import ContactSection from '@/sections/ContactSection'
import '@/sections/ContactSection.css'
import FAQSection from '@/sections/FAQSection'
import '@/sections/FAQSection.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'

export default function App() {
  return (
    <>
      <StickyNav />
      <main>
        <HeroSection />
        <PracticeAreas />
        <AboutSection />
        <TestimonialsSection />
        <HowItWorksSection />
        <ArticlesSection />
        <ContactSection />
        <FAQSection />
      </main>
      <FooterSection />
    </>
  )
}
