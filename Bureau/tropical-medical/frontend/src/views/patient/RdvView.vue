<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Mes rendez-vous</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ rdvsFiltres.length }} rendez-vous</p>
      </div>
      <button class="btn btn-primary" @click="ouvrirModal">
        <Plus :size="17" /> Prendre un RDV
      </button>
    </div>

    <div class="filtres-tabs">
      <button v-for="f in filtresDef" :key="f.val"
        class="filtre-btn" :class="[{ active: filtre===f.val }, f.cls]"
        @click="filtre=f.val">
        <component v-if="f.icone" :is="f.icone" :size="14" />
        <span class="fb-label">{{ f.label }}</span>
        <span v-if="f.count>0" class="filtre-badge">{{ f.count }}</span>
      </button>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.75rem">
      <div class="skeleton-block" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else-if="rdvsFiltres.length" class="rdv-list">
      <div v-for="rdv in rdvsFiltres" :key="rdv.id" class="rdv-card card">
        <div class="rdv-date-badge" :class="{ 'rdv-passe': estPasse(rdv.date) }">
          <span class="rdv-date-j">{{ new Date(rdv.date).getDate() }}</span>
          <span class="rdv-date-m">{{ new Date(rdv.date).toLocaleDateString('fr-SN',{month:'short'}) }}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;margin-bottom:.375rem;flex-wrap:wrap">
            <div>
              <div style="font-weight:700;font-size:.95rem;color:var(--color-text)">Dr. {{ rdv.medecin.utilisateur.prenom }} {{ rdv.medecin.utilisateur.nom }}</div>
              <div style="font-size:.78rem;color:var(--color-text-muted)">{{ rdv.medecin.specialite }}</div>
            </div>
            <div style="display:flex;gap:.375rem;flex-wrap:wrap">
              <span class="badge" :class="rdv.type==='TELECONSULTATION'?'badge-info':'badge-primary'">
                <Video v-if="rdv.type==='TELECONSULTATION'" :size="11" /><MapPin v-else :size="11" />
                {{ rdv.type==='TELECONSULTATION'?'Téléconsultation':'Présentiel' }}
              </span>
              <span class="badge" :class="statutClass(rdv.statut)">{{ lblStatut(rdv.statut) }}</span>
            </div>
          </div>
          <div style="font-size:.78rem;color:var(--color-text-muted);display:flex;align-items:center;gap:.5rem">
            <Clock :size="13" /> {{ fmtHeure(rdv.date) }}<span v-if="rdv.motif"> · {{ rdv.motif }}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.375rem;flex-shrink:0">
          <button v-if="rdv.type==='TELECONSULTATION'&&rdv.teleconsultation&&!estPasse(rdv.date)&&rdv.statut!=='ANNULE'"
            class="btn btn-primary btn-sm" @click="rejoindreTC(rdv.teleconsultation.urlVisio)">
            <Video :size="14" /> Rejoindre
          </button>
          <button v-if="!['ANNULE','TERMINE'].includes(rdv.statut)&&!estPasse(rdv.date)"
            class="btn btn-ghost btn-sm" style="color:var(--color-danger)" @click="annuler(rdv.id)">
            <X :size="14" /> Annuler
          </button>
        </div>
      </div>
    </div>

    <div v-else class="vide-center">
      <CalendarOff :size="48" style="opacity:.3;margin-bottom:.75rem" />
      <p>Aucun rendez-vous dans cette catégorie</p>
      <button class="btn btn-primary" style="margin-top:.75rem" @click="ouvrirModal">
        <Plus :size="15" /> Prendre un RDV
      </button>
    </div>

    <!-- ═══════════════════════ WIZARD MODAL ═══════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="fermerModal">
          <div class="wizard-box">

            <!-- ── Écran de succès ── -->
            <Transition name="success-pop">
              <div v-if="succes" class="success-overlay">
                <div class="success-sparks">
                  <Sparkles v-for="n in 8" :key="n" :size="15" :class="`spark spark-${n}`" />
                </div>
                <svg class="success-svg" viewBox="0 0 70 70">
                  <circle class="sc-ring" cx="35" cy="35" r="33" />
                  <path  class="sc-check" d="M20 36l10 10 20-22" />
                </svg>
                <p class="suc-titre">Rendez-vous confirmé !</p>
                <p class="suc-sub">Votre demande est enregistrée.</p>
                <p class="suc-sub">La réception vous contactera sous peu.</p>
              </div>
            </Transition>

            <!-- ── En-tête ── -->
            <div class="wizard-header">
              <div class="wh-left">
                <div class="wh-ic" :style="serviceActif ? { background: hexRgba(serviceActif.color,.12), color: serviceActif.color } : {}">
                  <component :is="serviceActif?.icone || Calendar" :size="18" />
                </div>
                <div>
                  <h2 class="wizard-titre">{{ serviceActif?.nom || 'Prendre un rendez-vous' }}</h2>
                  <p class="wizard-sous">{{ stepDesc }}</p>
                </div>
              </div>
              <button class="modal-close" @click="fermerModal"><X :size="20" /></button>
            </div>

            <!-- ── Stepper ── -->
            <div class="stepper">
              <template v-for="(s, i) in stepsDef" :key="i">
                <div class="step-item" :class="{ done: etape > i+1, active: etape === i+1 }">
                  <div class="step-circle">
                    <svg v-if="etape > i+1" class="check-svg" viewBox="0 0 14 14">
                      <path class="check-path" d="M2.5 7l3.5 3.5 5.5-6" />
                    </svg>
                    <span v-else>{{ i+1 }}</span>
                  </div>
                  <span class="step-lbl">{{ s.label }}</span>
                </div>
                <div v-if="i < stepsDef.length-1" class="step-conn" :class="{ done: etape > i+1 }">
                  <div class="step-conn-fill"></div>
                </div>
              </template>
            </div>

            <!-- ── Barre de progression ── -->
            <div class="progress-wrap">
              <div class="progress-fill" :style="{ width: (etape / stepsDef.length * 100) + '%' }">
                <div class="progress-shimmer"></div>
              </div>
            </div>

            <!-- ── Contenu ── -->
            <div class="wizard-content">
              <Transition :name="transNom" mode="out-in">

                <!-- SERVICE -->
                <div v-if="ecranActuel === 'service'" key="ec-svc" class="step-wrap">
                  <p class="step-heading">Que souhaitez-vous faire ?</p>
                  <div class="services-grid">
                    <button v-for="(svc, i) in SERVICES" :key="svc.id"
                      class="service-card" :style="{ '--sc': svc.color, '--i': i }"
                      @click="choisirService(svc)">
                      <div class="svc-ic" :style="{ background: hexRgba(svc.color,.1), color: svc.color }">
                        <component :is="svc.icone" :size="24" />
                      </div>
                      <div class="svc-body">
                        <div class="svc-nom">{{ svc.nom }}</div>
                        <div class="svc-sous">{{ svc.sous }}</div>
                      </div>
                      <div class="svc-arrow" :style="{ color: svc.color }"><ChevronRight :size="16" /></div>
                    </button>
                  </div>
                </div>

                <!-- SPÉCIALITÉ -->
                <div v-else-if="ecranActuel === 'specialite'" key="ec-sp" class="step-wrap">
                  <div class="snav">
                    <button class="btn-back" @click="etapePrev"><ChevronLeft :size="14" /> Retour</button>
                    <span class="snav-ctx">{{ serviceActif?.nom }}</span>
                  </div>
                  <p class="step-heading">Quelle spécialité ?</p>
                  <div class="specialties-grid">
                    <button v-for="(sp, i) in specialites" :key="sp.nom"
                      class="specialty-card" :style="{ '--sp-c': sp.color, '--i': i }"
                      @click="choisirSpecialite(sp.nom)">
                      <div class="sp-ic" :style="{ background: hexRgba(sp.color,.12), color: sp.color }">
                        <component :is="sp.icone" :size="22" />
                      </div>
                      <span class="sp-nom">{{ sp.nom }}</span>
                      <span class="sp-ct">{{ sp.count }} médecin{{ sp.count>1?'s':'' }}</span>
                    </button>
                  </div>
                </div>

                <!-- MÉDECIN -->
                <div v-else-if="ecranActuel === 'medecin'" key="ec-med" class="step-wrap">
                  <div class="snav">
                    <button class="btn-back" @click="etapePrev"><ChevronLeft :size="14" /> Retour</button>
                    <span class="snav-ctx">{{ specialiteChoisie }}</span>
                  </div>
                  <p class="step-heading">Choisissez votre médecin</p>
                  <div class="doctors-grid">
                    <button v-for="(m, i) in medecinsFiltres" :key="m.id"
                      class="doctor-card" :class="{ selected: form.medecinId === m.id }"
                      :style="{ '--i': i }"
                      @click="choisirMedecin(m)">
                      <div class="doc-av">{{ initiales(m) }}</div>
                      <div class="doc-body">
                        <div class="doc-nom">Dr. {{ m.utilisateur.prenom }} {{ m.utilisateur.nom }}</div>
                        <div class="doc-sp">{{ m.specialite }}</div>
                        <div class="doc-tarif">{{ m.consultationTarif.toLocaleString('fr-SN') }} FCFA / consultation</div>
                      </div>
                      <Transition name="pop">
                        <div v-if="form.medecinId === m.id" class="doc-ok"><Check :size="13" /></div>
                      </Transition>
                    </button>
                  </div>
                </div>

                <!-- CATÉGORIES (analyses / imagerie / vaccination) -->
                <div v-else-if="ecranActuel === 'categories'" key="ec-cat" class="step-wrap">
                  <div class="snav">
                    <button class="btn-back" @click="etapePrev"><ChevronLeft :size="14" /> Retour</button>
                    <span class="snav-ctx">{{ serviceActif?.nom }}</span>
                  </div>
                  <p class="step-heading">{{ labelCategorie }}</p>
                  <div class="cats-grid">
                    <button v-for="(c, i) in categoriesActuelles" :key="c.id"
                      class="cat-card" :class="{ selected: categorieChoisie?.id === c.id }"
                      :style="{ '--cc': c.color, '--i': i }"
                      @click="choisirCategorie(c)">
                      <div class="cat-ic" :style="{ background: hexRgba(c.color,.1), color: c.color }">
                        <component :is="c.icone" :size="17" />
                      </div>
                      <span class="cat-nom">{{ c.nom }}</span>
                      <Transition name="pop">
                        <div v-if="categorieChoisie?.id === c.id" class="cat-ok"><Check :size="11" /></div>
                      </Transition>
                    </button>
                  </div>
                  <Transition name="fade-up">
                    <div v-if="categorieChoisie" class="step-actions" style="margin-top:.875rem">
                      <button class="btn btn-primary" @click="etapeNext">
                        Continuer <ChevronRight :size="15" />
                      </button>
                    </div>
                  </Transition>
                </div>

                <!-- CRÉNEAU -->
                <div v-else-if="ecranActuel === 'creneau'" key="ec-cr" class="step-wrap">
                  <div class="snav">
                    <button class="btn-back" @click="etapePrev"><ChevronLeft :size="14" /> Retour</button>
                    <span class="snav-ctx">{{ creneauCtx }}</span>
                  </div>
                  <p class="step-heading">Date et créneau</p>

                  <p class="slot-lbl">Date</p>
                  <div class="days-row">
                    <button v-for="d in prochainsDates" :key="d.iso"
                      class="day-chip" :class="{ selected: jourChoisi === d.iso }"
                      @click="jourChoisi = d.iso; heureChoisie = ''">
                      <span class="dc-wd">{{ d.wd }}</span>
                      <span class="dc-num">{{ d.num }}</span>
                      <span class="dc-mo">{{ d.mo }}</span>
                    </button>
                  </div>

                  <Transition name="fade-up">
                    <div v-if="jourChoisi">
                      <p class="slot-lbl">Horaire</p>
                      <div class="hours-grid">
                        <button v-for="(h, i) in creneaux" :key="h"
                          class="hour-chip" :class="{ selected: heureChoisie === h }"
                          :style="{ '--i': i }"
                          @click="heureChoisie = h">{{ h }}</button>
                      </div>
                    </div>
                  </Transition>

                  <Transition name="fade-up">
                    <div v-if="jourChoisi && heureChoisie && serviceChoisi === 'CONSULTATION'">
                      <p class="slot-lbl">Type</p>
                      <div class="type-row">
                        <button type="button" class="type-btn" :class="{ active: form.type==='PRESENTIEL' }" @click="form.type='PRESENTIEL'">
                          <MapPin :size="14" /> Présentiel
                        </button>
                        <button type="button" class="type-btn" :class="{ active: form.type==='TELECONSULTATION' }" @click="form.type='TELECONSULTATION'">
                          <Video :size="14" /> Téléconsultation
                        </button>
                      </div>
                    </div>
                  </Transition>

                  <Transition name="fade-up">
                    <div v-if="jourChoisi && heureChoisie" class="step-actions" style="margin-top:.75rem">
                      <button class="btn btn-primary" @click="etapeNext">
                        Continuer <ChevronRight :size="15" />
                      </button>
                    </div>
                  </Transition>
                </div>

                <!-- CONFIRMATION -->
                <div v-else-if="ecranActuel === 'confirmation'" key="ec-conf" class="step-wrap">
                  <div class="snav">
                    <button class="btn-back" @click="etapePrev"><ChevronLeft :size="14" /> Retour</button>
                    <span class="snav-ctx">Récapitulatif</span>
                  </div>
                  <p class="step-heading">Confirmez votre rendez-vous</p>

                  <div v-if="erreur" class="alert-erreur">
                    <AlertCircle :size="15" /> {{ erreur }}
                  </div>

                  <div class="summary-card">
                    <div class="summ-row" :style="{ '--ri': 0 }">
                      <div class="summ-ic" :style="{ background: hexRgba(serviceActif?.color||'#0E9F8E',.12), color: serviceActif?.color||'#0E9F8E' }">
                        <component :is="serviceActif?.icone||Stethoscope" :size="14" />
                      </div>
                      <div><div class="summ-k">Service</div><div class="summ-v">{{ serviceActif?.nom }}</div></div>
                    </div>
                    <div v-if="specialiteChoisie" class="summ-row" :style="{ '--ri': 1 }">
                      <div class="summ-ic"><Stethoscope :size="14" /></div>
                      <div><div class="summ-k">Spécialité</div><div class="summ-v">{{ specialiteChoisie }}</div></div>
                    </div>
                    <div v-if="categorieChoisie" class="summ-row" :style="{ '--ri': 1 }">
                      <div class="summ-ic" :style="{ background: hexRgba(categorieChoisie.color,.12), color: categorieChoisie.color }">
                        <component :is="categorieChoisie.icone" :size="14" />
                      </div>
                      <div><div class="summ-k">Type</div><div class="summ-v">{{ categorieChoisie.nom }}</div></div>
                    </div>
                    <div v-if="medecinChoisi && ['CONSULTATION','TELECONSULTATION'].includes(serviceChoisi)" class="summ-row" :style="{ '--ri': 2 }">
                      <div class="summ-ic"><User :size="14" /></div>
                      <div><div class="summ-k">Médecin</div><div class="summ-v">Dr. {{ medecinChoisi.utilisateur.prenom }} {{ medecinChoisi.utilisateur.nom }}</div></div>
                    </div>
                    <div class="summ-row" :style="{ '--ri': 3 }">
                      <div class="summ-ic"><CalendarCheck :size="14" /></div>
                      <div><div class="summ-k">Date &amp; heure</div><div class="summ-v">{{ fmtResume }}</div></div>
                    </div>
                    <div class="summ-row" :style="{ '--ri': 4 }">
                      <div class="summ-ic summ-ic-prix"><Banknote :size="14" /></div>
                      <div><div class="summ-k">Tarif estimé</div><div class="summ-v summ-prix">{{ tarifAffiche }}</div></div>
                    </div>
                  </div>

                  <div class="field" style="margin-top:1rem">
                    <label class="field-label"><MessageSquare :size="13" /> Motif (optionnel)</label>
                    <input v-model="form.motif" type="text" class="input" placeholder="Décrivez brièvement votre motif…" />
                  </div>

                  <div class="step-actions" style="margin-top:.875rem">
                    <button class="btn btn-primary btn-full" :disabled="envoi" @click="soumettre">
                      <Loader2 v-if="envoi" :size="16" class="spin" />
                      <Check v-else :size="16" />
                      {{ envoi ? 'Envoi en cours…' : 'Confirmer le rendez-vous' }}
                    </button>
                  </div>
                </div>

              </Transition>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, Calendar, CalendarOff, CalendarCheck, Clock, Video, MapPin, MessageSquare,
  X, Check, ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles,
  Stethoscope, User, Banknote,
  // Spécialités
  Heart, Activity, Eye, Users, Microscope, Zap, Scan, Scissors, Droplets, Brain,
  // Services
  FlaskConical, TestTube, TestTube2, Syringe, ShieldPlus, Ambulance, Thermometer, Bone,
} from 'lucide-vue-next'
import { useApi }  from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const router = useRouter()
const api    = useApi()
const { fmtHeure, estPasse } = useDate()

function rejoindreTC(urlVisio) {
  const roomId = urlVisio?.split('/').pop()
  if (roomId) router.push(`/salle/${roomId}`)
  else if (urlVisio) window.open(urlVisio, '_blank')
}

// ─── Liste RDV ────────────────────────────────────────────────────────────────
const chargement = ref(true)
const rdvs       = ref([])
const medecins   = ref([])
const filtre     = ref('tous')

const filtresDef = computed(() => [
  { val:'tous',    label:'Tous',    icone:Calendar,      count:0,                                                                                               cls:'fb-green'   },
  { val:'avenir',  label:'À venir', icone:CalendarCheck, count:rdvs.value.filter(r=>!estPasse(r.date)&&!['ANNULE','TERMINE'].includes(r.statut)).length,         cls:'fb-emerald' },
  { val:'passes',  label:'Passés',  icone:Clock,         count:rdvs.value.filter(r=>estPasse(r.date)||r.statut==='TERMINE').length,                              cls:'fb-gray'    },
  { val:'annules', label:'Annulés', icone:CalendarOff,   count:rdvs.value.filter(r=>r.statut==='ANNULE').length,                                                 cls:'fb-red'     },
])
const rdvsFiltres = computed(() => {
  if (filtre.value==='avenir')  return rdvs.value.filter(r=>!estPasse(r.date)&&!['ANNULE','TERMINE'].includes(r.statut))
  if (filtre.value==='passes')  return rdvs.value.filter(r=>estPasse(r.date)||r.statut==='TERMINE')
  if (filtre.value==='annules') return rdvs.value.filter(r=>r.statut==='ANNULE')
  return rdvs.value
})
onMounted(async () => {
  try {
    const [r, m] = await Promise.all([api.get('/patient/rdv'), api.get('/medecins')])
    rdvs.value = r; medecins.value = m
  } finally { chargement.value = false }
})
async function annuler(id) {
  if (!confirm('Annuler ce rendez-vous ?')) return
  await api.put(`/patient/rdv/${id}/annuler`)
  rdvs.value = await api.get('/patient/rdv')
}
function lblStatut(s)   { return {EN_ATTENTE:'En attente',CONFIRME:'Confirmé',ANNULE:'Annulé',TERMINE:'Terminé'}[s]||s }
function statutClass(s) { return {EN_ATTENTE:'badge-warning',CONFIRME:'badge-green',ANNULE:'badge-danger',TERMINE:'badge-gray'}[s]||'badge-gray' }

// ─── Wizard config ────────────────────────────────────────────────────────────
const FLOWS = {
  CONSULTATION:     ['service','specialite','medecin','creneau','confirmation'],
  TELECONSULTATION: ['service','specialite','medecin','creneau','confirmation'],
  ANALYSES:         ['service','categories','creneau','confirmation'],
  IMAGERIE:         ['service','categories','creneau','confirmation'],
  VACCINATION:      ['service','categories','creneau','confirmation'],
  URGENCES:         ['service','creneau','confirmation'],
}
const STEP_META = { service:'Service', specialite:'Spécialité', medecin:'Médecin', categories:'Catégorie', creneau:'Créneau', confirmation:'Confirmation' }
const STEP_DESC = {
  service:      'Sélectionnez un type de service',
  specialite:   'Quelle spécialité recherchez-vous ?',
  medecin:      'Choisissez votre médecin',
  categories:   'Sélectionnez une catégorie',
  creneau:      'Choisissez une date et un horaire',
  confirmation: 'Vérifiez et confirmez votre rendez-vous',
}
const SERVICES = [
  { id:'CONSULTATION',     nom:'Consultation',       sous:'Voir un médecin en cabinet',          icone:Stethoscope, color:'#0E9F8E' },
  { id:'TELECONSULTATION', nom:'Téléconsultation',   sous:'Consultation par vidéo en ligne',     icone:Video,       color:'#3B82F6' },
  { id:'ANALYSES',         nom:'Analyses médicales', sous:'Bilan sanguin, urines, sérologies…',  icone:FlaskConical,color:'#D97706' },
  { id:'IMAGERIE',         nom:'Imagerie médicale',  sous:'Radio, échographie, scanner, IRM',    icone:Scan,        color:'#7C3AED' },
  { id:'VACCINATION',      nom:'Vaccination',        sous:'Vaccins et programmes d\'immunisation',icone:Syringe,    color:'#059669' },
  { id:'URGENCES',         nom:'Urgences',           sous:'Consultation urgente prioritaire',    icone:Ambulance,   color:'#EF4444' },
]
const SP_MAP = {
  'Cardiologie':       {icone:Heart,      color:'#EF4444'},
  'Pédiatrie':         {icone:Users,      color:'#F97316'},
  'Gynécologie':       {icone:Users,      color:'#EC4899'},
  'Dermatologie':      {icone:Microscope, color:'#A855F7'},
  'Neurologie':        {icone:Brain,      color:'#6366F1'},
  'Ophtalmologie':     {icone:Eye,        color:'#3B82F6'},
  'Médecine générale': {icone:Stethoscope,color:'#0E9F8E'},
  'Chirurgie':         {icone:Scissors,   color:'#64748B'},
  'Radiologie':        {icone:Scan,       color:'#0284C7'},
  'Orthopédie':        {icone:Bone,       color:'#92400E'},
}
const CATEGORIES_MAP = {
  ANALYSES: [
    {id:'nfs',      nom:'NFS (Numération Formule Sanguine)', icone:Droplets,     color:'#EF4444'},
    {id:'glycemie', nom:'Glycémie à jeun',                  icone:Activity,     color:'#F97316'},
    {id:'lipides',  nom:'Bilan Lipidique',                  icone:Heart,        color:'#DC2626'},
    {id:'hepat',    nom:'Bilan Hépatique',                  icone:FlaskConical, color:'#15803D'},
    {id:'iono',     nom:'Ionogramme Sanguin',               icone:TestTube,     color:'#6366F1'},
    {id:'urine',    nom:"Analyse d'Urine (ECBU)",           icone:TestTube2,    color:'#D97706'},
    {id:'serol',    nom:'Sérologie Infectieuse',            icone:Microscope,   color:'#A855F7'},
    {id:'coag',     nom:'Bilan de Coagulation',             icone:Droplets,     color:'#B91C1C'},
  ],
  IMAGERIE: [
    {id:'radio',   nom:'Radiographie standard',  icone:Scan,      color:'#64748B'},
    {id:'echo',    nom:'Échographie',            icone:Activity,  color:'#3B82F6'},
    {id:'scanner', nom:'Scanner (TDM)',          icone:Scan,      color:'#6366F1'},
    {id:'irm',     nom:'IRM',                   icone:Scan,      color:'#7C3AED'},
    {id:'mammo',   nom:'Mammographie',           icone:Heart,     color:'#EC4899'},
    {id:'denso',   nom:'Densitométrie Osseuse',  icone:Bone,      color:'#92400E'},
  ],
  VACCINATION: [
    {id:'grippe',  nom:'Grippe Saisonnière',   icone:ShieldPlus,  color:'#3B82F6'},
    {id:'covid',   nom:'COVID-19',             icone:ShieldPlus,  color:'#0E9F8E'},
    {id:'hepat_b', nom:'Hépatite B',           icone:ShieldPlus,  color:'#F97316'},
    {id:'tetanos', nom:'Tétanos / DTP',        icone:Syringe,     color:'#6366F1'},
    {id:'menin',   nom:'Méningite',            icone:Brain,       color:'#EF4444'},
    {id:'fievre',  nom:'Fièvre Jaune',         icone:Thermometer, color:'#D97706'},
    {id:'pneumo',  nom:'Pneumocoque',          icone:ShieldPlus,  color:'#15803D'},
    {id:'palud',   nom:'Antipaludéen',         icone:Syringe,     color:'#059669'},
  ],
}
const SP_FOR_SERVICE = {
  ANALYSES:    ['Biologie clinique','Médecine générale'],
  IMAGERIE:    ['Radiologie'],
  VACCINATION: ['Médecine générale','Pédiatrie'],
  URGENCES:    [],
}

// ─── Wizard state ─────────────────────────────────────────────────────────────
const modalOuvert       = ref(false)
const succes            = ref(false)
const etape             = ref(1)
const direction         = ref('forward')
const serviceChoisi     = ref(null)
const specialiteChoisie = ref('')
const medecinChoisi     = ref(null)
const categorieChoisie  = ref(null)
const jourChoisi        = ref('')
const heureChoisie      = ref('')
const envoi             = ref(false)
const erreur            = ref('')
const form              = ref({ medecinId:null, date:'', type:'PRESENTIEL', motif:'' })

const serviceActif       = computed(() => SERVICES.find(s => s.id === serviceChoisi.value) || null)
const flowActuel         = computed(() => serviceChoisi.value ? FLOWS[serviceChoisi.value] : FLOWS.CONSULTATION)
const ecranActuel        = computed(() => flowActuel.value[etape.value - 1] || 'service')
const stepsDef           = computed(() => flowActuel.value.map((s, i) => ({ num:i+1, label:STEP_META[s]||s })))
const stepDesc           = computed(() => STEP_DESC[ecranActuel.value] || '')
const transNom           = computed(() => direction.value === 'forward' ? 'slide-fwd' : 'slide-bwd')
const specialites        = computed(() => {
  const map = {}
  medecins.value.forEach(m => { map[m.specialite] = (map[m.specialite]||0) + 1 })
  return Object.entries(map).map(([nom, count]) => ({
    nom, count, icone: SP_MAP[nom]?.icone ?? Stethoscope, color: SP_MAP[nom]?.color ?? '#0E9F8E',
  }))
})
const medecinsFiltres    = computed(() => medecins.value.filter(m => m.specialite === specialiteChoisie.value))
const categoriesActuelles= computed(() => CATEGORIES_MAP[serviceChoisi.value] || [])
const labelCategorie     = computed(() => ({
  ANALYSES:   'Quel bilan souhaitez-vous ?',
  IMAGERIE:   'Quel examen d\'imagerie ?',
  VACCINATION:'Quel vaccin souhaitez-vous ?',
}[serviceChoisi.value] || 'Choisissez une catégorie'))
const creneauCtx = computed(() => {
  if (['CONSULTATION','TELECONSULTATION'].includes(serviceChoisi.value) && medecinChoisi.value)
    return `Dr. ${medecinChoisi.value.utilisateur.prenom} ${medecinChoisi.value.utilisateur.nom}`
  return categorieChoisie.value?.nom || serviceActif.value?.nom || ''
})
const prochainsDates = computed(() => {
  const WD  = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
  const MO  = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const today = new Date(); today.setHours(0,0,0,0)
  return Array.from({length:14}, (_,i) => {
    const d = new Date(today); d.setDate(d.getDate()+i)
    return { iso:d.toISOString().slice(0,10), wd:WD[d.getDay()], num:d.getDate(), mo:MO[d.getMonth()] }
  })
})
const creneaux = Array.from({length:20}, (_,i) => {
  const h = 8 + Math.floor(i/2), m = i%2===0?'00':'30'
  return `${h.toString().padStart(2,'0')}:${m}`
})
const fmtResume = computed(() => {
  if (!jourChoisi.value || !heureChoisie.value) return ''
  const d = new Date(`${jourChoisi.value}T${heureChoisie.value}`)
  return d.toLocaleDateString('fr-SN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) + ' à ' + heureChoisie.value
})
const tarifAffiche = computed(() => {
  if (['CONSULTATION','TELECONSULTATION'].includes(serviceChoisi.value) && medecinChoisi.value)
    return medecinChoisi.value.consultationTarif.toLocaleString('fr-SN') + ' FCFA'
  return {ANALYSES:'À partir de 5 000 FCFA',IMAGERIE:'À partir de 15 000 FCFA',VACCINATION:'À partir de 3 000 FCFA',URGENCES:'15 000 FCFA'}[serviceChoisi.value] || 'À confirmer'
})

// ─── Wizard methods ───────────────────────────────────────────────────────────
function hexRgba(hex, alpha) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}
function initiales(m) { return (m.utilisateur.prenom[0]+m.utilisateur.nom[0]).toUpperCase() }

function autoAssignDoctor(serviceId) {
  const preferred = SP_FOR_SERVICE[serviceId] || []
  let doc = preferred.reduce((f, sp) => f || medecins.value.find(m => m.specialite===sp), null)
  if (!doc) doc = medecins.value[0] || null
  if (doc) { medecinChoisi.value = doc; form.value.medecinId = doc.id }
}

function ouvrirModal() {
  etape.value=1; direction.value='forward'; serviceChoisi.value=null
  specialiteChoisie.value=''; medecinChoisi.value=null; categorieChoisie.value=null
  jourChoisi.value=''; heureChoisie.value=''; erreur.value=''; succes.value=false
  form.value={ medecinId:null, date:'', type:'PRESENTIEL', motif:'' }
  modalOuvert.value=true
}
function fermerModal() { modalOuvert.value=false; succes.value=false }

function choisirService(svc) {
  serviceChoisi.value = svc.id
  form.value.type = svc.id==='TELECONSULTATION' ? 'TELECONSULTATION' : 'PRESENTIEL'
  if (!['CONSULTATION','TELECONSULTATION'].includes(svc.id)) autoAssignDoctor(svc.id)
  direction.value='forward'; etape.value=2
}
function choisirSpecialite(nom) {
  specialiteChoisie.value=nom; direction.value='forward'; etape.value++
}
function choisirMedecin(m) {
  medecinChoisi.value=m; form.value.medecinId=m.id; direction.value='forward'; etape.value++
}
function choisirCategorie(c) {
  categorieChoisie.value=c
}
function etapeNext() {
  if (ecranActuel.value==='creneau') form.value.date=`${jourChoisi.value}T${heureChoisie.value}`
  direction.value='forward'; etape.value++
}
function etapePrev() { direction.value='backward'; etape.value-- }

async function soumettre() {
  if (!form.value.medecinId) { erreur.value='Aucun praticien disponible pour ce service.'; return }
  erreur.value=''; envoi.value=true
  try {
    await api.post('/patient/rdv', { ...form.value })
    rdvs.value = await api.get('/patient/rdv')
    succes.value=true
    setTimeout(fermerModal, 3000)
  } catch(e) { erreur.value=e.message }
  finally    { envoi.value=false }
}
</script>

<style scoped>
/* ── Page ──────────────────────────────────────────────────────────────────── */
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
/* .filtres-tabs, .filtre-btn, .fb-* — styles globaux dans style.css */

.rdv-list     { display:flex;flex-direction:column;gap:.875rem }
.rdv-card     { display:flex;align-items:flex-start;gap:1.25rem;padding:1.125rem 1.25rem }
.rdv-date-badge { display:flex;flex-direction:column;align-items:center;background:rgba(14,159,142,.1);border-radius:.625rem;padding:.625rem .875rem;min-width:52px;text-align:center;flex-shrink:0 }
.rdv-date-badge.rdv-passe { background:#F1F5F9 }
.rdv-date-j { font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--color-primary);line-height:1 }
.rdv-date-badge.rdv-passe .rdv-date-j { color:var(--color-text-muted) }
.rdv-date-m { font-size:.72rem;font-weight:600;text-transform:uppercase;color:var(--color-text-muted) }
.vide-center{ display:flex;flex-direction:column;align-items:center;padding:4rem 1rem;color:var(--color-text-muted) }

/* ── Modal base ─────────────────────────────────────────────────────────────── */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-close { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;align-items:center;padding:.25rem;border-radius:.5rem }
.modal-close:hover { background:#F1F5F9;color:var(--color-text) }

/* ── Wizard box ─────────────────────────────────────────────────────────────── */
.wizard-box { background:white;border-radius:1.375rem;width:100%;max-width:560px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;position:relative }

/* ── Success overlay ──────────────────────────────────────────────────────── */
.success-overlay {
  position:absolute;inset:0;z-index:10;border-radius:1.375rem;
  background:linear-gradient(135deg,#f0fdf4,#ecfdf5,#f0f9ff);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;
  padding:2rem;
}
.success-sparks { position:absolute;width:100px;height:100px;top:50%;left:50%;transform:translate(-50%,-120%) }
.spark { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0 }
.spark-1 { color:#FBBF24;animation:sp1 1.5s .4s ease-out both }
.spark-2 { color:#34D399;animation:sp2 1.5s .5s ease-out both }
.spark-3 { color:#60A5FA;animation:sp3 1.5s .6s ease-out both }
.spark-4 { color:#F472B6;animation:sp4 1.5s .45s ease-out both }
.spark-5 { color:#FBBF24;animation:sp5 1.5s .55s ease-out both }
.spark-6 { color:#34D399;animation:sp6 1.5s .35s ease-out both }
.spark-7 { color:#A78BFA;animation:sp7 1.5s .65s ease-out both }
.spark-8 { color:#F87171;animation:sp8 1.5s .5s ease-out both }
@keyframes sp1 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(-90px,-80px) scale(1)} }
@keyframes sp2 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(90px,-70px) scale(1)} }
@keyframes sp3 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(100px,20px) scale(1)} }
@keyframes sp4 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(70px,90px) scale(1)} }
@keyframes sp5 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(-70px,90px) scale(1)} }
@keyframes sp6 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(-100px,20px) scale(1)} }
@keyframes sp7 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(-20px,-110px) scale(1)} }
@keyframes sp8 { 0%{opacity:1;transform:translate(-50%,-50%) scale(.4)} 100%{opacity:0;transform:translate(20px,-110px) scale(1)} }

.success-svg { width:90px;height:90px;animation:suc-scale .6s cubic-bezier(.34,1.56,.64,1) both }
@keyframes suc-scale { from{opacity:0;transform:scale(.4)} to{opacity:1;transform:scale(1)} }
.sc-ring {
  fill:none;stroke:#059669;stroke-width:2;
  stroke-dasharray:207;stroke-dashoffset:207;
  animation:ring-draw .7s .1s ease-out forwards;
}
.sc-check {
  fill:none;stroke:#059669;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;
  stroke-dasharray:60;stroke-dashoffset:60;
  animation:check-draw .4s .65s ease-out forwards;
}
@keyframes ring-draw  { to{stroke-dashoffset:0} }
@keyframes check-draw { to{stroke-dashoffset:0} }

.suc-titre { font-family:var(--font-display);font-size:1.25rem;font-weight:800;color:#059669;animation:suc-text .5s .9s ease-out both }
.suc-sub   { font-size:.82rem;color:#065f46;animation:suc-text .5s 1s ease-out both }
@keyframes suc-text { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

/* ── En-tête ─────────────────────────────────────────────────────────────── */
.wizard-header { display:flex;align-items:center;justify-content:space-between;padding:1.125rem 1.375rem;border-bottom:1px solid #F1F5F9;flex-shrink:0 }
.wh-left { display:flex;align-items:center;gap:.625rem }
.wh-ic {
  width:38px;height:38px;border-radius:.75rem;flex-shrink:0;
  background:rgba(14,159,142,.1);color:var(--color-primary);
  display:flex;align-items:center;justify-content:center;
  transition:all .4s cubic-bezier(.4,0,.2,1);
}
.wizard-titre { font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--color-text);margin:0 }
.wizard-sous  { font-size:.74rem;color:var(--color-text-muted);margin:2px 0 0 }

/* ── Stepper ─────────────────────────────────────────────────────────────── */
.stepper { display:flex;align-items:center;padding:.7rem 1.375rem;background:#FAFAFA;border-bottom:1px solid #F1F5F9;flex-shrink:0 }
.step-item { display:flex;align-items:center;gap:.3rem;flex-shrink:0 }
.step-circle {
  width:24px;height:24px;border-radius:50%;position:relative;
  display:flex;align-items:center;justify-content:center;
  font-size:.68rem;font-weight:700;
  border:2px solid #E2E8F0;color:#94A3B8;background:white;
  transition:all .35s cubic-bezier(.4,0,.2,1);
}
.step-item.active .step-circle {
  border-color:var(--color-primary);background:var(--color-primary);color:white;
}
.step-item.active .step-circle::after {
  content:'';position:absolute;inset:-5px;border-radius:50%;
  border:2px solid var(--color-primary);opacity:.4;
  animation:pulse-ring 1.8s ease-out infinite;
}
@keyframes pulse-ring { 0%{transform:scale(1);opacity:.4} 100%{transform:scale(1.8);opacity:0} }
.step-item.done .step-circle { border-color:#059669;background:#059669;color:white }
.check-svg  { width:11px;height:11px;overflow:visible }
.check-path {
  fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;
  stroke-dasharray:18;stroke-dashoffset:18;
  animation:check-draw .3s ease-out forwards;
}
.step-lbl { font-size:.67rem;font-weight:600;color:#94A3B8;transition:color .3s }
.step-item.active .step-lbl { color:var(--color-primary) }
.step-item.done .step-lbl   { color:#059669 }
.step-conn { flex:1;height:2px;background:#E2E8F0;margin:0 .375rem;min-width:8px;position:relative;overflow:hidden }
.step-conn-fill { position:absolute;inset:0;background:#059669;transform:scaleX(0);transform-origin:left;transition:transform .4s ease }
.step-conn.done .step-conn-fill { transform:scaleX(1) }

/* ── Progress bar ─────────────────────────────────────────────────────────── */
.progress-wrap { height:3px;background:#F1F5F9;flex-shrink:0;overflow:hidden }
.progress-fill {
  height:100%;background:linear-gradient(90deg,var(--color-primary),#34D399,var(--color-primary));
  background-size:200% 100%;border-radius:0 2px 2px 0;position:relative;
  transition:width .45s cubic-bezier(.4,0,.2,1);
  animation:shimmer-bar 2s linear infinite;
}
@keyframes shimmer-bar { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

/* ── Contenu wizard ───────────────────────────────────────────────────────── */
.wizard-content { flex:1;overflow-y:auto;padding:1.25rem 1.375rem;min-height:0 }
.step-wrap      { }
.step-heading   { font-size:.93rem;font-weight:700;color:var(--color-text);margin:0 0 .875rem }
.snav           { display:flex;align-items:center;gap:.875rem;margin-bottom:.625rem }
.btn-back { display:inline-flex;align-items:center;gap:.2rem;background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:.8rem;font-weight:600;padding:0;transition:color .18s }
.btn-back:hover { color:var(--color-text) }
.snav-ctx       { font-size:.78rem;color:var(--color-text-muted) }
.snav-ctx strong{ color:var(--color-text) }

/* ── Services ─────────────────────────────────────────────────────────────── */
.services-grid { display:flex;flex-direction:column;gap:.5rem }
.service-card {
  display:flex;align-items:center;gap:.875rem;padding:.875rem 1rem;
  border-radius:.875rem;border:2px solid #E2E8F0;background:white;
  cursor:pointer;text-align:left;width:100%;position:relative;overflow:hidden;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  animation:card-enter .45s cubic-bezier(.4,0,.2,1) both;
  animation-delay:calc(var(--i, 0) * 70ms);
}
.service-card:hover { border-color:var(--sc);transform:translateX(4px);box-shadow:0 6px 20px rgba(0,0,0,.1) }
.svc-ic {
  width:44px;height:44px;border-radius:.75rem;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  transition:transform .25s cubic-bezier(.34,1.56,.64,1);
}
.service-card:hover .svc-ic { transform:scale(1.12) rotate(-6deg) }
.svc-body { flex:1;min-width:0 }
.svc-nom  { font-size:.88rem;font-weight:700;color:var(--color-text) }
.svc-sous { font-size:.74rem;color:var(--color-text-muted);margin-top:1px }
.svc-arrow { flex-shrink:0;opacity:.5;transition:all .2s }
.service-card:hover .svc-arrow { opacity:1;transform:translateX(3px) }

/* ── Spécialités ────────────────────────────────────────────────────────────── */
.specialties-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(115px,1fr));gap:.625rem }
.specialty-card {
  display:flex;flex-direction:column;align-items:center;gap:.375rem;
  padding:.875rem .625rem;border-radius:.875rem;border:2px solid #E2E8F0;background:white;
  cursor:pointer;text-align:center;position:relative;overflow:hidden;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  animation:card-enter .4s cubic-bezier(.4,0,.2,1) both;
  animation-delay:calc(var(--i, 0) * 55ms);
}
.specialty-card:hover { border-color:var(--sp-c);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1) }
.sp-ic { width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .25s cubic-bezier(.34,1.56,.64,1) }
.specialty-card:hover .sp-ic { transform:scale(1.15) }
.sp-nom { font-size:.78rem;font-weight:700;color:var(--color-text);line-height:1.2 }
.sp-ct  { font-size:.67rem;color:var(--color-text-muted) }

/* ── Médecins ─────────────────────────────────────────────────────────────── */
.doctors-grid { display:flex;flex-direction:column;gap:.5rem }
.doctor-card {
  display:flex;align-items:center;gap:.875rem;padding:.75rem .875rem;
  border-radius:.875rem;border:2px solid #E2E8F0;background:white;
  cursor:pointer;text-align:left;width:100%;position:relative;overflow:hidden;
  transition:all .2s;
  animation:card-enter .4s cubic-bezier(.4,0,.2,1) both;
  animation-delay:calc(var(--i, 0) * 60ms);
}
.doctor-card:hover   { border-color:var(--color-primary);box-shadow:0 4px 16px rgba(0,0,0,.08) }
.doctor-card.selected{ border-color:var(--color-primary);background:rgba(14,159,142,.04) }
.doc-av {
  width:42px;height:42px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--color-primary),#0d7a6e);
  color:white;font-weight:800;font-size:.85rem;display:flex;align-items:center;justify-content:center;
  transition:transform .25s cubic-bezier(.34,1.56,.64,1);
}
.doctor-card:hover .doc-av { transform:scale(1.1) }
.doc-body { flex:1;min-width:0 }
.doc-nom  { font-size:.86rem;font-weight:700;color:var(--color-text) }
.doc-sp   { font-size:.74rem;color:var(--color-text-muted);margin-top:1px }
.doc-tarif{ font-size:.72rem;color:var(--color-primary);font-weight:600;margin-top:2px }
.doc-ok { width:26px;height:26px;border-radius:50%;flex-shrink:0;background:var(--color-primary);color:white;display:flex;align-items:center;justify-content:center }

/* ── Catégories ────────────────────────────────────────────────────────────── */
.cats-grid { display:flex;flex-direction:column;gap:.4rem }
.cat-card {
  display:flex;align-items:center;gap:.75rem;padding:.625rem .875rem;
  border-radius:.75rem;border:1.5px solid #E2E8F0;background:white;
  cursor:pointer;text-align:left;width:100%;position:relative;overflow:hidden;
  transition:all .2s;
  animation:card-enter .35s cubic-bezier(.4,0,.2,1) both;
  animation-delay:calc(var(--i, 0) * 40ms);
}
.cat-card:hover    { border-color:var(--cc);box-shadow:0 3px 12px rgba(0,0,0,.08) }
.cat-card.selected { border-color:var(--cc);background:rgba(0,0,0,.02) }
.cat-ic { width:32px;height:32px;border-radius:.5rem;flex-shrink:0;display:flex;align-items:center;justify-content:center }
.cat-nom{ flex:1;font-size:.82rem;font-weight:600;color:var(--color-text) }
.cat-ok { width:20px;height:20px;border-radius:50%;flex-shrink:0;background:var(--color-primary);color:white;display:flex;align-items:center;justify-content:center }

/* ── Créneau ─────────────────────────────────────────────────────────────── */
.slot-lbl { font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin:0 0 .5rem }
.days-row { display:flex;gap:.375rem;overflow-x:auto;padding-bottom:.375rem;margin-bottom:.875rem;scrollbar-width:thin }
.days-row::-webkit-scrollbar { height:3px }
.days-row::-webkit-scrollbar-thumb { background:#CBD5E1;border-radius:2px }
.day-chip {
  display:flex;flex-direction:column;align-items:center;gap:1px;min-width:50px;
  padding:.5rem .375rem;border-radius:.625rem;border:2px solid #E2E8F0;background:white;
  cursor:pointer;flex-shrink:0;transition:all .2s;
}
.day-chip:hover { border-color:var(--color-primary) }
.day-chip.selected {
  border-color:var(--color-primary);background:var(--color-primary);color:white;
  box-shadow:0 4px 14px rgba(14,159,142,.4);
  animation:day-pop .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes day-pop { from{transform:scale(.9)} to{transform:scale(1)} }
.dc-wd { font-size:.61rem;font-weight:600;text-transform:uppercase;opacity:.7 }
.dc-num{ font-size:1.05rem;font-weight:800;line-height:1.3 }
.dc-mo { font-size:.59rem;font-weight:500;text-transform:uppercase;opacity:.7 }

.hours-grid { display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:.875rem }
.hour-chip {
  padding:.35rem .7rem;border-radius:.5rem;border:1.5px solid #E2E8F0;background:white;
  cursor:pointer;font-size:.78rem;font-weight:500;color:var(--color-text-muted);
  transition:all .18s;
  animation:card-enter .3s cubic-bezier(.4,0,.2,1) both;
  animation-delay:calc(var(--i, 0) * 20ms);
}
.hour-chip:hover    { border-color:var(--color-primary);color:var(--color-primary) }
.hour-chip.selected {
  border-color:var(--color-primary);background:var(--color-primary);color:white;
  animation:day-pop .25s cubic-bezier(.34,1.56,.64,1);
}
.type-row { display:flex;gap:.625rem;margin-bottom:.625rem }
/* .type-btn — styles globaux dans style.css */
.step-actions { display:flex;justify-content:flex-end }
.btn-full { width:100%;justify-content:center }

/* ── Confirmation ───────────────────────────────────────────────────────────── */
.summary-card { background:#F8FAFC;border-radius:.875rem;padding:.875rem;border:1px solid #E2E8F0;display:flex;flex-direction:column;gap:.625rem }
.summ-row {
  display:flex;align-items:flex-start;gap:.625rem;
  animation:card-enter .35s cubic-bezier(.4,0,.2,1) both;
  animation-delay:calc(var(--ri, 0) * 70ms);
}
.summ-ic { width:30px;height:30px;border-radius:.5rem;flex-shrink:0;background:rgba(14,159,142,.1);color:var(--color-primary);display:flex;align-items:center;justify-content:center }
.summ-ic-prix { background:rgba(234,179,8,.12);color:#CA8A04 }
.summ-k { font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted) }
.summ-v { font-size:.86rem;font-weight:600;color:var(--color-text);margin-top:1px }
.summ-prix{ color:#CA8A04 }

.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem;margin-bottom:.75rem }
.field { display:flex;flex-direction:column;gap:.375rem }
.field-label { display:flex;align-items:center;gap:.375rem;font-size:.78rem;font-weight:600;color:var(--color-text-muted) }

/* ── Transitions étapes ─────────────────────────────────────────────────── */
.slide-fwd-enter-active,.slide-fwd-leave-active,
.slide-bwd-enter-active,.slide-bwd-leave-active { transition:all .28s cubic-bezier(.4,0,.2,1) }
.slide-fwd-enter-from { opacity:0;transform:translateX(30px) }
.slide-fwd-leave-to   { opacity:0;transform:translateX(-30px) }
.slide-bwd-enter-from { opacity:0;transform:translateX(-30px) }
.slide-bwd-leave-to   { opacity:0;transform:translateX(30px) }

.fade-up-enter-active { transition:all .28s ease }
.fade-up-enter-from   { opacity:0;transform:translateY(12px) }

/* ── Pop (checkmark) ────────────────────────────────────────────────────── */
.pop-enter-active { transition:all .3s cubic-bezier(.34,1.56,.64,1) }
.pop-enter-from   { opacity:0;transform:scale(0) }
.pop-leave-active { transition:all .15s ease }
.pop-leave-to     { opacity:0;transform:scale(0) }

/* ── Entrée modale ──────────────────────────────────────────────────────── */
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .3s ease }
.modal-fade-enter-from,.modal-fade-leave-to       { opacity:0 }
.modal-fade-enter-from .wizard-box { transform:translateY(20px) scale(.97) }
.modal-fade-leave-to .wizard-box   { transform:translateY(10px) scale(.98) }

/* ── Entrée succès ──────────────────────────────────────────────────────── */
.success-pop-enter-active { transition:all .35s cubic-bezier(.4,0,.2,1) }
.success-pop-enter-from   { opacity:0 }

/* ── Entrée cards (stagger) ─────────────────────────────────────────────── */
@keyframes card-enter {
  from { opacity:0;transform:translateY(16px) scale(.97) }
  to   { opacity:1;transform:none }
}

/* ── Skeletons ──────────────────────────────────────────────────────────── */
.skeleton-block { height:90px;border-radius:.75rem;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;animation:shimmer 1.5s infinite }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.spin { animation:spin 1s linear infinite }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
</style>
