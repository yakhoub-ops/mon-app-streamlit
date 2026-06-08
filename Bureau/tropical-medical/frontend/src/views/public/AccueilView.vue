<template>
  <div class="accueil">

    <!-- ══════════════════════════════════════════
         HERO — STYLE VOKA : TEXTE GAUCHE + VIDÉO DROITE
    ══════════════════════════════════════════ -->
    <section class="hero">
      <video class="hero-video" autoplay muted loop playsinline src="/media/hero-medical-3d.mp4"></video>
      <!-- Dégradé fort à gauche comme VOKA -->
      <div class="hero-overlay"></div>

      <div class="hero-inner">
        <div class="hero-content"
          v-motion :initial="{ opacity:0, x:-50 }" :enter="{ opacity:1, x:0, transition:{ duration:900, delay:150 } }">

          <!-- Breadcrumb style VOKA -->
          <div class="hero-breadcrumb">
            <ChevronLeft :size="13" /> Tropical Medical
          </div>

          <h1 class="hero-title">
            Les meilleurs soins<br/>de santé,<br/>
            <span class="gradient-text">accessibles à tous</span>
          </h1>

          <p class="hero-desc">
            De la consultation en ligne à la gestion du dossier médical, notre plateforme
            donne vie à une médecine moderne, précise et accessible à toutes les familles sénégalaises.
          </p>

          <div class="hero-actions">
            <RouterLink to="/connexion" class="btn-hero-cta">
              Commencer mon suivi
            </RouterLink>
            <a href="#comment" class="btn-glass" @click.prevent="scrollTo('#comment')">
              Comment ça marche <ChevronDown :size="16" />
            </a>
          </div>

          <div class="hero-trust">
            <div class="trust-item"><CheckCircle :size="13" /> Données médicales sécurisées</div>
            <div class="trust-item"><CheckCircle :size="13" /> Prescriptions valides</div>
            <div class="trust-item"><CheckCircle :size="13" /> Support 24h/24</div>
          </div>
        </div>
      </div>

      <div class="hero-bottom-fade"></div>
    </section>

    <!-- ══════════════════════════════════════════
         STATS — DÉFILEMENT AUTOMATIQUE (TICKER)
    ══════════════════════════════════════════ -->
    <div class="stats-ticker-wrap">
      <div class="stats-ticker">
        <!-- Deux passes pour le loop infini -->
        <template v-for="pass in 2" :key="pass">
          <div v-for="s in stats" :key="`${pass}-${s.label}`" class="ticker-item">
            <div class="ticker-val" :style="{ color: s.couleur }">{{ s.valeur }}</div>
            <div class="ticker-lbl">{{ s.label }}</div>
          </div>
          <div class="ticker-sep" v-for="s in stats" :key="`sep-${pass}-${s.label}`" style="display:none"></div>
        </template>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         APERÇU PLATEFORME
    ══════════════════════════════════════════ -->
    <section class="section-dark">
      <div class="container">
        <div class="apercu-layout"
          v-motion :initial="{ opacity:0, y:36 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:650 } }">

          <div class="apercu-img-wrap">
            <div class="apercu-glow-orb"></div>
            <img src="/image medicale/Medical life.jpeg" alt="Médecin en consultation" class="apercu-img"/>
          </div>

          <div class="apercu-infos glass-card">
            <div class="ai-icon-box"><Monitor :size="24" style="color:#22C55E" /></div>
            <h2 class="title-white">Votre dossier médical <span class="gradient-text">centralisé et sécurisé</span></h2>
            <p class="text-muted">Accédez à l'intégralité de votre historique médical en un seul endroit. Consultations, résultats, ordonnances, vaccinations — tout archivé et accessible instantanément depuis votre smartphone ou ordinateur.</p>

            <div class="ai-features">
              <div v-for="f in apercuFeats" :key="f.label" class="ai-feat">
                <div class="af-dot" :style="{ background: f.couleur }"></div>
                <span>{{ f.label }}</span>
              </div>
            </div>

            <div class="ai-stats-row">
              <div class="ai-stat">
                <div class="ai-stat-num gradient-text">5 000+</div>
                <div class="ai-stat-lbl">Patients actifs</div>
              </div>
              <div class="ai-stat-sep"></div>
              <div class="ai-stat">
                <div class="ai-stat-num gradient-text">24h/7j</div>
                <div class="ai-stat-lbl">Support disponible</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         ANIMATIONS MÉDICALES 3D (style VOKA)
    ══════════════════════════════════════════ -->
    <section class="section-deep" id="animations">
      <div class="container">
        <div class="section-header"
          v-motion :initial="{ opacity:0, y:24 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500 } }">
          <div class="tag-chip"><Play :size="12" /> Animations médicales 3D</div>
          <h2 class="title-white">La science rendue <span class="gradient-text">visible</span></h2>
          <p class="text-muted">Des animations 3D cliniquement précises pour la formation médicale, la communication patient et la compréhension des mécanismes biologiques.</p>
        </div>

        <div class="videos-layout">
          <!-- Vidéo principale VOKA showreel -->
          <div class="video-main glass-card"
            v-motion :initial="{ opacity:0, x:-40 }" :visibleOnce="{ opacity:1, x:0, transition:{ duration:600 } }">
            <div class="video-embed-wrap">
              <iframe
                src="https://www.youtube.com/embed/-q-atQgJ67g?rel=0&modestbranding=1"
                title="Animations médicales 3D – VOKA Showreel"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
              </iframe>
            </div>
            <div class="video-main-footer">
              <span class="tag-chip-purple">Showreel VOKA</span>
              <p>Animations médicales 3D haute définition — formation professionnelle et communication patient</p>
            </div>
          </div>

          <!-- Cartes vidéo thématiques -->
          <div class="videos-side">
            <div v-for="(vid, i) in videosGrid" :key="i" class="video-card glass-card"
              v-motion :initial="{ opacity:0, x:40 }" :visibleOnce="{ opacity:1, x:0, transition:{ duration:500, delay:i*130 } }">
              <div class="vcard-thumb" :style="{ background: vid.gradient }">
                <component :is="vid.icone" :size="32" style="color:rgba(255,255,255,0.75)" />
                <a :href="vid.url" target="_blank" rel="noopener" class="vcard-play">
                  <Play :size="18" />
                </a>
              </div>
              <div class="vcard-info">
                <div class="vcard-cat">{{ vid.categorie }}</div>
                <div class="vcard-titre">{{ vid.titre }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         COMMENT ÇA MARCHE
    ══════════════════════════════════════════ -->
    <section class="section-dark" id="comment">
      <div class="container">
        <div class="section-header"
          v-motion :initial="{ opacity:0, y:24 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500 } }">
          <div class="tag-chip"><Lightbulb :size="12" /> Démarrage facile</div>
          <h2 class="title-white">Lancez votre suivi médical en <span class="gradient-text">trois étapes</span></h2>
          <p class="text-muted">Créez un compte, trouvez votre médecin, et commencez votre consultation — en quelques minutes</p>
        </div>

        <div class="etapes-grid">
          <div v-for="(e,i) in etapes" :key="e.titre" class="etape-card glass-card"
            v-motion :initial="{ opacity:0, y:32 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500, delay:i*130 } }">
            <div class="etape-badge">{{ i+1 }}</div>
            <div class="etape-icon" :style="{ boxShadow: `0 0 28px ${e.couleur}30` }">
              <component :is="e.icone" :size="28" :style="{ color: e.couleur }" />
            </div>
            <h3 class="etape-titre">{{ e.titre }}</h3>
            <p class="etape-desc">{{ e.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         SERVICES
    ══════════════════════════════════════════ -->
    <section class="section-deep" id="services">
      <div class="container">
        <div class="section-header"
          v-motion :initial="{ opacity:0, y:24 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500 } }">
          <div class="tag-chip"><Layers :size="12" /> Modules médicaux</div>
          <h2 class="title-white">Une suite complète pour les <span class="gradient-text">professionnels de santé</span></h2>
          <p class="text-muted">Outils conçus pour les médecins, pharmaciens et établissements sénégalais. Intégrés, intuitifs, et conformes aux standards médicaux internationaux.</p>
        </div>

        <div class="services-grid">
          <div v-for="(svc,i) in services" :key="svc.titre" class="svc-card glass-card"
            v-motion :initial="{ opacity:0, y:32 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500, delay:i*80 } }">
            <div class="svc-icon" :style="{ boxShadow: `0 0 20px ${svc.couleur}25` }">
              <component :is="svc.icone" :size="22" :style="{ color: svc.couleur }" />
            </div>
            <h3 class="svc-titre">{{ svc.titre }}</h3>
            <p class="svc-desc">{{ svc.desc }}</p>
            <div class="svc-tags">
              <span v-for="t in svc.tags" :key="t" class="tag-pill">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         MÉDECINS
    ══════════════════════════════════════════ -->
    <section class="section-dark" id="medecins">
      <div class="container">
        <div class="section-header"
          v-motion :initial="{ opacity:0, y:24 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500 } }">
          <div class="tag-chip"><Stethoscope :size="12" /> Nos professionnels</div>
          <h2 class="title-white">Des médecins <span class="gradient-text">qualifiés et vérifiés</span></h2>
          <p class="text-muted">Accédez à un réseau de médecins spécialistes. Consultations en ligne ou en clinique — à votre convenance</p>
        </div>

        <div class="medecins-grid">
          <div v-for="(med,i) in medecins" :key="med.nom" class="med-card glass-card"
            v-motion :initial="{ opacity:0, scale:0.93 }" :visibleOnce="{ opacity:1, scale:1, transition:{ duration:450, delay:i*120 } }">
            <div class="med-avatar" :style="{ boxShadow: `0 0 32px ${med.couleur}35` }">
              <UserCircle :size="52" :style="{ color: med.couleur }" />
            </div>
            <div class="med-nom">{{ med.nom }}</div>
            <div class="med-spec" :style="{ color: med.couleur }">{{ med.spec }}</div>
            <div class="med-tarif"><Banknote :size="13" style="color:rgba(255,255,255,0.35)" />{{ med.tarif.toLocaleString('fr-SN') }} FCFA / consult.</div>
            <div class="med-dispo"><div class="hc-dot"></div>Disponible aujourd'hui</div>
            <RouterLink to="/connexion" class="btn-glass-sm">Prendre RDV</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         PAIEMENTS MOBILES
    ══════════════════════════════════════════ -->
    <section class="section-deep" id="paiements">
      <div class="container">
        <div class="paiements-inner"
          v-motion :initial="{ opacity:0, y:30 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:600 } }">
          <div class="paiements-text">
            <div class="tag-chip"><CreditCard :size="12" /> Paiement &amp; assurances</div>
            <h2 class="title-white" style="text-align:left;margin-bottom:.75rem">
              Paiement <span class="gradient-text">transparent et flexible</span>
            </h2>
            <p class="text-muted" style="text-align:left">
              Payez comme vous préférez : mobile money, espèces ou assurance. Prise en charge automatique CNSS, CMU et IPM. Tarif affiché = tarif payé. Aucun frais caché.
            </p>

            <div class="operateurs">
              <div v-for="op in operateurs" :key="op.nom" class="op-pill glass-card">
                <div class="op-icon-wrap"><img :src="op.logo" :alt="op.nom" class="op-logo" /></div>
                <div>
                  <div class="op-nom">{{ op.nom }}</div>
                  <div class="op-type">{{ op.type }}</div>
                </div>
                <div class="op-status">Disponible</div>
              </div>
            </div>

            <div class="feat-list">
              <div v-for="f in featsPaiement" :key="f" class="feat-item">
                <CheckCircle :size="15" style="color:#0EA5E9;flex-shrink:0" />
                <span>{{ f }}</span>
              </div>
            </div>
          </div>

          <div class="paiements-img-wrap"
            v-motion :initial="{ opacity:0, x:60, scale:0.92 }" :visibleOnce="{ opacity:1, x:0, scale:1, transition:{ duration:700 } }">
            <div class="img-glow"></div>
            <img :src="imgPediatrie" alt="Pédiatrie Tropical Medical" class="paiements-img float-anim" />
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         TÉMOIGNAGES
    ══════════════════════════════════════════ -->
    <section class="section-dark" id="temoignages">
      <div class="container">
        <div class="section-header"
          v-motion :initial="{ opacity:0, y:24 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500 } }">
          <div class="tag-chip"><Star :size="12" /> Témoignages patients</div>
          <h2 class="title-white">Ceux qui nous <span class="gradient-text">font confiance</span></h2>
          <p class="text-muted">Découvrez comment la plateforme améliore le suivi médical des familles sénégalaises</p>
        </div>

        <div class="temoignages-grid">
          <div v-for="(t,i) in temoignages" :key="t.nom" class="tem-card glass-card"
            v-motion :initial="{ opacity:0, y:28 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:500, delay:i*100 } }">
            <div class="tem-stars">
              <Star v-for="j in 5" :key="j" :size="14" style="color:#F59E0B;fill:#F59E0B" />
            </div>
            <p class="tem-texte">« {{ t.texte }} »</p>
            <div class="tem-auteur">
              <div class="tem-avatar" :style="{ background: t.bg, color: t.couleur }">{{ t.initiales }}</div>
              <div>
                <div class="tem-nom">{{ t.nom }}</div>
                <div class="tem-ville">{{ t.ville }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════
         CTA FINAL
    ══════════════════════════════════════════ -->
    <section class="section-cta">
      <div class="cta-orb"></div>
      <div class="container" style="position:relative;z-index:1">
        <div class="cta-card glass-card"
          v-motion :initial="{ opacity:0, y:30 }" :visibleOnce="{ opacity:1, y:0, transition:{ duration:600 } }">
          <div class="cta-icon"><HeartPulse :size="40" style="color:#22C55E" /></div>
          <h2 class="title-white" style="text-align:center;font-size:clamp(1.5rem,3vw,2.25rem)">
            Prenez contrôle de votre santé <span class="gradient-text">dès aujourd'hui</span>
          </h2>
          <p class="text-muted" style="text-align:center;max-width:440px">
            Rejoignez des milliers de patients et professionnels sénégalais qui font confiance à Tropical Medical pour leur suivi médical en ligne et en présentiel.
          </p>
          <RouterLink to="/connexion" class="btn-gradient">
            <LogIn :size="20" /> Créer mon compte gratuit
          </RouterLink>
          <div class="cta-logos">
            <div v-for="op in operateurs" :key="op.nom" class="cta-pill glass-card">
              <div class="op-icon-sm"><img :src="op.logo" :alt="op.nom" class="op-logo" /></div>
              <span>{{ op.nom }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import {
  HeartPulse, LogIn, ChevronDown, ChevronLeft, Activity, User,
  CheckCircle, Layers, Stethoscope, UserCircle,
  Banknote, CreditCard,
  ClipboardList, FlaskConical, BedDouble, Video,
  AlertTriangle, BarChart3, Lightbulb, Star,
  UserPlus, CalendarCheck, Zap, Monitor, Play,
  Heart, Dna,
} from 'lucide-vue-next'

import logoOrange    from '../../../image medicale/orangeMONEY.jpeg'
import logoWave     from '../../../image medicale/wave.jpeg'
import logoMixx     from '../../../image medicale/Mixx by Yas .jpeg'
import imgPediatrie from '../../../image medicale/Pediatrican.jpeg'

function scrollTo(hash) {
  const el = document.querySelector(hash)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const stats = [
  { valeur:'5 000+',  label:'Patients actifs',       icone:User,        couleur:'#22C55E' },
  { valeur:'12+',     label:'Médecins qualifiés',     icone:Stethoscope, couleur:'#10B981' },
  { valeur:'98%',     label:'Satisfaction patients',  icone:CheckCircle, couleur:'#22C55E' },
  { valeur:'24h/24',  label:'Support disponible',     icone:Activity,    couleur:'#4ADE80' },
]

const etapes = [
  {
    icone: UserPlus, titre: 'Créez votre compte patient', couleur:'#22C55E',
    desc: 'Inscription sécurisée en moins de 2 minutes. Votre dossier médical est créé instantanément et protégé par chiffrement de niveau médical.',
  },
  {
    icone: CalendarCheck, titre: 'Sélectionnez un professionnel de santé', couleur:'#10B981',
    desc: 'Consultez les profils, spécialités et disponibilités. Consultations en ligne ou en présentiel — choisissez ce qui vous convient.',
  },
  {
    icone: Zap, titre: 'Commencez votre suivi médical', couleur:'#4ADE80',
    desc: 'Consultations, prescriptions numériques, suivi, paiement sécurisé. Votre dossier se remplit automatiquement pour un historique complet.',
  },
]

const services = [
  { icone:ClipboardList, titre:'Gestion des consultations',    couleur:'#22C55E', desc:'Dossiers patients numériques, ordonnances électroniques, historique complet et suivi du traitement.', tags:['Dossiers patients','Prescriptions'] },
  { icone:Video,         titre:'Téléconsultations sécurisées', couleur:'#10B981', desc:'Consultations vidéo en temps réel via protocole crypté. Aucune installation requise. Dossier automatique.', tags:['Vidéo HD','Chiffré'] },
  { icone:FlaskConical,  titre:'Gestion pharmacie',            couleur:'#4ADE80', desc:'Suivi du stock en temps réel, alertes d\'expiration, gestion des lots et délivrance d\'ordonnances.', tags:['Stocks','Traçabilité'] },
  { icone:BedDouble,     titre:'Hospitalisation et lits',      couleur:'#059669', desc:'Plan d\'occupation actualisé en continu. Admissions, sorties, gestion des chambres et suivi du séjour.', tags:['Flux patient','Temps réel'] },
  { icone:AlertTriangle, titre:'Service des urgences',         couleur:'#F87171', desc:'Triage médical par niveau de gravité. Notification instantanée des urgences critiques à l\'équipe.', tags:['Triage','Alertes'] },
  { icone:BarChart3,     titre:'Tableau de bord Admin',        couleur:'#FBBF24', desc:'Statistiques de santé, rapports d\'activité, gestion des utilisateurs et contrôle d\'accès granulaire.', tags:['Analytics','Rapports'] },
]

const medecins = [
  { nom:'Dr. Ibrahima Ba',  spec:'Médecine Générale', tarif:5000,  couleur:'#22C55E' },
  { nom:'Dr. Fatou Diouf',  spec:'Pédiatrie',          tarif:7500,  couleur:'#10B981' },
  { nom:'Dr. Cheikh Fall',  spec:'Cardiologie',         tarif:12000, couleur:'#4ADE80' },
]

const operateurs = [
  { nom:'Orange Money', logo: logoOrange, type:'Mobile Money' },
  { nom:'Wave',         logo: logoWave,   type:'Mobile Money' },
  { nom:'Mixx by Yas',  logo: logoMixx,   type:'Mobile Money' },
]

const featsPaiement = [
  'Facture numérique instantanée après transaction',
  'Prise en charge assurance : CNSS, CMU, IPM — automatique',
  'Historique des paiements accessible 24h/24',
  'Garantie : prix affiché = prix payé, aucune surcharge',
]

const apercuFeats = [
  { label: 'Dossier patient centralisé',    couleur: '#22C55E' },
  { label: '5 rôles d\'accès sécurisé',     couleur: '#10B981' },
  { label: 'Interface claire et intuitive',  couleur: '#4ADE80' },
  { label: 'Notifications temps réel',       couleur: '#059669' },
]

const temoignages = [
  {
    nom:'Aminata Diallo', ville:'Dakar', initiales:'AD', couleur:'#22C55E', bg:'rgba(34,197,94,0.15)',
    texte:'J\'ai pris rendez-vous en 2 minutes, consulté mon médecin, et reçu l\'ordonnance électronique sur ma messagerie. Plus de file d\'attente. C\'est une révolution.',
  },
  {
    nom:'Moussa Ndiaye', ville:'Thiès', initiales:'MN', couleur:'#10B981', bg:'rgba(16,185,129,0.15)',
    texte:'La téléconsultation m\'a permis de voir un cardiologue de Dakar sans quitter Thiès. Qualité vidéo excellente, mon médecin avait accès à tous mes antécédents.',
  },
  {
    nom:'Rokhaya Sow', ville:'Saint-Louis', initiales:'RS', couleur:'#0EA5E9', bg:'rgba(14,165,233,0.15)',
    texte:'Mon assurance a été déduite automatiquement. Pas de démarches compliquées. Le système est vraiment pensé pour nous et pour nos besoins au Sénégal.',
  },
]

const videosGrid = [
  {
    titre: 'Physiologie cardiaque — fonctionnement du cœur en 3D',
    categorie: 'Cardiologie',
    url: 'https://www.youtube.com/@vokaio',
    icone: Heart,
    gradient: 'linear-gradient(135deg, #1a0533 0%, #3b0764 100%)',
  },
  {
    titre: 'Mécanisme d\'action des anticorps monoclonaux',
    categorie: 'Immunologie',
    url: 'https://www.youtube.com/@vokaio',
    icone: FlaskConical,
    gradient: 'linear-gradient(135deg, #0c1a4a 0%, #1e3a8a 100%)',
  },
  {
    titre: 'Activité neuronale et transmission synaptique',
    categorie: 'Neurologie',
    url: 'https://www.youtube.com/@vokaio',
    icone: Zap,
    gradient: 'linear-gradient(135deg, #0a2a1a 0%, #14532d 100%)',
  },
]
</script>

<style scoped>
/* ════════════════════════════════════════════
   FONDATIONS — THÈME BLANC
════════════════════════════════════════════ */
.accueil {
  background: #ffffff;
  color: #1E293B;
  padding-top: 68px;
}
.container { max-width:1200px; margin:0 auto; padding:0 1.5rem }
.section-dark  { padding:5.5rem 0; background:#ffffff }
.section-deep  { padding:5.5rem 0; background:#F8FAFC }

/* ── UTILITAIRES ── */
.gradient-text {
  background: linear-gradient(135deg, #4ADE80 0%, #22C55E 30%, #10B981 65%, #059669 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: hueShift 4s linear infinite;
}
.glass-card {
  background: #ffffff;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  border-radius: 1.25rem;
}
.title-white {
  font-family: var(--font-display, system-ui);
  font-size: clamp(1.5rem, 3.5vw, 2.5rem);
  font-weight: 800;
  color: #0F172A;
  line-height: 1.2;
  margin-bottom: .875rem;
}
.text-muted { color: #64748B; font-size:.95rem; line-height:1.8 }
.section-header { text-align:center; max-width:620px; margin:0 auto 3.5rem }

/* Chip étiquette section */
.tag-chip {
  display:inline-flex; align-items:center; gap:.4rem;
  background: rgba(34,197,94,0.08);
  color: #16A34A;
  border: 1px solid rgba(34,197,94,0.22);
  border-radius:9999px;
  padding:.28rem .9rem;
  font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em;
  margin-bottom:1.1rem;
}
.tag-chip-purple {
  display:inline-flex; align-items:center;
  background: rgba(34,197,94,0.1);
  color: #15803D;
  border-radius:9999px;
  padding:.2rem .75rem;
  font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
}
.tag-pill {
  font-size:.67rem; font-weight:600; letter-spacing:.04em;
  background:#F1F5F9;
  color:#64748B;
  border:1px solid #E2E8F0;
  border-radius:9999px; padding:.18rem .65rem;
}

/* ════════════════════════════════════════════
   BOUTONS
════════════════════════════════════════════ */
.btn-gradient {
  display:inline-flex; align-items:center; gap:.625rem;
  background: linear-gradient(135deg, #4ADE80 0%, #22C55E 50%, #10B981 100%);
  background-size: 200% auto;
  color:white; font-weight:700; font-size:.95rem;
  border:none; border-radius:.9rem; padding:.875rem 2rem;
  cursor:pointer; text-decoration:none;
  box-shadow: 0 4px 24px rgba(34,197,94,0.4);
  transition: transform .2s, box-shadow .2s, background-position .4s;
  animation: btnGreenShift 3s linear infinite;
}
.btn-gradient:hover { transform:translateY(-2px); box-shadow:0 8px 36px rgba(34,197,94,0.55) }
@keyframes btnGreenShift {
  0%   { background-position: 0% center }
  100% { background-position: 200% center }
}

.btn-glass {
  display:inline-flex; align-items:center; gap:.625rem;
  background:rgba(255,255,255,0.1);
  color:rgba(255,255,255,0.9); font-weight:600; font-size:.95rem;
  border:1px solid rgba(255,255,255,0.2); border-radius:.9rem; padding:.875rem 1.75rem;
  cursor:pointer; text-decoration:none; backdrop-filter:blur(8px);
  transition: background .2s, border-color .2s;
}
.btn-glass:hover { background:rgba(255,255,255,0.18); border-color:rgba(255,255,255,0.35) }

.btn-glass-sm {
  display:flex; align-items:center; justify-content:center;
  background:#F8FAFC;
  color:#475569; font-weight:600; font-size:.83rem;
  border:1px solid #E2E8F0; border-radius:.75rem; padding:.6rem 1.25rem;
  cursor:pointer; text-decoration:none; width:100%; margin-top:.875rem;
  transition: background .2s, border-color .2s, color .2s;
}
.btn-glass-sm:hover { background:rgba(34,197,94,0.06); border-color:rgba(34,197,94,0.3); color:#16A34A }

/* ════════════════════════════════════════════
   HERO — STYLE VOKA (texte gauche, vidéo droite)
════════════════════════════════════════════ */
.hero {
  position:relative; min-height:90vh;
  display:flex; align-items:stretch; overflow:hidden;
  background:#040d24;
}
.hero-video {
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; z-index:0;
  filter: brightness(0.75) saturate(1.15);
}
/* Dégradé fort vers la gauche comme VOKA — opaque à gauche, transparent à droite */
.hero-overlay {
  position:absolute; inset:0; z-index:1; pointer-events:none;
  background: linear-gradient(
    to right,
    #040d24 0%,
    #040d24 30%,
    rgba(4,13,36,0.92) 45%,
    rgba(4,13,36,0.65) 60%,
    rgba(4,13,36,0.1) 100%
  );
}
.hero-bottom-fade {
  position:absolute; bottom:0; left:0; right:0; height:180px; z-index:2; pointer-events:none;
  background: linear-gradient(to bottom, transparent, #ffffff);
}
.hero-inner {
  position:relative; z-index:3;
  display:flex; align-items:center;
  max-width:1200px; width:100%; margin:0 auto;
  padding:5rem 1.5rem 6rem;
}
.hero-content {
  display:flex; flex-direction:column; align-items:flex-start;
  gap:1.75rem; max-width:580px; width:100%; text-align:left;
}

/* Breadcrumb style VOKA */
.hero-breadcrumb {
  display:inline-flex; align-items:center; gap:.4rem;
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.15);
  color:rgba(255,255,255,0.75);
  border-radius:9999px; padding:.35rem 1rem;
  font-size:.78rem; font-weight:500;
  backdrop-filter:blur(8px);
  cursor:default;
}

.hero-title {
  font-family: var(--font-display, system-ui);
  font-size: clamp(2.6rem, 5vw, 4rem);
  font-weight:900; color:white; line-height:1.1;
  letter-spacing:-.03em;
}
.hero-desc {
  font-size:1rem; color:rgba(255,255,255,0.65); line-height:1.85;
  max-width:480px;
}
.hero-actions { display:flex; gap:.875rem; flex-wrap:wrap; align-items:center }

/* Bouton CTA hero — vert dégradé dynamique */
.btn-hero-cta {
  display:inline-flex; align-items:center; gap:.5rem;
  background: linear-gradient(135deg, #4ADE80 0%, #22C55E 50%, #10B981 100%);
  background-size: 200% auto;
  color:white; font-weight:700; font-size:.95rem;
  border:none; border-radius:9999px; padding:.875rem 2rem;
  cursor:pointer; text-decoration:none;
  box-shadow: 0 4px 20px rgba(34,197,94,0.45);
  transition: transform .2s, box-shadow .2s;
  animation: btnGreenShift 3s linear infinite;
}
.btn-hero-cta:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(34,197,94,0.6) }

.hero-trust { display:flex; gap:1.25rem; flex-wrap:wrap; margin-top:.25rem }
.trust-item { display:flex; align-items:center; gap:.35rem; font-size:.76rem; color:rgba(255,255,255,0.45); font-weight:500 }

/* ════════════════════════════════════════════
   STATS TICKER — DÉFILEMENT AUTOMATIQUE
════════════════════════════════════════════ */
.stats-ticker-wrap {
  overflow:hidden;
  background:#ffffff;
  border-top:1px solid #E2E8F0;
  border-bottom:1px solid #E2E8F0;
  padding:.25rem 0;
  position:relative;
}
/* Fondu sur les bords */
.stats-ticker-wrap::before,
.stats-ticker-wrap::after {
  content:''; position:absolute; top:0; bottom:0; width:120px; z-index:2; pointer-events:none;
}
.stats-ticker-wrap::before { left:0; background:linear-gradient(to right, #fff, transparent) }
.stats-ticker-wrap::after  { right:0; background:linear-gradient(to left, #fff, transparent) }

.stats-ticker {
  display:flex; align-items:center;
  width:max-content;
  animation: ticker-scroll 28s linear infinite;
}
.stats-ticker:hover { animation-play-state:paused }

@keyframes ticker-scroll {
  0%   { transform: translateX(0) }
  100% { transform: translateX(-50%) }
}

.ticker-item {
  display:flex; flex-direction:column; align-items:center;
  padding:1.25rem 3rem;
  border-right:1px solid #E2E8F0;
  gap:.2rem; flex-shrink:0;
}
.ticker-val {
  font-family:var(--font-display,system-ui);
  font-size:1.75rem; font-weight:800; line-height:1;
}
.ticker-lbl {
  font-size:.72rem; color:#94A3B8; font-weight:600;
  text-transform:uppercase; letter-spacing:.07em; white-space:nowrap;
}

/* ════════════════════════════════════════════
   APERÇU
════════════════════════════════════════════ */
.apercu-layout { display:grid; grid-template-columns:1fr 1fr; gap:3.5rem; align-items:center }
.apercu-img-wrap { position:relative; border-radius:1.5rem; overflow:hidden }
.apercu-glow-orb {
  position:absolute; top:15%; left:10%; z-index:0; pointer-events:none;
  width:220px; height:220px;
  background:radial-gradient(circle, rgba(34,197,94,0.2), transparent 70%);
}
.apercu-img { width:100%; height:auto; aspect-ratio:3/4; object-fit:cover; display:block; position:relative; z-index:1 }
.apercu-infos { padding:2.5rem; display:flex; flex-direction:column; gap:1.5rem }
.ai-icon-box { width:48px; height:48px; background:rgba(34,197,94,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center }
.ai-features { display:flex; flex-direction:column; gap:.625rem }
.ai-feat { display:flex; align-items:center; gap:.5rem; font-size:.875rem; color:#475569 }
.af-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0 }
.ai-stats-row {
  display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:1rem;
  padding:1.25rem; background:rgba(34,197,94,0.05);
  border:1px solid rgba(34,197,94,0.18); border-radius:1rem;
}
.ai-stat { text-align:center }
.ai-stat-num { font-family:var(--font-display,system-ui); font-size:1.5rem; font-weight:800 }
.ai-stat-lbl { font-size:.7rem; color:#94A3B8; font-weight:600; text-transform:uppercase; letter-spacing:.05em; margin-top:.25rem }
.ai-stat-sep { width:1px; height:44px; background:#E2E8F0 }

/* ════════════════════════════════════════════
   VIDÉOS ANIMATIONS 3D
════════════════════════════════════════════ */
.videos-layout { display:grid; grid-template-columns:1.1fr 1fr; gap:1.5rem; align-items:start }
.video-main { overflow:hidden; transition:border-color .2s, box-shadow .2s }
.video-main:hover { border-color:rgba(34,197,94,0.3); box-shadow:0 8px 32px rgba(34,197,94,0.1) }
.video-embed-wrap { position:relative; padding-bottom:56.25% }
.video-embed-wrap iframe {
  position:absolute; inset:0; width:100%; height:100%;
  border-radius:1.25rem 1.25rem 0 0;
}
.video-main-footer {
  padding:1.25rem 1.5rem; display:flex; align-items:center; gap:1rem; flex-wrap:wrap;
}
.video-main-footer p { font-size:.82rem; color:#64748B; margin:0; flex:1 }
.videos-side { display:flex; flex-direction:column; gap:1rem }
.video-card { display:flex; gap:1rem; padding:.875rem; align-items:center; transition:border-color .2s, transform .2s, box-shadow .2s }
.video-card:hover { border-color:rgba(34,197,94,0.3); transform:translateX(4px); box-shadow:0 4px 16px rgba(34,197,94,0.1) }
.vcard-thumb {
  width:88px; height:64px; flex-shrink:0; border-radius:.75rem;
  display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden;
}
.vcard-play {
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  background:rgba(0,0,0,0.3); text-decoration:none; border-radius:.75rem; color:white;
  opacity:0; transition:opacity .2s;
}
.video-card:hover .vcard-play { opacity:1 }
.vcard-info { flex:1 }
.vcard-cat { font-size:.63rem; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:#16A34A; margin-bottom:.3rem }
.vcard-titre { font-size:.85rem; font-weight:600; color:#1E293B; line-height:1.45 }

/* ════════════════════════════════════════════
   ÉTAPES
════════════════════════════════════════════ */
.etapes-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem }
.etape-card {
  display:flex; flex-direction:column; align-items:center; text-align:center;
  gap:1rem; padding:2.5rem 1.5rem; position:relative;
  transition:border-color .25s, transform .25s, box-shadow .25s;
}
.etape-card:hover { border-color:rgba(34,197,94,0.25); transform:translateY(-5px); box-shadow:0 12px 32px rgba(34,197,94,0.1) }
.etape-badge {
  width:32px; height:32px; border-radius:50%;
  background:linear-gradient(135deg, #4ADE80, #22C55E, #10B981);
  color:white; font-weight:800; font-size:.85rem;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(34,197,94,0.4);
}
.etape-icon {
  width:72px; height:72px; border-radius:1.25rem;
  background:#F8FAFC;
  border:1px solid #E2E8F0;
  display:flex; align-items:center; justify-content:center;
}
.etape-titre { font-family:var(--font-display,system-ui); font-size:1.05rem; font-weight:700; color:#0F172A }
.etape-desc { font-size:.84rem; color:#64748B; line-height:1.7; max-width:240px }

/* ════════════════════════════════════════════
   SERVICES
════════════════════════════════════════════ */
.services-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.25rem }
.svc-card {
  display:flex; flex-direction:column; gap:.75rem; padding:1.75rem;
  transition:transform .2s, border-color .2s, box-shadow .2s;
}
.svc-card:hover { transform:translateY(-5px); border-color:rgba(34,197,94,0.25); box-shadow:0 12px 32px rgba(34,197,94,0.1) }
.svc-icon {
  width:48px; height:48px; border-radius:14px;
  background:#F1F5F9; border:1px solid #E2E8F0;
  display:flex; align-items:center; justify-content:center;
}
.svc-titre { font-weight:700; font-size:.95rem; color:#0F172A }
.svc-desc { font-size:.82rem; color:#64748B; line-height:1.65; flex:1 }
.svc-tags { display:flex; gap:.375rem; flex-wrap:wrap }

/* ════════════════════════════════════════════
   MÉDECINS
════════════════════════════════════════════ */
.medecins-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem }
.med-card {
  display:flex; flex-direction:column; align-items:center;
  padding:2rem 1.5rem; text-align:center; gap:.375rem;
  transition:transform .2s, box-shadow .2s;
}
.med-card:hover { transform:translateY(-5px); box-shadow:0 12px 32px rgba(0,0,0,0.1) }
.med-avatar {
  width:82px; height:82px; border-radius:50%;
  background:#F1F5F9;
  display:flex; align-items:center; justify-content:center; margin-bottom:.75rem;
}
.med-nom { font-weight:700; font-size:.95rem; color:#0F172A }
.med-spec { font-size:.82rem; font-weight:600; margin-top:.15rem }
.med-tarif { display:flex; align-items:center; gap:.35rem; font-size:.76rem; color:#94A3B8; margin-top:.25rem }
.med-dispo { display:flex; align-items:center; gap:.35rem; font-size:.73rem; font-weight:600; color:#22C55E; margin-top:.375rem }
.hc-dot { width:7px; height:7px; border-radius:50%; background:#22C55E; box-shadow:0 0 8px rgba(34,197,94,0.5) }

/* ════════════════════════════════════════════
   PAIEMENTS
════════════════════════════════════════════ */
.paiements-inner { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center }
.operateurs { display:flex; flex-direction:column; gap:.75rem; margin:1.5rem 0 }
.op-pill { display:flex; align-items:center; gap:.875rem; padding:.75rem 1rem }
.op-icon-wrap { width:42px; height:42px; border-radius:10px; overflow:hidden; flex-shrink:0; border:1px solid #E2E8F0 }
.op-logo { width:100%; height:100%; object-fit:cover; display:block }
.op-nom { font-weight:700; font-size:.875rem; color:#1E293B }
.op-type { font-size:.7rem; color:#94A3B8 }
.op-status {
  margin-left:auto; font-size:.67rem; font-weight:700; color:#16A34A;
  background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.22);
  border-radius:9999px; padding:2px 10px;
}
.feat-list { display:flex; flex-direction:column; gap:.625rem }
.feat-item { display:flex; align-items:flex-start; gap:.625rem; font-size:.875rem; color:#475569 }
.paiements-img-wrap {
  position:relative; border-radius:1.5rem; overflow:hidden;
  box-shadow:0 20px 60px rgba(0,0,0,0.18);
  cursor:pointer; transition:transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s;
}
.paiements-img-wrap:hover { transform:scale(1.03) translateY(-6px); box-shadow:0 32px 80px rgba(34,197,94,0.2) }
.img-glow {
  position:absolute; inset:-20px; z-index:0; pointer-events:none; border-radius:2rem;
  background:radial-gradient(ellipse, rgba(34,197,94,0.1), transparent 68%);
}
.paiements-img { width:100%; max-width:480px; height:420px; object-fit:cover; display:block; position:relative; z-index:1; transition:filter .4s }
.paiements-img-wrap:hover .paiements-img { filter:brightness(1.05) saturate(1.1) }
.float-anim { animation:imgFloat 5s ease-in-out infinite }
@keyframes imgFloat { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
.op-icon-sm { width:24px; height:24px; border-radius:6px; overflow:hidden; flex-shrink:0 }

/* ════════════════════════════════════════════
   TÉMOIGNAGES
════════════════════════════════════════════ */
.temoignages-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem }
.tem-card { display:flex; flex-direction:column; gap:.875rem; padding:1.75rem; transition:transform .2s, box-shadow .2s }
.tem-card:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,0.08) }
.tem-stars { display:flex; gap:2px }
.tem-texte { font-size:.875rem; color:#475569; line-height:1.8; font-style:italic; flex:1 }
.tem-auteur { display:flex; align-items:center; gap:.75rem }
.tem-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.8rem; flex-shrink:0 }
.tem-nom { font-weight:700; font-size:.85rem; color:#1E293B }
.tem-ville { font-size:.72rem; color:#94A3B8 }

/* ════════════════════════════════════════════
   CTA FINAL
════════════════════════════════════════════ */
.section-cta { padding:6rem 0; background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); position:relative; overflow:hidden }
.cta-orb {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  width:700px; height:500px; pointer-events:none;
  background:radial-gradient(ellipse, rgba(34,197,94,0.1), transparent 65%);
}
.cta-card {
  max-width:700px; margin:0 auto; padding:4rem 2.5rem;
  border-radius:2rem; text-align:center;
  display:flex; flex-direction:column; align-items:center; gap:1.25rem;
  background:#ffffff;
  border:1px solid rgba(34,197,94,0.15);
  box-shadow:0 8px 40px rgba(34,197,94,0.12);
}
.cta-icon {
  width:76px; height:76px; background:rgba(34,197,94,0.1);
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  box-shadow:0 0 40px rgba(34,197,94,0.2);
}
.cta-logos { display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap }
.cta-pill { display:flex; align-items:center; gap:.5rem; padding:.3rem .875rem; font-size:.73rem; font-weight:600; color:#64748B; border:1px solid #E2E8F0; border-radius:9999px }

/* ════════════════════════════════════════════
   ANIMATIONS DES CARTES
════════════════════════════════════════════ */

/* ── Shimmer sweep (effet lumière qui passe) ── */
.svc-card,
.etape-card,
.med-card,
.tem-card,
.video-card,
.video-main,
.apercu-infos {
  position:relative; overflow:hidden;
}
.svc-card::before,
.etape-card::before,
.med-card::before,
.tem-card::before,
.video-card::before,
.video-main::before {
  content:'';
  position:absolute; inset:0; z-index:0;
  background:linear-gradient(
    120deg,
    transparent 30%,
    rgba(34,197,94,0.07) 50%,
    transparent 70%
  );
  transform:translateX(-120%);
  transition:transform .7s ease;
  pointer-events:none;
  border-radius:inherit;
}
.svc-card:hover::before,
.etape-card:hover::before,
.med-card:hover::before,
.tem-card:hover::before,
.video-card:hover::before,
.video-main:hover::before {
  transform:translateX(120%);
}

/* S'assurer que le contenu reste au-dessus du shimmer */
.svc-card > *,
.etape-card > *,
.med-card > *,
.tem-card > *,
.video-card > *,
.video-main > * {
  position:relative; z-index:1;
}

/* ── Icône rebond au hover (services) ── */
.svc-card:hover .svc-icon {
  animation: iconPop .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes iconPop {
  0%   { transform:scale(1) }
  50%  { transform:scale(1.25) rotate(-5deg) }
  100% { transform:scale(1) rotate(0deg) }
}

/* ── Icône rebond (étapes) ── */
.etape-card:hover .etape-icon {
  animation: iconPop .4s cubic-bezier(.34,1.56,.64,1);
}

/* ── Badge étape : pulse lumineux permanent ── */
.etape-badge {
  animation: badgePulse 2.5s ease-in-out infinite;
}
@keyframes badgePulse {
  0%,100% { box-shadow:0 4px 16px rgba(34,197,94,0.4) }
  50%      { box-shadow:0 4px 28px rgba(34,197,94,0.7), 0 0 0 6px rgba(34,197,94,0.12) }
}

/* ── Avatar médecin : rotation lente au hover ── */
.med-card:hover .med-avatar {
  animation: avatarSpin .6s cubic-bezier(.34,1.56,.64,1);
}
@keyframes avatarSpin {
  0%   { transform:scale(1) rotate(0deg) }
  40%  { transform:scale(1.12) rotate(8deg) }
  100% { transform:scale(1) rotate(0deg) }
}

/* ── Point vert médecin : pulse vivant ── */
.hc-dot {
  animation: dotPulse 1.8s ease-in-out infinite;
}
@keyframes dotPulse {
  0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,0.5), 0 0 8px rgba(34,197,94,0.4) }
  50%      { box-shadow:0 0 0 5px rgba(34,197,94,0), 0 0 12px rgba(34,197,94,0.6) }
}

/* ── Témoignage : bordure gauche animée ── */
.tem-card::after {
  content:'';
  position:absolute; left:0; top:10%; bottom:10%;
  width:3px; border-radius:9999px;
  background:linear-gradient(to bottom, #4ADE80, #10B981, #059669);
  transform:scaleY(0); transform-origin:top;
  transition:transform .35s ease;
}
.tem-card:hover::after { transform:scaleY(1) }

/* ── Étoiles témoignage : bounce au hover ── */
.tem-card:hover .tem-stars svg {
  animation: starBounce .5s cubic-bezier(.34,1.56,.64,1) both;
}
.tem-card:hover .tem-stars svg:nth-child(2) { animation-delay:.05s }
.tem-card:hover .tem-stars svg:nth-child(3) { animation-delay:.1s }
.tem-card:hover .tem-stars svg:nth-child(4) { animation-delay:.15s }
.tem-card:hover .tem-stars svg:nth-child(5) { animation-delay:.2s }
@keyframes starBounce {
  0%   { transform:translateY(0) scale(1) }
  50%  { transform:translateY(-6px) scale(1.3) }
  100% { transform:translateY(0) scale(1) }
}

/* ── Carte vidéo : icône play pulse ── */
.vcard-play {
  animation: playPulse 2s ease-in-out infinite;
}
@keyframes playPulse {
  0%,100% { background:rgba(0,0,0,0.3) }
  50%      { background:rgba(34,197,94,0.35) }
}
.video-card:hover .vcard-play { animation:none; background:rgba(34,197,94,0.5) }

/* ── Carte vidéo thématique : icône flottante ── */
.vcard-thumb .lucide {
  animation: iconFloat 3s ease-in-out infinite;
}
@keyframes iconFloat {
  0%,100% { transform:translateY(0) }
  50%      { transform:translateY(-6px) }
}

/* ── Ticker stat : flash de couleur ── */
.ticker-item:hover .ticker-val {
  animation:valFlash .3s ease;
}
@keyframes valFlash {
  0%   { filter:brightness(1) }
  50%  { filter:brightness(1.4) drop-shadow(0 0 8px currentColor) }
  100% { filter:brightness(1) }
}

/* ── CTA icon : battement de cœur ── */
.cta-icon {
  animation: heartbeat 2.2s ease-in-out infinite;
}
@keyframes heartbeat {
  0%,100% { transform:scale(1) }
  14%      { transform:scale(1.12) }
  28%      { transform:scale(1) }
  42%      { transform:scale(1.07) }
  56%      { transform:scale(1) }
}

/* ── Opérateur pill : slide droit au hover ── */
.op-pill {
  transition:transform .25s, box-shadow .25s;
}
.op-pill:hover {
  transform:translateX(6px);
  box-shadow:0 4px 16px rgba(14,165,233,0.1);
}

/* ── Bouton CTA hero : shimmer lumineux ── */
.btn-hero-cta {
  position:relative; overflow:hidden;
}
.btn-hero-cta::after {
  content:'';
  position:absolute; top:0; left:-75%;
  width:50%; height:100%;
  background:linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent);
  transform:skewX(-20deg);
  animation:btnShimmer 2.5s ease-in-out infinite;
}
@keyframes btnShimmer {
  0%   { left:-75% }
  60%,100% { left:125% }
}

/* ── Gradient text : animation défilement vert dynamique ── */
@keyframes hueShift {
  0%   { background-position:0% center }
  100% { background-position:200% center }
}

/* ════════════════════════════════════════════
   RESPONSIVE
════════════════════════════════════════════ */
@media (max-width:1024px) {
  .apercu-layout,.paiements-inner { grid-template-columns:1fr }
  .videos-layout { grid-template-columns:1fr }
  .services-grid { grid-template-columns:repeat(2,1fr) }
  .stats-grid { grid-template-columns:repeat(2,1fr) }
  .etapes-grid { grid-template-columns:1fr; gap:1.25rem }
  .temoignages-grid,.medecins-grid { grid-template-columns:1fr }
  .videos-side { flex-direction:row; flex-wrap:wrap }
  .video-card { flex:1; min-width:200px }
}
@media (max-width:768px) {
  .hero { min-height:82vh }
  .hero-title { font-size:2.1rem }
  .hero-desc { font-size:.9rem }
  .hero-actions { flex-direction:column; align-items:stretch; width:100% }
  .paiements-img { max-width:100%; height:280px }
  .cta-card { padding:2.5rem 1.5rem }
}
@media (max-width:640px) {
  .services-grid,.stats-grid { grid-template-columns:1fr }
}
</style>
