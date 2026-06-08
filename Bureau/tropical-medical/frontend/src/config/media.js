// Chemins centralisés vers les médias (images, logos, icônes)
// Remplacer les chemins par défaut par les vrais fichiers quand disponibles

const BASE = '/media'

export const MEDIA = {
  // Logos
  logoFull:      `${BASE}/logo-full.svg`,
  logoIcon:      `${BASE}/logo-icon.svg`,
  logoWhite:     `${BASE}/logo-white.svg`,

  // Hero & illustrations
  heroMain:      `${BASE}/hero-main.jpg`,
  heroBg:        `${BASE}/hero-bg.svg`,
  doctorHero:    `${BASE}/doctor-hero.png`,

  // Avatars par défaut
  avatarDefault: `${BASE}/avatar-default.svg`,
  avatarDoctor:  `${BASE}/avatar-doctor.svg`,
  avatarPatient: `${BASE}/avatar-patient.svg`,
  avatarAdmin:   `${BASE}/avatar-admin.svg`,

  // Pays / paiement mobile
  orangeMoney:   `${BASE}/orange-money.svg`,
  wave:          `${BASE}/wave.svg`,
  freeMoney:     `${BASE}/free-money.svg`,

  // Assurances
  cmu:           `${BASE}/cmu.png`,
  cnss:          `${BASE}/cnss.png`,
  ipm:           `${BASE}/ipm.png`,

  // Illustrations modules
  consultIllus:  `${BASE}/consultation-illus.svg`,
  pharmacieIllus:`${BASE}/pharmacie-illus.svg`,
  hospIllus:     `${BASE}/hospitalisation-illus.svg`,
  urgenceIllus:  `${BASE}/urgence-illus.svg`,

  // Backgrounds
  bgPattern:     `${BASE}/bg-pattern.svg`,
  bgGradient:    `${BASE}/bg-gradient.jpg`,

  // Favicon & manifest
  favicon:       '/favicon.svg',
}

export default MEDIA
