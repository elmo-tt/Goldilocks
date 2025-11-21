// i18n initialization (React)
// Minimal setup with in-memory resources and localStorage persistence.
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const getInitialLang = () => {
  try {
    const saved = localStorage.getItem('app_lang')
    if (saved) return saved
  } catch {}
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')) return 'es'
  return 'en'
}

void i18n
  .use(initReactI18next)
  .init({
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: {
        translation: {
          nav: {
            about: 'About',
            cases: 'Cases We Handle',
            blog: 'Blog',
            contact: 'Contact',
            free_case_review: 'Free case review',
            admin: 'Admin',
            login: 'Login',
            toggle_label: 'Language',
          },
          hero: {
            title: 'We Hold Accountable Those Who Hurt Others',
            as_featured_on: 'As featured on',
            metric_total_caption: 'in total amounts recovered for our amazing clients',
            metric_top_settlements_caption: 'of clients got a top settlement in under 1 year*',
            metric_years_caption: 'years of combined experience serving our clients',
            rating_from_reviews: 'From 918 Reviews',
            bullet_available: 'Available 24/7',
            bullet_board_certified: 'Board-certified Attorneys',
            bullet_no_fees: 'No Fees Or Costs Unless We Win',
          },
          common: {
            rating: 'Rating',
            reviews_from_count: 'From {{count}} Reviews',
          },
          hiw: {
            eyebrow: 'How it works',
            muted: 'Getting started is simple — ',
            strong: 'no upfront costs, only pay if we win.',
            copy: 'We make it easy to get help fast. Our team reviews your case, builds your claim, and fights for the maximum compensation you deserve.',
          },
          bento: {
            cards: {
              free: { title: 'Free Consultation', description: 'Speak with our legal team to review your case—no cost, no pressure.', label: '01' },
              build: { title: 'We Build Your Case', description: 'We investigate and gather evidence to build the strongest case.', label: '02' },
              fight: { title: 'We Fight For Results', description: 'We negotiate or go to trial to maximize the compensation you deserve.', label: '03' },
              locations: { title: 'Locations', description: 'West Palm Beach • Port St. Lucie • Belle Glade', label: 'Info' },
              rating: { title: 'Our Rating', description: '4.8 / 5.0 from 918 reviews', label: 'Score' },
              why: { title: 'Why GOLDLAW', description: 'Available 24/7 • Board‑certified • No fees unless we win', label: 'Benefits' },
            },
          },
          practice: {
            eyebrow: 'PRACTICE AREAS',
            title1: 'Experienced.',
            title2: 'Relentless.',
            title3: 'Results-Driven.',
            sub: 'Protecting your rights & securing maximum compensation.',
            view_all: 'View all',
            success_rate: 'success rate',
            learn_more: 'Learn more',
            cards: {
              'slip-fall': {
                title: 'Slip & Fall',
                description: 'Slip and fall accidents and other injuries caused by premises liability issues can cause serious injuries, leaving victims stuck with significant medical expenses and losing income while they heal.',
              },
              'vehicle-accident': {
                title: 'Vehicle Accident',
                description: 'Injured in a car crash? We fight to get you the compensation you deserve.',
              },
              'negligent-security': {
                title: 'Negligent Security',
                description: 'Negligent security laws are designed to hold property owners liable for crimes that occur on their premises due to inadequate security measures.',
              },
              'sexual-assault-human-trafficking': { title: 'Sexual Assault and Human Trafficking' },
              'motorcycle-accident': { title: 'Motorcycle Accident' },
              'wrongful-death': {
                title: 'Wrongful Death',
                description: 'No one ever expects to suffer the sudden and unexpected loss of a loved one.',
              },
            },
          },
          articles: {
            eyebrow: 'ARTICLES',
            muted: 'Powerful people, impressive results.',
            strong: "We’ve supported high-profile, pro-bono and everything in between.",
            view_all: 'View all',
            items: {
              'bill-cosby': { title: 'Spencer Kuvin Takes on Sexual Battery Case Against Bill Cosby' },
              'press-conference': { title: 'Spencer Kuvin Takes on Sexual Battery Case Against Bill Cosby' },
              'case-feature': { title: 'Spencer Kuvin Takes on Sexual Battery Case Against Bill Cosby' },
            },
          },
          about: {
            eyebrow: 'ABOUT US',
            muted: 'Delivering the results our',
            strong: 'clients deserve.',
            copy: 'At GOLDLAW, we don’t measure success by office size or flashy billboards— we measure it by the results we deliver. While other firms may settle quickly or play it safe, we fight hard for every client and never back down from getting you the justice you deserve.',
            learn_more: 'Learn more',
            results: {
              r1_desc: 'Tow truck driver killed by Semi-Truck',
              r2_desc: 'Young Woman Falls in Big Box Store',
              r3_desc: 'Ng, Sandi v. Walmart Verdict',
              r4_desc: 'Young child dies of undiagnosed illness',
            },
          },
          team_page: {
            title_muted: 'Meet our exceptional',
            title_strong: 'team of attorneys',
          },
          team_attorney: {
            education: 'Education',
            professional_affiliations: 'Professional Affiliations',
            awards: 'Awards & Accolades',
            notable_case_wins: 'Notable case wins',
            close_profile: 'Close profile',
          },
          contact: {
            eyebrow: 'LET’S GET STARTED',
            title_muted: 'You made the right choice.',
            title_strong: "Now, let's get started on your case.",
            first_name_label: 'First Name',
            first_name_placeholder: 'Enter your first name',
            last_name_label: 'Last Name',
            last_name_placeholder: 'Enter your last name',
            email_label: 'Email',
            email_placeholder: 'Enter your email',
            phone_label: 'Phone Number',
            phone_placeholder: 'Enter your phone number',
            case_type_label: 'Type of case',
            select_case_type: 'Select a case type',
            tell_us_label: 'Tell us what happened',
            provide_details_placeholder: 'Provide all the details of your incident',
            agreement: 'By submitting this form, I am agreeing to Goldlaw’s Privacy Policy.',
          },
          contact_page: {
            eyebrow: 'GET IN TOUCH',
            title_line1: 'Get in touch with',
            title_line2: 'our office today',
            body:
              "Whether you have been injured in a car accident or slip and fall, we're here to help. Get in touch with us via form or give us a call to get the quickest response.",
            visit_us_title: 'Visit Us',
            visit_us_office1_line1: '1641 Worthington Rd, Ste 300',
            visit_us_office1_line2: 'West Palm Beach, FL 33409',
            visit_us_office2_line1: '1100 St Lucie W Blvd, Suite 103',
            visit_us_office2_line2: 'Port St. Lucie, FL 34986',
            visit_us_office3_line1: '624 S. Main St., Suite 4',
            visit_us_office3_line2: 'Belle Glade, FL 33430',
            follow_us_title: 'Follow us',
            checkbox_immediate_ok: "Check this box if it's okay to contact you right away if needed.",
            checkbox_sms_consent:
              'By checking this box, I agree to receive SMS communication from GOLDLAW according to the privacy policy.',
            submit_label: 'Start your free case review',
          },
          footer: {
            tagline: 'A South Florida based Personal Injury Law Firm representing clients who deserve results.',
            contact: 'Contact',
            practice_areas: 'Practice Areas',
            company: 'Company',
            resources: 'Resources',
            subscribe_title: 'Subscribe to our\nnewsletter',
            subscribe_sub: 'Get legal insights that matter straight to your inbox — no fluff, just facts.',
            sign_up: 'Sign up →',
            view_all: 'View all',
            about: 'About',
            team: 'Team',
            careers: 'Careers',
            community: 'Community / Events',
            press: 'Press Releases',
            contact_link: 'Contact',
            faq: 'FAQ',
            blog: 'Blog',
            newsletters: 'Newsletters',
            promotions: 'Promotions & Incentives',
            testimonials: 'Testimonials',
            practice_items: {
              personal_injury: 'Personal Injury',
              car_accidents: 'Car Accidents',
              medical_malpractice: 'Medical Malpractice',
              slip_and_fall: 'Slip and Fall',
              sexual_assault: 'Sexual Assault',
              trucking_accidents: 'Trucking Accidents',
              wrongful_death: 'Wrongful Death',
            },
          },
          promos_page: {
            title: 'Discover the Exciting Promotions & Incentives at GOLDLAW',
            body:
              'To recognize and reward the support and dedication of our clients, past clients, future clients, and supporters, GOLDLAW is constantly running promotions and incentive programs, and it is time that you are well aware of them.',
            email_label: 'Enter your email',
            email_placeholder: 'Enter your email',
            cta: 'Get notified of promos →',
            right_body:
              'The GOLDLAW Marketing team will be holding at least one promotion each month, where lucky "winners" can take home cool prizes like:',
            prizes: {
              gift_cards: 'Gift Cards',
              sports_tickets: 'Tickets to Sports Events',
              concert_tickets: 'Tickets to Concerts, Shows, and Cultural Events',
              electronics: 'Electronic devices and other cool swag!',
            },
          },
          promos_hero: {
            page_title: 'Promos & Incentives',
            headline: 'Enter to win a $100 Gift Card and FREE Turkey',
            details_heading: 'GIVEAWAY DETAILS:',
            runs_line: '📅 Runs: Monday, November 3 – Friday, November 21 at 12:00 PM',
            winners_line: '🏆 Winners Announced: Friday, November 21',
            location_line: '📍 Pickup Location: GOLDLAW Office – West Palm Beach',
            terms_heading: 'TERMS & CONDITIONS:',
            terms_body:
              'Must live in Palm Beach, Martin, St. Lucie, or Broward County and be able to receive prizes in person at our West Palm Beach Office.',
            closing_line:
              'Don\'t miss out—enter NOW for a chance to make this Thanksgiving one to remember! 🦃💛🍂',
            go_to_post: 'Go to Post →',
            steps: {
              s1: 'Follow @800goldlaw',
              s2: 'Like this post',
              s3: 'Tag a friend you\'re thankful for in the comments',
              s4: 'Share this post to your story & tag @800goldlaw for an extra entry',
            },
            card_terms_prefix: '* Terms & Conditions:',
            card_terms_body:
              'Entrants must reside in Palm Beach County, Martin County, St. Lucie County or Broward County to be eligible to enter to win. One entry per person. GOLDLAW employees and immediate family may not participate.',
            image_alt: 'Thanksgiving giveaway promo',
          },
          faq: {
            title_muted: 'Check out our most',
            title_strong: 'Frequently Asked Questions.',
            card_title: 'Couldn’t find the answer you were looking for?',
            card_link: 'View all questions →',
            items: {
              0: {
                q: 'How are medical bills paid after a car accident?',
                a: 'There are a few ways your medical bills are paid after a car accident. GOLDLAW works with many doctors across various specialties that specialize in treating accident victims. Therefore, we can help you choose the doctors that can help you best. As far as paying for the treatment, in Florida, your car insurance pays the first $10,000 for medical treatment. Then, your health insurance, or Medicare, or Medicaid, might apply. GOLDLAW is skilled in making sure all available sources of payment are considered and used, in order to maximize the recovery to the client at the end of the case.',
              },
              1: {
                q: 'How long does a lawsuit take to settle?',
                a: 'The length of time a lawsuit takes to settle is not an easy answer because every case has a different level of complexity, the time a case takes to be concluded varies. Therefore, no exact answer can be given. Additionally, every personal injury case has aspects that are directly dependent on 3rd parties, such as insurance companies and law enforcement, which can add to the time it takes for your case to conclude. Often times, the greater the extent of the injuries, the more complex the case will be, and will therefore require more time to thoroughly litigate. You can generally expect us to settle your injury case in under 12 months if your case is settled without having to file a lawsuit. If your case doesn’t settle pre-suit, and we must go into litigation, the entire process can last between 12 months and three years or more.',
              },
              2: {
                q: 'How much will it cost for me to hire you?',
                a: 'When you hire GOLDLAW it will cost you nothing, there are NO up-front attorney’s fees or costs to hire GOLDLAW. We also provide a FREE consultation to evaluate whether or not you have a case we can be your lawyers for. Like most personal injury firms, GOLDLAW operates on what is called a “contingency fee” structure. Once we have decided to take your case, we begin work without you having to pay us anything. Instead, we take a percentage of the money we recover for you, at the end of the case. If we do not recover any money for your injury, we do not charge you anything for our attorney fees or costs. It’s that simple.',
              },
              3: {
                q: 'What is the “Statute of Limitations” on Personal Injury cases?',
                a: 'The Statute of Limitations on Personal Injury Cases varies. Different types of cases have different time periods within which we are required to file a lawsuit, in order to protect your legal right to recovery under Florida law. Different cases can have different statutory recovery time periods based on various circumstances and facts regarding the injury, and how or where the injury occurred. Some types of cases even require formal action within six months of the incident! Therefore, it’s best to call our office as soon as possible. Call us to get more information on the Statute of Limitations that may apply to your potential case.',
              },
              4: {
                q: 'Why do I need an experienced trial lawyer?',
                a: 'You need an experienced Trial Lawyer because some people try to negotiate their case with the insurance adjuster directly, thinking they will save money. Unfortunately, adjusters are trained to convince people without attorneys that they should not hire a lawyer. The adjuster then “low-balls” the injured victim, and convinces them to settle for far less than their case is worth. A lawyer is able to document and build the case, and pressure the insurance company into treating the client fairly and to offer fair compensation. Some insurance industry studies have shown that people who hire lawyers end up getting much more money than those who try to handle it themselves.',
              },
              5: {
                q: 'What does “no costs” and “no fees” really mean?',
                a: 'No Cost and No Fees mean that Personal injury firms operate on what is called a “contingency fee” structure. That just means that there are no upfront fees or costs to hire our law firm to begin working on your case. Instead of you paying us out of pocket, we take a percentage of the money we recover on your behalf, at the end of the case. That becomes our attorney fee. You will never pay us any money out of your own pocket. We simply keep a percentage of anything we recover. If we do not recover any compensation for your injury, we do not charge you for our attorney fees or costs. It’s that simple.',
              },
              6: {
                q: 'How much is my case worth?',
                a: 'This is a tough question to answer, especially early in a case. Case value varies based on the clarity of the negligence against the Defendant, the severity of the injuries that have occurred, and the amount of available insurance coverage. Our goal is to handle your case with integrity, detail, and vigor, which will maximize the recovery you receive. Contact us to ask further questions about how we determine the value of your case.',
              },
              7: {
                q: 'Are consultations really free?',
                a: 'Yes! A consultation with GOLDLAW is always completely free, and completely confidential. For the majority of our cases, you do not even need to speak with a lawyer. We have a highly trained client personal intake specialists whose sole function is to gather basic information about your case, which is then relayed on to a lawyer to determine whether we can represent you. There are always three outcomes of your initial call to our law firm regarding a new case: 1) We accept the case; 2) We are unable to accept the case (and we will always give you our reason why); 3) We may refer you to another attorney or law firm that is better suited to handle your case. GOLDLAW is your law firm for life! Give us a call anytime you have legal questions, whether it pertains to personal injury or not. We are always willing and available to guide you in any way we can.',
              },
            },
          },
          related: {
            title: 'Other articles you may like',
            category_fallback: 'Article',
          },
          articles_page: {
            title: 'Blog',
            all: 'All',
            load_more: 'Load more',
            empty: 'No articles for this filter yet.',
            featured_alt: 'featured',
            not_found: 'Article not found.',
            back_to_articles: 'Back to Articles',
            min_read: '{{count}} min read',
          },
          articles_template: {
            contact_cta: 'Contact GOLDLAW',
            hero_alt: 'hero',
          },
          practice_testimonials: {
            title: 'Hear the stories our clients have had',
          },
          practice_about_section: {
            eyebrow: 'OUR IMPACT',
            strong: 'Delivering results for our clients',
          },
          practice_pages: {
            'motor-accidents': {
              name: 'Motor Accidents',
              headline: 'Turning Crash Claims Into Cash Outcomes',
              details: 'From fender benders to catastrophic collisions, Goldlaw navigates the legal roadblocks so you can recover with peace of mind.',
            },
            'car-accidents': {
              name: 'Car Accidents',
              headline: 'Turning Crash Claims Into Cash Outcomes',
              details: 'From fender benders to catastrophic collisions, Goldlaw navigates the legal roadblocks so you can recover with peace of mind.',
            },
            'accidental-drownings': {
              name: 'Accidental Drownings',
              headline: 'Legal Action After a Preventable Drowning',
              details: 'From pools to open water, drownings often stem from poor warnings, unsafe conditions, or failed oversight. We document what went wrong and hold owners/operators accountable so families can focus on healing.',
            },
          },
          practice_why_pages: {
            'accidental-drownings': {
              strong: 'Many Drownings Are Preventable.',
              muted: 'Here’s how we build and prove these cases.',
              items: {
                0: {
                  title: 'Hazards, Warnings, and Barriers',
                  body: 'We document missing or inadequate warnings (e.g., riptides), fences, locks, covers, and other safety measures that should have been in place.'
                },
                1: {
                  title: 'Supervision and Lifeguards',
                  body: 'We evaluate whether reasonable supervision or trained lifeguards were required and absent, and how that failure contributed to the incident.'
                },
                2: {
                  title: 'Premises and Operator Negligence',
                  body: 'We investigate owners, managers, HOA/community lakes, hotels, and tour/boating operators for negligent conduct that created or failed to correct risks.'
                },
                3: {
                  title: 'Damages and Accountability',
                  body: 'We pursue compensation for medical care, lost wages, pain and suffering, and wrongful death where applicable.'
                }
              }
            }
          },
          practice_two_col_pages: {
            'accidental-drownings': {
              title_muted: 'Clarity, compassion,',
              title_strong: 'and results for families.',
              detail: 'We move quickly to preserve evidence, interview witnesses, and consult water‑safety experts. We explain each step, coordinate support, and pursue accountability while you focus on family.',
              benefits: {
                0: { title: 'Evidence-led investigations', text: 'We secure warnings, training, and safety records to show where systems failed.' },
                1: { title: 'Consistent communication', text: 'You’ll always know what’s happening and what’s next.' },
                2: { title: 'Full-service support', text: 'We coordinate care and resources while we pursue your claim.' },
              }
            }
          },
          practice_about_pages: {
            'accidental-drownings': {
              muted: 'seeking answers and accountability.',
            },
          },
          practice_welcome: {
            title_default: 'Welcome video',
            play_label: 'Play welcome video',
          },
          practice_two_col: {
            title_muted: 'The attorney you need,',
            title_strong: 'for the result you want.',
            benefits: {
              0: { title: 'Decades of Experience', text: 'Trusted in West Palm Beach and across Florida for tough accident claims.' },
              1: { title: 'Always Kept in the Loop', text: 'Clear, honest updates every step of the way. No legal black hole here.' },
              2: { title: 'Full-Service Support', text: "We guide you from day one through settlement or trial—so you're never on your own." },
            },
          },
          practice_about: {
            motor_vehicle: 'who have been in a motor vehicle accident.',
            accident_generic: 'who have been in {{lower}}.',
            injury_generic: 'who have suffered {{lower}}.',
            malpractice_generic: 'who have suffered {{lower}}.',
            wrongful_death: 'who have suffered a wrongful death.',
            fallback: 'who need help with {{lower}}.',
          },
          practice_bento: {
            areas_title: 'Neighborhoods and Areas we serve for {{areaName}} Cases',
            actions_title: 'What you should do before hiring us:',
            action_detail_intro: '{{action}} — Document details, timelines, and any relevant materials. Keep notes organized and ready for your consultation.',
            action_detail_followup: 'We’ll review this together and advise next steps specific to your {{areaName}} case.',
            actions: {
              0: 'Gather evidence',
              1: 'Seek medical attention',
              2: 'Keep a detailed journal of symptoms and expenses',
              3: 'Avoid giving recorded statements to insurers',
              4: 'Do not post about the accident on social media',
            },
          },
          practice_why: {
            eyebrow: 'WHY',
            strong: 'Auto accidents are among the leading causes of personal injury in Florida.',
            muted: 'Here’s why you need an attorney.',
            items: {
              0: {
                title: 'You May Be Entitled to More Compensation Than You Realize',
                body: 'After sustaining injuries in a car accident, many victims downplay their injuries or damages to avoid making a claim and potentially having their rates increase. However, you may be entitled to compensation for more than just physical injuries and property damage — including time off work, medical bills, and pain and suffering.',
              },
              1: {
                title: 'The Insurance Company Is Not On Your Side',
                body: 'Insurers are businesses focused on profit. They may offer low settlements, delay, or deny claims outright. Having a legal advocate ensures the process moves forward and protects your rights.',
              },
              2: {
                title: 'You May Need to Take Your Claim to Court',
                body: 'In some cases, taking your claim to court might be necessary to get the compensation you deserve. This could be because the insurance company has denied your claim or because they have made an unreasonably low settlement offer.',
              },
              3: {
                title: 'The Statute of Limitations Could Be Looming',
                body: "In Florida, the time limit for filing most car accident claims is now two years from the date of the accident. This may seem like a long time, but if you wait too long, important evidence, such as eyewitnesses and surveillance footage, can be more challenging to find. Consulting with a lawyer right away can make sure you're able to build a strong case that is filed on time.",
              },
            },
          },
        },
      },
      es: {
        translation: {
          nav: {
            about: 'Acerca de',
            cases: 'Casos que manejamos',
            blog: 'Blog',
            contact: 'Contacto',
            free_case_review: 'Evaluación gratuita del caso',
            admin: 'Admin',
            login: 'Iniciar sesión',
            toggle_label: 'Idioma',
          },
          promos_page: {
            title: 'Descubre las increíbles promociones e incentivos de GOLDLAW',
            body:
              'Para reconocer y recompensar el apoyo y la dedicación de nuestros clientes, exclientes, futuros clientes y simpatizantes, GOLDLAW realiza constantemente promociones y programas de incentivos, y es momento de que estés al tanto de ellos.',
            email_label: 'Ingresa tu correo electrónico',
            email_placeholder: 'Ingresa tu correo electrónico',
            cta: 'Recibe avisos de promociones →',
            right_body:
              'El equipo de marketing de GOLDLAW realizará al menos una promoción cada mes, donde afortunados “ganadores” podrán llevarse premios como:',
            prizes: {
              gift_cards: 'Tarjetas de regalo',
              sports_tickets: 'Boletos para eventos deportivos',
              concert_tickets: 'Boletos para conciertos, espectáculos y eventos culturales',
              electronics: 'Dispositivos electrónicos y otros artículos increíbles',
            },
          },
          promos_hero: {
            page_title: 'Promociones e incentivos',
            headline: 'Participa para ganar una tarjeta de regalo de $100 y un PAVO GRATIS',
            details_heading: 'DETALLES DEL SORTEO:',
            runs_line: '📅 Vigencia: lunes 3 de noviembre – viernes 21 de noviembre a las 12:00 p. m.',
            winners_line: '🏆 Ganadores anunciados: viernes 21 de noviembre',
            location_line: '📍 Lugar de recogida: Oficina de GOLDLAW – West Palm Beach',
            terms_heading: 'TÉRMINOS Y CONDICIONES:',
            terms_body:
              'Debes vivir en los condados de Palm Beach, Martin, St. Lucie o Broward y poder recibir los premios en persona en nuestra oficina de West Palm Beach.',
            closing_line:
              'No te lo pierdas: ¡participa AHORA para tener la oportunidad de hacer que este Día de Acción de Gracias sea inolvidable! 🦃💛🍂',
            go_to_post: 'Ver publicación →',
            steps: {
              s1: 'Sigue a @800goldlaw',
              s2: 'Dale “me gusta” a esta publicación',
              s3: 'Etiqueta en los comentarios a un amigo por el que estés agradecido',
              s4: 'Comparte esta publicación en tu historia y etiqueta a @800goldlaw para una entrada extra',
            },
            card_terms_prefix: '* Términos y condiciones:',
            card_terms_body:
              'Los participantes deben residir en los condados de Palm Beach, Martin, St. Lucie o Broward para poder participar. Una entrada por persona. Empleados de GOLDLAW y sus familiares directos no pueden participar.',
            image_alt: 'Promoción de sorteo de Acción de Gracias',
          },
          hero: {
            title: 'Hacemos responsables a quienes lastiman a otros',
            as_featured_on: 'Aparecimos en',
            metric_total_caption: 'en total recuperado para nuestros increíbles clientes',
            metric_top_settlements_caption: 'de los clientes obtuvieron un acuerdo superior en menos de 1 año*',
            metric_years_caption: 'años de experiencia combinada al servicio de nuestros clientes',
            rating_from_reviews: 'De 918 reseñas',
            bullet_available: 'Disponible 24/7',
            bullet_board_certified: 'Abogados certificados',
            bullet_no_fees: 'Sin honorarios ni costos a menos que ganemos',
          },
          common: {
            rating: 'Calificación',
            reviews_from_count: 'De {{count}} reseñas',
          },
          hiw: {
            eyebrow: 'Cómo funciona',
            muted: 'Comenzar es sencillo — ',
            strong: 'sin costos iniciales, solo pagas si ganamos.',
            copy: 'Facilitamos obtener ayuda rápidamente. Nuestro equipo revisa tu caso, construye tu reclamación y lucha por la máxima compensación.',
          },
          bento: {
            cards: {
              free: { title: 'Consulta gratuita', description: 'Habla con nuestro equipo legal para revisar tu caso—sin costo, sin presión.', label: '01' },
              build: { title: 'Construimos tu caso', description: 'Investigamos y reunimos evidencia para construir el caso más sólido.', label: '02' },
              fight: { title: 'Luchamos por resultados', description: 'Negociamos o vamos a juicio para maximizar la compensación que mereces.', label: '03' },
              locations: { title: 'Ubicaciones', description: 'West Palm Beach • Port St. Lucie • Belle Glade', label: 'Info' },
              rating: { title: 'Nuestra calificación', description: '4.8 / 5.0 de 918 reseñas', label: 'Puntaje' },
              why: { title: 'Por qué GOLDLAW', description: 'Disponible 24/7 • Certificados por la junta • Sin honorarios a menos que ganemos', label: 'Beneficios' },
            },
          },
          practice: {
            eyebrow: 'ÁREAS DE PRÁCTICA',
            title1: 'Con experiencia.',
            title2: 'Implacables.',
            title3: 'Orientados a resultados.',
            sub: 'Protegiendo tus derechos y asegurando la máxima compensación.',
            view_all: 'Ver todo',
            success_rate: 'tasa de éxito',
            learn_more: 'Más información',
            cards: {
              'slip-fall': {
                title: 'Resbalón y caída',
                description: 'Los accidentes por resbalón y caída u otros por responsabilidad de locales pueden causar lesiones graves, dejando a las víctimas con gastos médicos importantes y pérdida de ingresos mientras se recuperan.',
              },
              'vehicle-accident': {
                title: 'Accidente vehicular',
                description: '¿Lesionado en un choque? Luchamos para obtener la compensación que mereces.',
              },
              'negligent-security': {
                title: 'Seguridad negligente',
                description: 'Las leyes de seguridad negligente responsabilizan a los propietarios por delitos ocurridos en sus instalaciones debido a medidas de seguridad inadecuadas.',
              },
              'sexual-assault-human-trafficking': { title: 'Agresión sexual y trata de personas' },
              'motorcycle-accident': { title: 'Accidente de motocicleta' },
              'wrongful-death': {
                title: 'Muerte por negligencia',
                description: 'Nadie espera sufrir la pérdida repentina de un ser querido.',
              },
            },
          },
          articles: {
            eyebrow: 'ARTÍCULOS',
            muted: 'Personas influyentes, resultados impresionantes.',
            strong: 'Hemos apoyado casos de alto perfil, pro bono y todo lo demás.',
            view_all: 'Ver todo',
            items: {
              'bill-cosby': { title: 'Spencer Kuvin asume un caso de agresión sexual contra Bill Cosby' },
              'press-conference': { title: 'Spencer Kuvin asume un caso de agresión sexual contra Bill Cosby' },
              'case-feature': { title: 'Spencer Kuvin asume un caso de agresión sexual contra Bill Cosby' },
            },
          },
          about: {
            eyebrow: 'SOBRE NOSOTROS',
            muted: 'Ofrecemos los resultados que',
            strong: 'nuestros clientes merecen.',
            copy: 'En GOLDLAW, no medimos el éxito por el tamaño de la oficina o carteles llamativos; lo medimos por los resultados. Mientras otros pueden conformarse o jugar a lo seguro, nosotros luchamos por cada cliente y nunca renunciamos a lograr la justicia que mereces.',
            learn_more: 'Más información',
            results: {
              r1_desc: 'Conductor de grúa fallecido por camión semirremolque',
              r2_desc: 'Joven se cae en tienda de gran superficie',
              r3_desc: 'Ng, Sandi v. Walmart — Veredicto',
              r4_desc: 'Niño pequeño fallece por enfermedad no diagnosticada',
            },
          },
          team_page: {
            title_muted: 'Conoce a nuestro excepcional',
            title_strong: 'equipo de abogados',
          },
          team_attorney: {
            education: 'Educación',
            professional_affiliations: 'Afiliaciones profesionales',
            awards: 'Premios y reconocimientos',
            notable_case_wins: 'Casos destacados ganados',
            close_profile: 'Cerrar perfil',
          },
          team_attorney_details: {
            craig_goldenfarb: {
              bio_heading: 'Craig Goldenfarb: Un líder y experto abogado de lesiones personales',
              bio_p1:
                'Tras una carrera muy exitosa como litigante, el enfoque principal de Craig es formar y dirigir los equipos que gestionan directamente los casos de los clientes y supervisar los casos más grandes del bufete. Sigue supervisando asuntos de pre‑demanda y litigio que implican pérdidas significativas, como lesiones catastróficas, negligencia médica, accidentes de vehículos y casos de muerte por negligencia.',
              bio_p2:
                'Craig Goldenfarb es un abogado experto en lesiones personales y un ponente reconocido a nivel nacional ante organizaciones comunitarias, abogados y otros profesionales del derecho sobre una amplia variedad de temas relacionados con el derecho de lesiones personales, el litigio civil y el sistema de justicia. Es fundador de varias iniciativas benéficas que apoyan la educación superior y la salud del corazón.',
              bio_p3:
                'Craig y su familia viven en el condado de Palm Beach. Cuando no está luchando por sus clientes, le gusta apoyar a organizaciones comunitarias locales y pasar tiempo con su esposa e hijos.',
              case1_amount: '$3.5M',
              case1_caption: 'Motociclista fallecido por conductor ebrio',
              case2_amount: '$375,000',
              case2_caption: 'El auto del cliente fue rayado ("keyed")',
            },
            spencer_kuvin: {
              bio_heading: 'Spencer Kuvin: Un destacado abogado de lesiones personales',
              bio_p1:
                'Aunque comenzó su carrera defendiendo a grandes corporaciones multinacionales y compañías de seguros, Spencer Kuvin ha pasado los últimos 20 años de su distinguida trayectoria representando a personas frente a esos mismos gigantes, disfrutando el reto de ponerse del lado de quienes aparentemente tienen las probabilidades en contra.',
              bio_p2:
                'Como Director Jurídico y de Litigios de GOLDLAW, Spencer maneja muchos de los casos de lesiones personales más críticos del bufete. Ha tenido especial éxito dirigiendo el proceso de litigio en casos de alto perfil relacionados con muerte por negligencia, abuso y negligencia en asilos, agresión sexual, choques automovilísticos y lesiones cerebrales.',
              case1_amount: '$7.25M',
              case1_caption: 'Muerte por negligencia de un menor en accidente automovilístico (Francisco, Rivera v. Safeco)',
              case2_amount: '$5.25M',
              case2_caption: 'Choque automovilístico con colisión trasera (Higgins v. Geico)',
            },
            jorge_maxion: {
              bio_heading: 'Jorge L. Maxion: Una carrera diversa en el derecho de lesiones personales',
              bio_p1:
                'Durante su labor como Magistrado, Jorge presidió mociones previas al juicio y juicios sin jurado en casos de ejecución hipotecaria, en un momento en que Florida tenía uno de los mayores atrasos del país tras la crisis inmobiliaria de 2007‑2008.',
              bio_p2:
                'Hoy aplica esa experiencia en litigios para preparar de forma eficiente los casos de lesiones personales para juicio y obtener una compensación justa para los clientes lesionados, al tiempo que sirve a la comunidad hispana como abogado bilingüe y colaborador frecuente en programas de radio comunitarios.',
              case1_amount: '$2.3M',
              case1_caption: 'Caso de caída con lesiones graves',
              case2_amount: '$810K',
              case2_caption: 'Caso de resbalón y caída',
            },
            jeffrey_kirby: {
              bio_heading: 'Jeffrey D. Kirby: Un abogado hábil en lesiones personales',
              bio_p1:
                'Tras graduarse de la facultad de derecho Cumberland de la Universidad Samford, Jeffrey Kirby comenzó su carrera en la defensa de lesiones personales, representando a compañías de seguros y empresas auto‑aseguradas.',
              bio_p2:
                'Desde el año 2000 litiga casos de lesiones personales en nombre de clientes lesionados y sus familias, con una amplia experiencia en atropellos a peatones, negligencia médica, abuso en asilos, accidentes automovilísticos, seguridad negligente y productos defectuosos.',
              case1_amount: '$7.2M',
              case1_caption: 'Muerte por negligencia de un menor en accidente automovilístico (Francisco Rivera v. Safeco)',
              case2_amount: '$5.2M',
              case2_caption: 'Choque automovilístico con colisión trasera (Thomas Higgins v. GEICO)',
            },
            rafael_roca: {
              bio_heading: 'Rafael Roca: Un defensor experto en casos de lesiones personales',
              bio_p1:
                'Nacido en Cuba y criado en Miami, Rafael Roca ha dedicado su carrera a representar a clientes lesionados y a servir a las comunidades hispanas del condado de Palm Beach.',
              bio_p2:
                'Como abogado certificado en juicio civil, ha obtenido millones de dólares en veredictos y acuerdos en casos de muerte por negligencia, accidentes automovilísticos catastróficos y resbalones y caídas, además de ocupar cargos de liderazgo en numerosas organizaciones cívicas y jurídicas.',
              case1_amount: '$2.7M',
              case1_caption: 'Acuerdo por colisión de camión en la I‑95',
              case2_amount: '$2.5M',
              case2_caption: 'Servin v. Construction Co. — muerte laboral por caída de pluma elevadora',
            },
            michael_wasserman: {
              bio_heading: 'Michael Wasserman: De consultor de juicios a abogado de lesiones personales',
              bio_p1:
                'Después de graduarse de la Facultad de Derecho de Tulane, Michael Wasserman trabajó como consultor de juicios y luego como Defensor Público en Tallahassee y Miami durante casi una década, representando a clientes indigentes desde la primera comparecencia hasta el juicio por jurado en más de 50 juicios con jurado y más de 100 juicios en total.',
              bio_p2:
                'Posteriormente litigó casos de defensa de seguros y empleo antes de pasar al derecho de lesiones personales, donde ahora aporta décadas de experiencia en juicios a casos complejos de accidentes automovilísticos, responsabilidad de locales, negligencia médica, abuso y negligencia en asilos y muerte por negligencia.',
              case1_amount: '$825K',
              case1_caption: 'Responsabilidad de locales',
              case2_amount: '$675K',
              case2_caption: 'Abuso en asilo de ancianos',
            },
            paul_mcbride: {
              bio_heading: 'Paul McBride: Un abogado dedicado a tus necesidades legales',
              bio_p1:
                'Graduado de la Facultad de Derecho Levin de la Universidad de Florida, Paul McBride fue presidente de la Asociación de Derecho Penal y vicepresidente ejecutivo del equipo de juicios, obteniendo el máximo reconocimiento de la UF por trabajo pro bono y realizando varios juicios con jurado antes de graduarse.',
              bio_p2:
                'Inspirado por sus propias experiencias con el sistema judicial, trabajó como fiscal manejando casos de víctimas especiales y violencia doméstica, luego se incorporó a una de las firmas de lesiones personales más grandes del país antes de unirse a GOLDLAW, donde lleva casos que van desde choques automovilísticos y caídas hasta muerte por negligencia, responsabilidad por productos, seguridad negligente, negligencia médica y agresión sexual.',
              case1_amount: '$653K',
              case1_caption: 'Caída en tienda de gran superficie — enfermera retirada requirió cirugía',
              case2_amount: '$500K',
              case2_caption: 'Bicicleta vs. camioneta — ciclista atropellado en paso de peatones',
            },
            timothy_kenison: {
              bio_heading: 'Timothy Kenison: Abogado de juicio y apelaciones con pasión por la justicia',
              bio_p1:
                'Graduado de la Universidad de Florida y de la Facultad de Derecho Beasley de la Universidad Temple, Timothy Kenison comenzó su carrera en 2004 en la Oficina del Defensor Público del 15.º Circuito Judicial en West Palm Beach, donde llevó como primer abogado dieciséis juicios con jurado por delitos graves, incluidos agresión sexual capital y robo de vehículo, calificándolo para la certificación en derecho penal antes de pasar al ámbito civil.',
              bio_p2:
                'Posteriormente defendió a hospitales y proveedores médicos antes de unirse a GOLDLAW en 2020, donde combina su experiencia en juicios y apelaciones para representar a víctimas de negligencia en casos complejos de lesiones personales y negligencia médica.',
              case1_amount: '$3.5M',
              case1_caption: 'Acuerdo confidencial — caso de abuso y negligencia en centro de vida asistida',
              case2_amount: '$700K',
              case2_caption: 'Acuerdo confidencial — seguridad negligente en centro comercial con lesión de rodilla',
            },
            michael_kugler: {
              bio_heading: 'Michael Kugler: De fiscal estatal a defensor de las víctimas',
              bio_p1:
                'Michael Kugler comenzó su carrera jurídica en la Oficina del Fiscal Estatal del condado de Palm Beach, donde llevó a cabo más de 100 juicios con jurado por todo tipo de delitos, desde DUI hasta agresión sexual capital y casos de pena de muerte, dando voz a víctimas infantiles como parte de la Unidad de Víctimas Especiales.',
              bio_p2:
                'Ahora persigue casos de lesiones catastróficas y muerte por negligencia contra grandes fabricantes de automóviles, compañías de dispositivos médicos y grandes sistemas hospitalarios, combinando tenacidad, compasión y un fuerte sentido de la ética en su trabajo para las víctimas de negligencia.',
              case1_amount: '$8.0M',
              case1_caption: 'Acuerdo confidencial — negligencia médica',
              case2_amount: '$5.0M',
              case2_caption: 'Acuerdo confidencial — lesión de nacimiento',
            },
            ursula_cogswell: {
              bio_heading: 'Ursula C. Cogswell: Abogada litigante veterana y defensora compasiva',
              bio_p1:
                'Ursula C. Cogswell es una litigante civil con más de 20 años de experiencia en sala, reconocida por su visión estratégica y habilidades de juicio.',
              bio_p2:
                'Maneja una amplia gama de asuntos graves de lesiones personales, incluidos accidentes de vehículos y camiones, responsabilidad de locales y productos, accidentes en obras de construcción, seguridad negligente, ahogamientos accidentales, muerte por negligencia, lesiones cerebrales traumáticas, agresión sexual, abuso y negligencia en asilos, negligencia médica y reclamaciones multijurisdiccionales complejas.',
            },
            bryan_graves: {
              bio_heading: 'Bryan Graves: Defensor de los lesionados',
              bio_p1:
                'Nacido y criado en el sur de Florida, Bryan Graves ha dedicado su carrera a luchar por las víctimas de lesiones y a exigir responsabilidad a grandes corporaciones y compañías de seguros.',
              bio_p2:
                'Comenzó su práctica en las Islas Vírgenes de EE. UU., trabajando en acciones colectivas complejas relacionadas con exposición a asbesto y demandas contra la industria tabacalera, y hoy representa a clientes en el sur de Florida y la Costa del Tesoro en casos de accidentes de auto, motocicleta y camión, muerte por negligencia, responsabilidad por productos, seguridad negligente, responsabilidad de locales, lesiones laborales y víctimas de delitos violentos.',
            },
          },
          contact: {
            eyebrow: 'EMPECEMOS',
            title_muted: 'Tomaste la decisión correcta.',
            title_strong: 'Ahora, comencemos con tu caso.',
            first_name_label: 'Nombre',
            first_name_placeholder: 'Ingresa tu nombre',
            last_name_label: 'Apellido',
            last_name_placeholder: 'Ingresa tu apellido',
            email_label: 'Correo electrónico',
            email_placeholder: 'Ingresa tu correo electrónico',
            phone_label: 'Número de teléfono',
            phone_placeholder: 'Ingresa tu número de teléfono',
            case_type_label: 'Tipo de caso',
            select_case_type: 'Selecciona un tipo de caso',
            tell_us_label: 'Cuéntanos qué pasó',
            provide_details_placeholder: 'Proporciona todos los detalles de tu incidente',
            agreement: 'Al enviar este formulario, acepto la Política de Privacidad de Goldlaw.',
          },
          contact_page: {
            eyebrow: 'PONTE EN CONTACTO',
            title_line1: 'Ponte en contacto',
            title_line2: 'con nuestra oficina hoy',
            body:
              'Si has resultado lesionado en un accidente automovilístico o en una caída, estamos aquí para ayudarte. Contáctanos por medio del formulario o llámanos para obtener la respuesta más rápida.',
            visit_us_title: 'Visítanos',
            visit_us_office1_line1: '1641 Worthington Rd, Ste 300',
            visit_us_office1_line2: 'West Palm Beach, FL 33409',
            visit_us_office2_line1: '1100 St Lucie W Blvd, Suite 103',
            visit_us_office2_line2: 'Port St. Lucie, FL 34986',
            follow_us_title: 'Síguenos',
            checkbox_immediate_ok:
              'Marca esta casilla si está bien que nos pongamos en contacto contigo de inmediato si es necesario.',
            checkbox_sms_consent:
              'Al marcar esta casilla, acepto recibir comunicaciones por SMS de GOLDLAW de acuerdo con la política de privacidad.',
            submit_label: 'Comienza tu evaluación gratuita del caso',
          },
          footer: {
            tagline: 'Firma de lesiones personales con sede en el sur de Florida que representa a clientes que merecen resultados.',
            contact: 'Contacto',
            practice_areas: 'Áreas de práctica',
            company: 'Empresa',
            resources: 'Recursos',
            subscribe_title: 'Suscríbete a nuestro\nboletín',
            subscribe_sub: 'Recibe información legal directamente en tu bandeja — sin relleno, solo hechos.',
            sign_up: 'Registrarse →',
            view_all: 'Ver todo',
            about: 'Acerca de',
            team: 'Equipo',
            careers: 'Empleos',
            community: 'Comunidad / Eventos',
            press: 'Comunicados de prensa',
            contact_link: 'Contacto',
            faq: 'Preguntas frecuentes',
            blog: 'Blog',
            newsletters: 'Boletines',
            promotions: 'Promociones e incentivos',
            testimonials: 'Testimonios',
            practice_items: {
              personal_injury: 'Lesiones personales',
              car_accidents: 'Accidentes de tráfico',
              medical_malpractice: 'Negligencia médica',
              slip_and_fall: 'Resbalón y caída',
              sexual_assault: 'Agresión sexual',
              trucking_accidents: 'Accidentes de camiones',
              wrongful_death: 'Muerte por negligencia',
            },
          },
          faq: {
            title_muted: 'Consulta nuestras',
            title_strong: 'Preguntas frecuentes.',
            card_title: '¿No encontraste la respuesta que buscabas?',
            card_link: 'Ver todas las preguntas →',
            items: {
              0: {
                q: '¿Cómo se pagan las facturas médicas después de un accidente automovilístico?',
                a: 'Hay varias formas en que se pagan las facturas médicas después de un accidente. GOLDLAW trabaja con muchos médicos de diversas especialidades que tratan a víctimas de accidentes. En Florida, tu seguro de auto paga los primeros $10,000 de tratamiento. Luego, tu seguro médico, Medicare o Medicaid pueden aplicar. GOLDLAW se asegura de considerar todas las fuentes disponibles de pago para maximizar tu recuperación al final del caso.',
              },
              1: {
                q: '¿Cuánto tiempo tarda en resolverse una demanda?',
                a: 'El tiempo varía según la complejidad del caso y factores externos como aseguradoras y autoridades. Muchos casos se resuelven en menos de 12 meses sin demanda. Si se litiga, puede tardar entre 12 meses y tres años o más.',
              },
              2: {
                q: '¿Cuánto me costará contratarles?',
                a: 'Nada por adelantado. Trabajamos con honorarios de contingencia: solo cobramos un porcentaje del dinero recuperado al final del caso. Si no hay recuperación, no hay honorarios ni costos.',
              },
              3: {
                q: '¿Cuál es el “estatuto de limitaciones” en casos de lesiones personales?',
                a: 'Depende del tipo de caso y circunstancias. Algunos requieren acción formal en seis meses. Lo mejor es llamarnos lo antes posible para conocer el plazo aplicable.',
              },
              4: {
                q: '¿Por qué necesito un abogado litigante con experiencia?',
                a: 'Los ajustadores intentan pagar menos a quienes no tienen abogado. Un abogado documenta el caso, ejerce presión y aumenta la probabilidad de una compensación justa.',
              },
              5: {
                q: '¿Qué significa “sin costos” y “sin honorarios”?',
                a: 'Significa que no hay pagos iniciales. Cobramos un porcentaje de la recuperación final. Si no recuperamos compensación, no cobramos honorarios ni costos.',
              },
              6: {
                q: '¿Cuánto vale mi caso?',
                a: 'Depende de la negligencia, la gravedad de las lesiones y la cobertura disponible. Nuestro objetivo es maximizar tu recuperación con integridad y detalle.',
              },
              7: {
                q: '¿Las consultas son realmente gratis?',
                a: '¡Sí! Siempre gratuitas y confidenciales. Nuestro equipo recopila información básica y un abogado evalúa si podemos representarte. Si no, te orientamos o referimos.',
              },
            },
          },
          related: {
            title: 'Otros artículos que te pueden gustar',
            category_fallback: 'Artículo',
          },
          articles_page: {
            title: 'Blog',
            all: 'Todos',
            load_more: 'Cargar más',
            empty: 'No hay artículos para este filtro aún.',
            featured_alt: 'destacado',
            not_found: 'Artículo no encontrado.',
            back_to_articles: 'Volver a Artículos',
            min_read: '{{count}} min de lectura',
          },
          articles_template: {
            contact_cta: 'Contactar a GOLDLAW',
            hero_alt: 'imagen principal',
          },
          practice_testimonials: {
            title: 'Escucha las historias de nuestros clientes',
          },
          practice_about_section: {
            eyebrow: 'NUESTRO IMPACTO',
            strong: 'Ofrecemos resultados para nuestros clientes',
          },
          practice_pages: {
            'motor-accidents': {
              name: 'Accidentes de motor',
              headline: 'Transformamos reclamos por choques en resultados reales',
              details: 'Desde choques leves hasta colisiones catastróficas, GOLDLAW sortea los obstáculos legales para que te recuperes con tranquilidad.',
            },
            'car-accidents': {
              name: 'Accidentes de motor',
              headline: 'Transformamos reclamos por choques en resultados reales',
              details: 'Desde choques leves hasta colisiones catastróficas, GOLDLAW sortea los obstáculos legales para que te recuperes con tranquilidad.',
            },
            'accidental-drownings': {
              name: 'Ahogamientos accidentales',
              headline: 'Acción legal tras un ahogamiento prevenible',
              details: 'Desde piscinas hasta aguas abiertas, muchos ahogamientos ocurren por advertencias deficientes, condiciones inseguras o falta de supervisión. Documentamos qué falló y responsabilizamos a propietarios y operadores para que las familias puedan enfocarse en sanar.',
            },
          },
          practice_why_pages: {
            'accidental-drownings': {
              strong: 'Muchos ahogamientos se pueden prevenir.',
              muted: 'Así construimos y probamos estos casos.',
              items: {
                0: {
                  title: 'Peligros, advertencias y barreras',
                  body: 'Documentamos advertencias faltantes o inadecuadas (p. ej., corrientes de resaca), cercas, cerraduras, cobertores y otras medidas de seguridad.'
                },
                1: {
                  title: 'Supervisión y salvavidas',
                  body: 'Evaluamos si se requería una supervisión razonable o personal capacitado y cómo su ausencia contribuyó al incidente.'
                },
                2: {
                  title: 'Negligencia del propietario u operador',
                  body: 'Investigamos dueños, administradores, lagos/comunidades, hoteles y operadores de tours/embarcaciones por conductas negligentes.'
                },
                3: {
                  title: 'Daños y responsabilidad',
                  body: 'Buscamos compensación por atención médica, salarios perdidos, dolor y sufrimiento, y por muerte por negligencia, cuando corresponda.'
                }
              }
            }
          },
          practice_two_col_pages: {
            'accidental-drownings': {
              title_muted: 'Claridad, compasión,',
              title_strong: 'y resultados para las familias.',
              detail: 'Actuamos con rapidez para preservar evidencia, entrevistar testigos y consultar expertos en seguridad acuática. Explicamos cada paso, coordinamos apoyo y buscamos responsabilidad mientras te enfocas en tu familia.',
              benefits: {
                0: { title: 'Investigaciones basadas en evidencia', text: 'Obtenemos advertencias, registros de capacitación y seguridad para mostrar dónde fallaron los sistemas.' },
                1: { title: 'Comunicación constante', text: 'Siempre sabrás qué está pasando y qué sigue.' },
                2: { title: 'Apoyo integral', text: 'Coordinamos atención y recursos mientras tramitamos tu reclamación.' },
              }
            }
          },
          practice_about_pages: {
            'accidental-drownings': {
              muted: 'buscando respuestas y responsabilidad.',
            },
          },
          practice_welcome: {
            title_default: 'Video de bienvenida',
            play_label: 'Reproducir video de bienvenida',
          },
          practice_two_col: {
            title_muted: 'El abogado que necesitas,',
            title_strong: 'para el resultado que deseas.',
            benefits: {
              0: { title: 'Décadas de experiencia', text: 'De confianza en West Palm Beach y en toda Florida para casos complejos de accidentes.' },
              1: { title: 'Siempre informado', text: 'Actualizaciones claras y honestas en cada paso. Sin entrar en un agujero negro legal.' },
              2: { title: 'Apoyo integral', text: 'Te guiamos desde el primer día hasta el acuerdo o juicio — nunca estás solo.' },
            },
          },
          practice_about: {
            motor_vehicle: 'que han estado en un accidente de vehículo motorizado.',
            accident_generic: 'que han estado en {{lower}}.',
            injury_generic: 'que han sufrido {{lower}}.',
            malpractice_generic: 'que han sufrido {{lower}}.',
            wrongful_death: 'que han sufrido una muerte por negligencia.',
            fallback: 'que necesitan ayuda con {{lower}}.',
          },
          practice_bento: {
            areas_title: 'Barrios y zonas que atendemos para casos de {{areaName}}',
            actions_title: 'Qué debes hacer antes de contratarnos:',
            action_detail_intro: '{{action}} — Documenta detalles, cronologías y cualquier material relevante. Mantén notas organizadas y listas para tu consulta.',
            action_detail_followup: 'Revisaremos esto juntos y aconsejaremos los próximos pasos específicos para tu caso de {{areaName}}.',
            actions: {
              0: 'Reunir evidencia',
              1: 'Buscar atención médica',
              2: 'Llevar un registro detallado de síntomas y gastos',
              3: 'Evitar dar declaraciones grabadas a aseguradoras',
              4: 'No publicar sobre el accidente en redes sociales',
            },
          },
          practice_why: {
            eyebrow: 'POR QUÉ',
            strong: 'Los accidentes automovilísticos son una de las principales causas de lesiones personales en Florida.',
            muted: 'Por qué necesitas un abogado.',
            items: {
              0: {
                title: 'Podrías tener derecho a más compensación de la que crees',
                body: 'Tras un accidente, muchas víctimas minimizan sus lesiones para evitar reclamar. Sin embargo, podrías tener derecho a más que daños físicos y a la propiedad — incluidos salarios perdidos, facturas médicas y dolor y sufrimiento.',
              },
              1: {
                title: 'La aseguradora no está de tu lado',
                body: 'Las aseguradoras buscan beneficios. Pueden ofrecer acuerdos bajos, retrasar o negar reclamos. Contar con un abogado impulsa el proceso y protege tus derechos.',
              },
              2: {
                title: 'Puede que necesites llevar tu reclamo a los tribunales',
                body: 'A veces es necesario litigar para obtener la compensación que mereces, ya sea porque negaron el reclamo o porque la oferta es injustamente baja.',
              },
              3: {
                title: 'El plazo de prescripción podría estar cerca',
                body: 'En Florida, el límite para la mayoría de reclamos por accidentes es de dos años. Esperar puede dificultar obtener evidencia. Consultar con un abogado de inmediato ayuda a construir un caso sólido a tiempo.',
              },
            },
          },
        },
      },
    },
  })

// Persist language choice and reflect in <html lang>
i18n.on('languageChanged', (lng: string) => {
  try { localStorage.setItem('app_lang', lng) } catch {}
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lng)
  }
})

// Set initial lang attribute
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', i18n.language || getInitialLang())
}

export default i18n
