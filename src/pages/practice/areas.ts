import type { PracticeAreaData } from './PracticeAreaTemplate'

export const PRACTICE_AREAS_MAP: Record<string, PracticeAreaData> = {
  'motor-accidents': {
    key: 'motor-accidents',
    name: 'Motor Accidents',
    heroUrl: '/images/practice/motor-accidents-hero.png',
    benefitsImageUrl: '/images/practice/motor-accidents-benefits.jpg',
    headline: 'Turning Crash Claims Into Cash Outcomes',
    details: 'From fender benders to catastrophic collisions, Goldlaw navigates the legal roadblocks so you can recover with peace of mind.',
    ratingScore: '4.8',
    ratingCount: 918,
  },
  'car-accidents': {
    key: 'car-accidents',
    name: 'Car Accidents',
    heroUrl: '/images/practice/motor-accidents-hero.png',
    benefitsImageUrl: '/images/practice/motor-accidents-benefits.jpg',
    headline: 'Turning Crash Claims Into Cash Outcomes',
    details: 'From fender benders to catastrophic collisions, Goldlaw navigates the legal roadblocks so you can recover with peace of mind.',
    ratingScore: '4.8',
    ratingCount: 918,
    testimonialsFolder: 'motor_accidents',
  },
  'accidental-drownings': {
    key: 'accidental-drownings',
    name: 'Accidental Drownings',
    heroUrl: '/images/practice/accidental-drowning/accidental-drowning-hero.jpeg',
    benefitsImageUrl: '/images/practice/accidental-drowning/accidental-drowning-benefits.jpeg',
    headline: 'Legal Action After a Preventable Drowning',
    details: 'From pools to open water, drownings often stem from poor warnings, unsafe conditions, or failed oversight. We document what went wrong and hold owners/operators accountable so families can focus on healing.',
    ratingScore: '4.8',
    ratingCount: 918,
    testimonialsFolder: 'motor_accidents',
    aboutStackTitle: true,
  },
}
