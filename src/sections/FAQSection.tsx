import { useMemo, useState } from 'react'
import './FAQSection.css'

type QA = { q: string; a: string }

export default function FAQSection() {
  const items: QA[] = useMemo(
    () => [
      {
        q: 'How are medical bills paid after a car accident?',
        a: `There are a few ways your medical bills are paid after a car accident. GOLDLAW works with many doctors across various specialties that specialize in treating accident victims. Therefore, we can help you choose the doctors that can help you best. As far as paying for the treatment, in Florida, your car insurance pays the first $10,000 for medical treatment. Then, your health insurance, or Medicare, or Medicaid, might apply. GOLDLAW is skilled in making sure all available sources of payment are considered and used, in order to maximize the recovery to the client at the end of the case.`,
      },
      {
        q: 'How long does a lawsuit take to settle?',
        a: `The length of time a lawsuit takes to settle is not an easy answer because every case has a different level of complexity, the time a case takes to be concluded varies. Therefore, no exact answer can be given. Additionally, every personal injury case has aspects that are directly dependent on 3rd parties, such as insurance companies and law enforcement, which can add to the time it takes for your case to conclude. Often times, the greater the extent of the injuries, the more complex the case will be, and will therefore require more time to thoroughly litigate. You can generally expect us to settle your injury case in under 12 months if your case is settled without having to file a lawsuit. If your case doesn’t settle pre-suit, and we must go into litigation, the entire process can last between 12 months and three years or more.`,
      },
      {
        q: 'How much will it cost for me to hire you?',
        a: `When you hire GOLDLAW it will cost you nothing, there are NO up-front attorney’s fees or costs to hire GOLDLAW. We also provide a FREE consultation to evaluate whether or not you have a case we can be your lawyers for. Like most personal injury firms, GOLDLAW operates on what is called a “contingency fee” structure. Once we have decided to take your case, we begin work without you having to pay us anything. Instead, we take a percentage of the money we recover for you, at the end of the case. If we do not recover any money for your injury, we do not charge you anything for our attorney fees or costs. It’s that simple.`,
      },
      {
        q: 'What is the “Statute of Limitations” on Personal Injury cases?',
        a: `The Statute of Limitations on Personal Injury Cases varies. Different types of cases have different time periods within which we are required to file a lawsuit, in order to protect your legal right to recovery under Florida law. Different cases can have different statutory recovery time periods based on various circumstances and facts regarding the injury, and how or where the injury occurred. Some types of cases even require formal action within six months of the incident! Therefore, it’s best to call our office as soon as possible. Call us to get more information on the Statute of Limitations that may apply to your potential case.`,
      },
      {
        q: 'Why do I need an experienced trial lawyer?',
        a: `You need an experienced Trial Lawyer because some people try to negotiate their case with the insurance adjuster directly, thinking they will save money. Unfortunately, adjusters are trained to convince people without attorneys that they should not hire a lawyer. The adjuster then “low-balls” the injured victim, and convinces them to settle for far less than their case is worth. A lawyer is able to document and build the case, and pressure the insurance company into treating the client fairly and to offer fair compensation. Some insurance industry studies have shown that people who hire lawyers end up getting much more money than those who try to handle it themselves.`,
      },
      {
        q: 'What does “no costs” and “no fees” really mean?',
        a: `No Cost and No Fees mean that Personal injury firms operate on what is called a “contingency fee” structure. That just means that there are no upfront fees or costs to hire our law firm to begin working on your case. Instead of you paying us out of pocket, we take a percentage of the money we recover on your behalf, at the end of the case. That becomes our attorney fee. You will never pay us any money out of your own pocket. We simply keep a percentage of anything we recover. If we do not recover any compensation for your injury, we do not charge you for our attorney fees or costs. It’s that simple.`,
      },
      {
        q: 'How much is my case worth?',
        a: `This is a tough question to answer, especially early in a case. Case value varies based on the clarity of the negligence against the Defendant, the severity of the injuries that have occurred, and the amount of available insurance coverage. Our goal is to handle your case with integrity, detail, and vigor, which will maximize the recovery you receive. Contact us to ask further questions about how we determine the value of your case.`,
      },
      {
        q: 'Are consultations really free?',
        a: `Yes! A consultation with GOLDLAW is always completely free, and completely confidential. For the majority of our cases, you do not even need to speak with a lawyer. We have a highly trained client personal intake specialists whose sole function is to gather basic information about your case, which is then relayed on to a lawyer to determine whether we can represent you. There are always three outcomes of your initial call to our law firm regarding a new case: 1) We accept the case; 2) We are unable to accept the case (and we will always give you our reason why); 3) We may refer you to another attorney or law firm that is better suited to handle your case. GOLDLAW is your law firm for life! Give us a call anytime you have legal questions, whether it pertains to personal injury or not. We are always willing and available to guide you in any way we can.`,
      },
    ],
    []
  )

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="faq">
      <div className="faq-inner">
        <div className="faq-left">
          <h2 className="faq-title">
            <span className="muted">Check out our most</span>
            <span>Frequently Asked Questions.</span>
          </h2>
          <a className="faq-card" href="#">
            <div className="faq-card-title">Couldn’t find the answer you were looking for?</div>
            <div className="faq-card-link">View all questions →</div>
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
