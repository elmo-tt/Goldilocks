export type Lawyer = { name: string; role: string; profileUrl?: string };
export type PracticeArea = { key: string; label: string; url: string };
export type Office = { city: string; mapsUrl: string };

export const LAWYERS: Lawyer[] = [
  { name: "Craig M. Goldenfarb, Esq.", role: "Founder / Critical Case Attorney", profileUrl: "https://goldlaw.com/our-team/craig-m-goldenfarb/" },
  { name: "Spencer T. Kuvin, Esq.", role: "Litigation Director", profileUrl: "https://goldlaw.com/our-team/spencer-t-kuvin/" },
  { name: "Jorge L. Maxion, Esq.", role: "Pre-Suit Attorney", profileUrl: "https://goldlaw.com/our-team/jorge-l-maxion/" },
  { name: "Jeffrey D. Kirby, Esq.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/jeffrey-d-kirby/" },
  { name: "Rafael J. Roca, Esq. BSC.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/rafael-j-roca/" },
  { name: "Michael A. Wasserman, Esq.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/michael-a-wasserman/" },
  { name: "Timothy D. Kenison, Esq.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/timothy-d-kenison/" },
  { name: "Paul McBride, Esq.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/paul-mcbride/" },
  { name: "Michael H. Kugler, Esq.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/michael-h-kugler/" },
  { name: "Ursula C. Cogswell, Esq.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/ursula-c-cogswell-esq/" },
  { name: "Bryan Graves, Esq.", role: "Civil Trial Attorney", profileUrl: "https://goldlaw.com/our-team/bryan-graves-esq/" }
];

export const PRACTICE_AREAS: PracticeArea[] = [
  { key: "personal-injury-wpb", label: "Personal Injury", url: "https://goldlaw.com/west-palm-beach-personal-injury-lawyer/" },
  { key: "accidental-drownings", label: "Accidental Drownings", url: "https://goldlaw.com/accidental-drownings/" },
  { key: "addiction-rehab", label: "Addiction Rehab Abuse Injuries", url: "https://goldlaw.com/addiction-rehab-abuse-injuries/" },
  { key: "aed-liability", label: "AED Liability", url: "https://goldlaw.com/aed-liability/" },
  { key: "airplane-accidents", label: "Airplane Accidents", url: "https://goldlaw.com/aviation-disaster-cases/" },
  { key: "spinal-cord", label: "Spinal Cord Injuries", url: "https://goldlaw.com/back-spinal-cord-injuries/" },
  { key: "bicycle", label: "Bicycle Accidents", url: "https://goldlaw.com/bicycle-accident-injury/" },
  { key: "birth-injuries", label: "Birth Injuries and Accidents", url: "https://goldlaw.com/west-palm-beach-birth-injury-attorney/" },
  { key: "boating", label: "Boating Accidents", url: "https://goldlaw.com/boating-accident-injury/" },
  { key: "car", label: "Car Accidents", url: "https://goldlaw.com/car-accident-lawyer/" },
  { key: "choking", label: "Choking Accidents", url: "https://goldlaw.com/choking-accident-injury/" },
  { key: "construction", label: "Construction Site Accidents", url: "https://goldlaw.com/west-palm-beach-construction-site-injury-attorney/" },
  { key: "cruise", label: "Cruise Ship Injury", url: "https://goldlaw.com/cruise-ship-accident-injury/" },
  { key: "heavy-machinery", label: "Heavy Machinery Accident", url: "https://goldlaw.com/heavy-machinery-accident-injury/" },
  { key: "human-trafficking", label: "Human Trafficking", url: "https://goldlaw.com/west-palm-beach-human-trafficking-liability-lawyer/" },
  { key: "legal-malpractice", label: "Legal Malpractice", url: "https://goldlaw.com/legal-malpractice/" },
  { key: "medical-malpractice", label: "Medical Malpractice", url: "https://goldlaw.com/medical-malpractice/" },
  { key: "motorcycle", label: "Motorcycle Accidents", url: "https://goldlaw.com/motorcycle-accident-injury/" },
  { key: "negligent-security", label: "Negligent Security", url: "https://goldlaw.com/inadequate-security-injury/" },
  { key: "nursing-home", label: "Nursing Home Abuse & Neglect", url: "https://goldlaw.com/nursing-home-abuse-neglect/" },
  { key: "pedestrian", label: "Pedestrian Accidents", url: "https://goldlaw.com/pedestrian-accidents-injury/" },
  { key: "slip-fall", label: "Slip and Fall", url: "https://goldlaw.com/slip-trip-fall-injury/" },
  { key: "premises", label: "Premises Liability", url: "https://goldlaw.com/west-palm-beach-premises-liability/" },
  { key: "product-liability", label: "Product Liability Injury", url: "https://goldlaw.com/product-liability-injury/" },
  { key: "railroad", label: "Railroad Accidents", url: "https://goldlaw.com/railroad-accident-injury/" },
  { key: "retail-grocery", label: "Retail & Grocery Store Accident", url: "https://goldlaw.com/retail-grocery-store-injury/" },
  { key: "sexual-assault", label: "Sexual Assault", url: "https://goldlaw.com/sexual-assault/" },
  { key: "tbi", label: "Traumatic Brain Injury", url: "https://goldlaw.com/head-traumatic-brain-injuries/" },
  { key: "trucking", label: "Trucking Accidents", url: "https://goldlaw.com/trucking-accident-injury/" },
  { key: "wrongful-death", label: "Wrongful Death", url: "https://goldlaw.com/wrongful-death/" },
  { key: "uber-lyft", label: "Uber/Lyft Accidents", url: "https://goldlaw.com/west-palm-beach-uber-lyft-accident-lawyer/" },
  { key: "workers-comp", label: "Workers’ Compensation", url: "https://goldlaw.com/port-st-lucie-workers-compensation-lawyer/" },
  { key: "catastrophic-injury", label: "Catastrophic Injury", url: "https://goldlaw.com/port-st-lucie-catastrophic-injury-attorney/" }
];

export const OFFICES: Office[] = [
  { city: "West Palm Beach", mapsUrl: "https://goo.gl/maps/QndytSC7SfKd1cCr6" },
  { city: "Port Saint Lucie", mapsUrl: "https://goo.gl/maps/okd9XC74LxR5Tp1z7" }
];

export const CTA = {
  phone: "(561) 222-2222",
  tel: "tel:+15612222222",
  contactUrl: "https://goldlaw.com/contact/"
};
