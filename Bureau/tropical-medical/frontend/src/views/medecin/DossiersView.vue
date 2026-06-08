<template>
  <div class="dos-layout">

    <!-- ═══ PANNEAU GAUCHE : liste patients ═══ -->
    <div class="dos-sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-titre"><FolderOpen :size="16" /> Dossiers</h2>
        <span class="sidebar-count">{{ dossiersFiltres.length }}</span>
      </div>
      <div class="search-box">
        <Search :size="14" class="search-ic" />
        <input v-model="recherche" type="text" placeholder="Nom, prénom, N° dossier…" class="search-input" />
      </div>
      <div v-if="chargement" class="skel-list">
        <div class="skel-item" v-for="i in 5" :key="i"></div>
      </div>
      <div v-else class="patient-list">
        <div v-for="d in dossiersFiltres" :key="d.id"
          class="patient-item" :class="{ active: selectionne === d.id }"
          @click="selectionnerDossier(d)">
          <div class="pi-avatar"><User :size="15" /></div>
          <div class="pi-info">
            <div class="pi-nom">{{ d.patient.utilisateur.prenom }} {{ d.patient.utilisateur.nom }}</div>
            <div class="pi-num">#{{ d.numeroDossier }}</div>
          </div>
          <ChevronRight :size="14" class="pi-arrow" />
        </div>
        <div v-if="!dossiersFiltres.length" class="vide-sidebar">
          <FolderOpen :size="28" style="opacity:.2" />
          <span>Aucun dossier</span>
        </div>
      </div>
    </div>

    <!-- ═══ PANNEAU DROIT : détail dossier ═══ -->
    <div class="dos-main">

      <!-- Aucun dossier sélectionné -->
      <div v-if="!dossierDetail" class="vide-main">
        <FolderOpen :size="64" style="opacity:.12;margin-bottom:1rem" />
        <p class="vide-titre">Sélectionnez un patient</p>
        <p class="vide-sub">Le dossier médical complet s'affichera ici</p>
      </div>

      <template v-else>
        <!-- En-tête du dossier -->
        <div class="dossier-head">
          <div class="dh-left">
            <div class="dh-avatar"><User :size="26" /></div>
            <div>
              <h1 class="dh-nom">{{ dossierDetail.patient.utilisateur.prenom }} {{ dossierDetail.patient.utilisateur.nom }}</h1>
              <div class="dh-meta">
                <span><Hash :size="11" /> #{{ dossierDetail.numeroDossier }}</span>
                <span v-if="dossierDetail.patient.dateNaissance">
                  <Calendar :size="11" /> {{ calcAge(dossierDetail.patient.dateNaissance) }} ans
                </span>
                <span v-if="dossierDetail.patient.sexe">
                  {{ dossierDetail.patient.sexe === 'M' ? 'Homme' : 'Femme' }}
                </span>
                <span v-if="dossierDetail.patient.groupeSanguin" class="badge-gs">
                  <Droplets :size="10" /> {{ dossierDetail.patient.groupeSanguin }}
                </span>
              </div>
            </div>
          </div>
          <div class="dh-right">
            <span v-if="chargementDetail" class="spinner"><Loader2 :size="16" /></span>
          </div>
        </div>

        <!-- Onglets -->
        <div class="onglets-bar">
          <button v-for="o in onglets" :key="o.id"
            class="onglet-btn" :class="{ active: ongletActif === o.id }"
            @click="ongletActif = o.id">
            <component :is="o.icone" :size="13" />
            {{ o.label }}
            <span v-if="o.count" class="ocount">{{ o.count }}</span>
          </button>
        </div>

        <!-- ─── 1. Infos administratives ─── -->
        <div v-if="ongletActif === 'admin'" class="section-content">
          <SectionHeader title="Informations administratives" :editing="editMode.admin"
            @edit="editMode.admin = true" @cancel="annulerEdit('admin')" @save="sauvegarder('admin')" :saving="saving" />
          <div class="form-grid">
            <FieldRow label="Prénom" icon="user">
              <input v-if="editMode.admin" v-model="form.prenom" class="input input-sm" />
              <span v-else>{{ dossierDetail.patient.utilisateur.prenom || '—' }}</span>
            </FieldRow>
            <FieldRow label="Nom" icon="user">
              <input v-if="editMode.admin" v-model="form.nom" class="input input-sm" />
              <span v-else>{{ dossierDetail.patient.utilisateur.nom || '—' }}</span>
            </FieldRow>
            <FieldRow label="Date de naissance" icon="calendar">
              <input v-if="editMode.admin" v-model="form.dateNaissance" type="date" class="input input-sm" />
              <span v-else>{{ fmt(dossierDetail.patient.dateNaissance) }}</span>
            </FieldRow>
            <FieldRow label="Sexe" icon="user">
              <select v-if="editMode.admin" v-model="form.sexe" class="input input-sm">
                <option value="">—</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
              <span v-else>{{ dossierDetail.patient.sexe === 'M' ? 'Masculin' : dossierDetail.patient.sexe === 'F' ? 'Féminin' : '—' }}</span>
            </FieldRow>
            <FieldRow label="Téléphone" icon="phone">
              <input v-if="editMode.admin" v-model="form.telephone" class="input input-sm" />
              <span v-else>{{ dossierDetail.patient.utilisateur.telephone || '—' }}</span>
            </FieldRow>
            <FieldRow label="Adresse" icon="map">
              <input v-if="editMode.admin" v-model="form.adresse" class="input input-sm" />
              <span v-else>{{ dossierDetail.patient.adresse || '—' }}</span>
            </FieldRow>
            <FieldRow label="N° d'identification" icon="id">
              <input v-if="editMode.admin" v-model="form.numeroIdentification" class="input input-sm" />
              <span v-else>{{ dossierDetail.patient.numeroIdentification || '—' }}</span>
            </FieldRow>
          </div>
          <div class="subsection-titre"><PhoneCall :size="14" /> Personne à contacter en cas d'urgence</div>
          <div class="form-grid">
            <FieldRow label="Nom complet" icon="user">
              <input v-if="editMode.admin" v-model="form.contactUrgenceNom" class="input input-sm" />
              <span v-else>{{ dossierDetail.patient.contactUrgenceNom || '—' }}</span>
            </FieldRow>
            <FieldRow label="Téléphone" icon="phone">
              <input v-if="editMode.admin" v-model="form.contactUrgenceTelephone" class="input input-sm" />
              <span v-else>{{ dossierDetail.patient.contactUrgenceTelephone || '—' }}</span>
            </FieldRow>
          </div>
          <div v-if="dossierDetail.patient.assurance" class="assurance-card">
            <Shield :size="14" />
            <span><strong>{{ dossierDetail.patient.assurance.organisme }}</strong> · {{ dossierDetail.patient.assurance.type }} · {{ dossierDetail.patient.assurance.tauxCouverture }}% couverts</span>
          </div>
        </div>

        <!-- ─── 2. Antécédents médicaux ─── -->
        <div v-if="ongletActif === 'antecedents'" class="section-content">
          <SectionHeader title="Antécédents médicaux" :editing="editMode.antecedents"
            @edit="editMode.antecedents = true" @cancel="annulerEdit('antecedents')" @save="sauvegarder('antecedents')" :saving="saving" />

          <TagEditor label="Allergies" :icon="AlertTriangle" color="red"
            :editing="editMode.antecedents"
            v-model="form.allergies"
            :display="dossierDetail.patient.allergies"
            placeholder="Ex: Pénicilline, arachides…" />

          <TagEditor label="Maladies passées" :icon="ClipboardList" color="blue"
            :editing="editMode.antecedents"
            v-model="form.antecedents"
            :display="dossierDetail.patient.antecedents"
            placeholder="Ex: Paludisme, Tuberculose…" />

          <TagEditor label="Maladies chroniques" :icon="Activity" color="orange"
            :editing="editMode.antecedents"
            v-model="form.maladiesChroniques"
            :display="dossierDetail.patient.maladiesChroniques"
            placeholder="Ex: Diabète type 2, Hypertension…" />

          <TagEditor label="Antécédents familiaux" :icon="Users" color="purple"
            :editing="editMode.antecedents"
            v-model="form.antecedentsFamiliaux"
            :display="dossierDetail.patient.antecedentsFamiliaux"
            placeholder="Ex: Cancer du sein (mère), Diabète (père)…" />

          <TagEditor label="Interventions chirurgicales" :icon="Scissors" color="teal"
            :editing="editMode.antecedents"
            v-model="form.chirurgies"
            :display="dossierDetail.patient.chirurgies"
            placeholder="Ex: Appendicectomie 2020, Césarienne 2018…" />

          <TagEditor label="Hospitalisations précédentes" :icon="Building2" color="gray"
            :editing="editMode.antecedents"
            v-model="form.hospitalisationsPrecedentes"
            :display="dossierDetail.patient.hospitalisationsPrecedentes"
            placeholder="Ex: Accouchement 2022 - CHU de Dakar…" />
        </div>

        <!-- ─── 3. Consultations ─── -->
        <div v-if="ongletActif === 'consultations'" class="section-content">
          <div class="section-title-row">
            <h2 class="section-titre"><Stethoscope :size="15" /> Consultations</h2>
          </div>
          <div v-if="!dossierDetail.consultations?.length" class="vide-section">
            <Stethoscope :size="32" style="opacity:.2" />
            <span>Aucune consultation enregistrée</span>
          </div>
          <div v-else class="timeline">
            <div v-for="c in dossierDetail.consultations" :key="c.id" class="tl-item">
              <div class="tl-dot"></div>
              <div class="tl-card">
                <div class="tl-header">
                  <div class="tl-date"><Calendar :size="11" /> {{ fmt(c.createdAt) }}</div>
                  <div class="tl-doc">Dr. {{ c.medecin.utilisateur.prenom }} {{ c.medecin.utilisateur.nom }}</div>
                  <span v-if="c.ordonnances?.length" class="badge-pill badge-purple">
                    <Pill :size="9" /> {{ c.ordonnances.length }} ordo.
                  </span>
                </div>
                <div class="tl-body">
                  <div v-if="c.motif" class="tl-field"><span class="tl-lbl">Motif</span> {{ c.motif }}</div>
                  <div v-if="c.diagnostic" class="tl-field"><span class="tl-lbl">Diagnostic</span> {{ c.diagnostic }}</div>
                  <div v-if="c.traitement" class="tl-field"><span class="tl-lbl">Traitement</span> {{ c.traitement }}</div>
                  <div v-if="c.anamnese" class="tl-field"><span class="tl-lbl">Anamnèse</span> {{ c.anamnese }}</div>
                  <div v-if="c.examenClinique" class="tl-field"><span class="tl-lbl">Examen clinique</span> {{ c.examenClinique }}</div>
                  <div v-if="c.notes" class="tl-field tl-notes"><span class="tl-lbl">Notes</span> {{ c.notes }}</div>
                </div>
                <!-- Ordonnances de cette consultation -->
                <div v-if="c.ordonnances?.length" class="ordo-mini-list">
                  <div v-for="o in c.ordonnances" :key="o.id" class="ordo-mini">
                    <Pill :size="11" style="color:#7C3AED" />
                    <span>{{ o.lignes.map(l => l.medicament.nom).join(', ') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── 4. Examens et résultats ─── -->
        <div v-if="ongletActif === 'examens'" class="section-content">
          <div class="section-title-row">
            <h2 class="section-titre"><FlaskConical :size="15" /> Examens et résultats</h2>
            <button class="btn-add" @click="modalExamen = true">
              <Plus :size="13" /> Ajouter un examen
            </button>
          </div>
          <div v-if="!dossierDetail.examens?.length" class="vide-section">
            <FlaskConical :size="32" style="opacity:.2" />
            <span>Aucun examen enregistré</span>
          </div>
          <div v-else class="examens-grid">
            <div v-for="e in dossierDetail.examens" :key="e.id" class="examen-card">
              <div class="ex-header">
                <span class="ex-type" :class="typeExamenClass(e.type)">{{ labelTypeExamen(e.type) }}</span>
                <div class="ex-actions">
                  <span class="ex-date"><Calendar :size="10" /> {{ fmt(e.date) }}</span>
                  <button class="btn-del" @click="supprimerExamenItem(e.id)" title="Supprimer">
                    <Trash2 :size="13" />
                  </button>
                </div>
              </div>
              <div class="ex-titre">{{ e.titre }}</div>
              <div v-if="e.description" class="ex-desc">{{ e.description }}</div>
              <div v-if="e.resultats" class="ex-resultats">
                <span class="tl-lbl">Résultats</span> {{ e.resultats }}
              </div>
            </div>
          </div>
        </div>

        <!-- ─── 5. Ordonnances ─── -->
        <div v-if="ongletActif === 'ordonnances'" class="section-content">
          <div class="section-title-row">
            <h2 class="section-titre"><Pill :size="15" /> Prescriptions médicales</h2>
          </div>
          <div v-if="!dossierDetail.ordonnances?.length" class="vide-section">
            <Pill :size="32" style="opacity:.2" />
            <span>Aucune ordonnance enregistrée</span>
          </div>
          <div v-else class="ordo-list">
            <div v-for="o in dossierDetail.ordonnances" :key="o.id" class="ordo-card-dos">
              <div class="oc-header">
                <div class="oc-meta">
                  <Calendar :size="11" /> {{ fmt(o.createdAt) }}
                  <span class="oc-doc">· {{ o.medecinNom }}</span>
                </div>
                <span class="oc-statut" :class="o.statut === 'ACTIVE' ? 'st-green' : 'st-gray'">{{ o.statut }}</span>
              </div>
              <div v-if="o.instructions" class="oc-instr">
                <Info :size="11" /> {{ o.instructions }}
              </div>
              <div class="oc-meds">
                <div v-for="lg in o.lignes" :key="lg.id" class="med-row">
                  <span class="med-bullet"></span>
                  <span class="med-nom">{{ lg.medicament.nom }}</span>
                  <span class="med-info">{{ lg.posologie }}</span>
                  <span v-if="lg.duree" class="med-info">· {{ lg.duree }}</span>
                  <span class="med-qte">Qté: {{ lg.quantite }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── 6. Vaccinations ─── -->
        <div v-if="ongletActif === 'vaccinations'" class="section-content">
          <div class="section-title-row">
            <h2 class="section-titre"><Syringe :size="15" /> Vaccinations</h2>
            <button class="btn-add" @click="modalVaccin = true">
              <Plus :size="13" /> Ajouter un vaccin
            </button>
          </div>
          <div v-if="!dossierDetail.vaccinations?.length" class="vide-section">
            <Syringe :size="32" style="opacity:.2" />
            <span>Aucune vaccination enregistrée</span>
          </div>
          <div v-else class="vaccins-table-wrap">
            <table class="vaccins-table">
              <thead>
                <tr>
                  <th>Vaccin</th>
                  <th>Date d'administration</th>
                  <th>Rappel prévu</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in dossierDetail.vaccinations" :key="v.id" class="vaccin-row">
                  <td class="vn-nom">{{ v.nom }}</td>
                  <td class="vn-date">{{ fmt(v.dateAdministration) }}</td>
                  <td class="vn-rappel">
                    <span v-if="v.rappelPrevu" :class="rappelDepasse(v.rappelPrevu) ? 'badge-pill badge-red' : 'badge-pill badge-orange'">
                      {{ fmt(v.rappelPrevu) }}
                    </span>
                    <span v-else style="color:#CBD5E1">—</span>
                  </td>
                  <td class="vn-notes">{{ v.notes || '—' }}</td>
                  <td>
                    <button class="btn-del" @click="supprimerVaccinItem(v.id)"><Trash2 :size="13" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── 7. Hospitalisations ─── -->
        <div v-if="ongletActif === 'hospitalisations'" class="section-content">
          <div class="section-title-row">
            <h2 class="section-titre"><Building2 :size="15" /> Hospitalisations</h2>
          </div>
          <div v-if="!dossierDetail.patient.hospitalisations?.length" class="vide-section">
            <Building2 :size="32" style="opacity:.2" />
            <span>Aucune hospitalisation enregistrée</span>
          </div>
          <div v-else class="hospi-list">
            <div v-for="h in dossierDetail.patient.hospitalisations" :key="h.id" class="hospi-card">
              <div class="hospi-header">
                <div class="hospi-dates">
                  <span class="hospi-entry">Entrée : {{ fmt(h.dateAdmission) }}</span>
                  <span class="hospi-exit">Sortie : {{ h.dateSortie ? fmt(h.dateSortie) : 'En cours' }}</span>
                </div>
                <span class="hospi-statut" :class="h.statut === 'EN_COURS' ? 'st-orange' : 'st-gray'">{{ h.statut }}</span>
              </div>
              <div class="hospi-body">
                <div v-if="h.lit" class="hospi-lit">
                  <BedDouble :size="12" /> Lit {{ h.lit.numero }} · Chambre {{ h.lit.chambre }} · Étage {{ h.lit.etage }}
                </div>
                <div v-if="h.motif" class="tl-field"><span class="tl-lbl">Motif</span> {{ h.motif }}</div>
                <div v-if="h.diagnostic" class="tl-field"><span class="tl-lbl">Diagnostic</span> {{ h.diagnostic }}</div>
                <div v-if="h.notes" class="tl-field"><span class="tl-lbl">Notes</span> {{ h.notes }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── 8. Rendez-vous ─── -->
        <div v-if="ongletActif === 'rdvs'" class="section-content">
          <div class="section-title-row">
            <h2 class="section-titre"><CalendarDays :size="15" /> Rendez-vous et suivi</h2>
          </div>
          <div v-if="!dossierDetail.rdvs?.length" class="vide-section">
            <CalendarDays :size="32" style="opacity:.2" />
            <span>Aucun rendez-vous enregistré</span>
          </div>
          <div v-else>
            <!-- RDV à venir -->
            <div class="subsection-titre" style="margin-bottom:.625rem">
              <Clock :size="13" /> À venir
            </div>
            <div class="rdv-mini-list" style="margin-bottom:1.25rem">
              <div v-for="r in rdvsAvenir" :key="r.id" class="rdv-mini-card rdv-avenir">
                <div class="rdv-time-dot rdv-time-blue"><Clock :size="11" /></div>
                <div class="rdv-mini-info">
                  <div class="rdv-mini-date">{{ fmtDateHeure(r.date) }}</div>
                  <div class="rdv-mini-sub">{{ r.motif || 'Consultation' }} · Dr. {{ r.medecin.utilisateur.prenom }} {{ r.medecin.utilisateur.nom }}</div>
                </div>
                <span class="badge-pill badge-blue">{{ r.type === 'TELECONSULTATION' ? 'Télé' : 'Présentiel' }}</span>
              </div>
              <div v-if="!rdvsAvenir.length" style="color:var(--color-text-muted);font-size:.83rem;padding:.5rem">Aucun RDV à venir</div>
            </div>
            <!-- Historique -->
            <div class="subsection-titre" style="margin-bottom:.625rem">
              <History :size="13" /> Historique
            </div>
            <div class="rdv-mini-list">
              <div v-for="r in rdvsPasses" :key="r.id" class="rdv-mini-card" style="opacity:.75">
                <div class="rdv-time-dot rdv-time-gray"><CheckCircle :size="11" /></div>
                <div class="rdv-mini-info">
                  <div class="rdv-mini-date">{{ fmtDateHeure(r.date) }}</div>
                  <div class="rdv-mini-sub">{{ r.motif || 'Consultation' }} · Dr. {{ r.medecin.utilisateur.prenom }} {{ r.medecin.utilisateur.nom }}</div>
                </div>
                <span class="badge-pill" :class="statutRdvClass(r.statut)">{{ r.statut }}</span>
              </div>
              <div v-if="!rdvsPasses.length" style="color:var(--color-text-muted);font-size:.83rem;padding:.5rem">Aucun historique</div>
            </div>
          </div>
        </div>

      </template>
    </div>

    <!-- ═══ MODAL : Ajouter vaccin ═══ -->
    <Transition name="fade-modal">
      <div v-if="modalVaccin" class="modal-overlay" @click.self="modalVaccin = false">
        <div class="modal-box modal-sm">
          <div class="modal-header">
            <div class="modal-titre"><Syringe :size="15" style="color:var(--color-primary)" /> Ajouter une vaccination</div>
            <button class="close-btn" @click="modalVaccin = false"><X :size="15" /></button>
          </div>
          <form @submit.prevent="soumettreVaccin" class="modal-body">
            <div class="field">
              <label class="field-label">Nom du vaccin *</label>
              <input v-model="formVaccin.nom" required class="input" placeholder="Ex: BCG, Hépatite B, Tétanos…" />
            </div>
            <div class="deux-cols">
              <div class="field">
                <label class="field-label">Date d'administration *</label>
                <input v-model="formVaccin.dateAdministration" type="date" required class="input" />
              </div>
              <div class="field">
                <label class="field-label">Rappel prévu</label>
                <input v-model="formVaccin.rappelPrevu" type="date" class="input" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Notes</label>
              <input v-model="formVaccin.notes" class="input" placeholder="Informations complémentaires…" />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="modalVaccin = false">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <Loader2 v-if="saving" :size="14" class="spin" /><Check v-else :size="14" /> Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ═══ MODAL : Ajouter examen ═══ -->
    <Transition name="fade-modal">
      <div v-if="modalExamen" class="modal-overlay" @click.self="modalExamen = false">
        <div class="modal-box modal-sm">
          <div class="modal-header">
            <div class="modal-titre"><FlaskConical :size="15" style="color:var(--color-primary)" /> Ajouter un examen</div>
            <button class="close-btn" @click="modalExamen = false"><X :size="15" /></button>
          </div>
          <form @submit.prevent="soumettreExamen" class="modal-body">
            <div class="deux-cols">
              <div class="field">
                <label class="field-label">Type d'examen *</label>
                <select v-model="formExamen.type" required class="input">
                  <option value="LABORATOIRE">Analyse de laboratoire</option>
                  <option value="RADIOLOGIE">Radiographie</option>
                  <option value="ECHOGRAPHIE">Échographie</option>
                  <option value="SCANNER">Scanner</option>
                  <option value="IRM">IRM</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div class="field">
                <label class="field-label">Date</label>
                <input v-model="formExamen.date" type="date" class="input" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Titre / Intitulé *</label>
              <input v-model="formExamen.titre" required class="input" placeholder="Ex: NFS, Glycémie à jeun, Radio thorax…" />
            </div>
            <div class="field">
              <label class="field-label">Description</label>
              <textarea v-model="formExamen.description" class="input textarea" rows="2" placeholder="Contexte de l'examen…"></textarea>
            </div>
            <div class="field">
              <label class="field-label">Résultats</label>
              <textarea v-model="formExamen.resultats" class="input textarea" rows="3" placeholder="Résultats et interprétation…"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="modalExamen = false">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <Loader2 v-if="saving" :size="14" class="spin" /><Check v-else :size="14" /> Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, defineComponent, h } from 'vue'
import {
  FolderOpen, Search, User, ChevronRight, Hash, Calendar, Droplets, Shield,
  AlertTriangle, ClipboardList, Activity, Users, Scissors, Building2,
  Stethoscope, FlaskConical, Pill, Syringe, CalendarDays, Clock, History,
  CheckCircle, BedDouble, Info, Phone, PhoneCall, Plus, Trash2, X, Check,
  Loader2, Edit, Save,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt, fmtHeure, fmtDateHeure } = useDate()

// ─── État ───────────────────────────────────────────────────────────────────
const chargement       = ref(true)
const chargementDetail = ref(false)
const saving           = ref(false)
const dossiers         = ref([])
const recherche        = ref('')
const selectionne      = ref(null)
const dossierDetail    = ref(null)
const ongletActif      = ref('admin')
const modalVaccin      = ref(false)
const modalExamen      = ref(false)

const editMode = reactive({ admin: false, antecedents: false })

const form = reactive({
  prenom: '', nom: '', telephone: '', adresse: '',
  dateNaissance: '', sexe: '', groupeSanguin: '', numeroIdentification: '',
  contactUrgenceNom: '', contactUrgenceTelephone: '',
  allergies: '', antecedents: '', maladiesChroniques: '',
  antecedentsFamiliaux: '', chirurgies: '', hospitalisationsPrecedentes: '',
})

const formVaccin = reactive({ nom: '', dateAdministration: '', rappelPrevu: '', notes: '' })
const formExamen = reactive({ type: 'LABORATOIRE', titre: '', description: '', resultats: '', date: '' })

// ─── Onglets ─────────────────────────────────────────────────────────────────
const onglets = computed(() => {
  const d = dossierDetail.value
  return [
    { id: 'admin',          label: 'Infos admin',     icone: User         },
    { id: 'antecedents',    label: 'Antécédents',     icone: ClipboardList },
    { id: 'consultations',  label: 'Consultations',   icone: Stethoscope,  count: d?.consultations?.length },
    { id: 'examens',        label: 'Examens',         icone: FlaskConical, count: d?.examens?.length },
    { id: 'ordonnances',    label: 'Ordonnances',     icone: Pill,         count: d?.ordonnances?.length },
    { id: 'vaccinations',   label: 'Vaccinations',    icone: Syringe,      count: d?.vaccinations?.length },
    { id: 'hospitalisations', label: 'Hospitalisations', icone: Building2, count: d?.patient?.hospitalisations?.length },
    { id: 'rdvs',           label: 'RDVs',            icone: CalendarDays, count: d?.rdvs?.length },
  ]
})

const rdvsAvenir = computed(() => (dossierDetail.value?.rdvs || []).filter(r => new Date(r.date) >= new Date() && r.statut !== 'ANNULE').sort((a, b) => new Date(a.date) - new Date(b.date)))
const rdvsPasses = computed(() => (dossierDetail.value?.rdvs || []).filter(r => new Date(r.date) < new Date() || r.statut === 'ANNULE').sort((a, b) => new Date(b.date) - new Date(a.date)))

// ─── Chargement ───────────────────────────────────────────────────────────────
onMounted(async () => {
  try { dossiers.value = await api.get('/medecin/dossiers') }
  finally { chargement.value = false }
})

const dossiersFiltres = computed(() => {
  if (!recherche.value) return dossiers.value
  const q = recherche.value.toLowerCase()
  return dossiers.value.filter(d =>
    d.patient.utilisateur.nom.toLowerCase().includes(q) ||
    d.patient.utilisateur.prenom.toLowerCase().includes(q) ||
    d.numeroDossier.toLowerCase().includes(q)
  )
})

async function selectionnerDossier(dossier) {
  selectionne.value = dossier.id
  ongletActif.value = 'admin'
  editMode.admin = editMode.antecedents = false
  chargementDetail.value = true
  try {
    dossierDetail.value = await api.get(`/medecin/dossiers/${dossier.id}`)
    remplirForm()
  } finally { chargementDetail.value = false }
}

function remplirForm() {
  const d = dossierDetail.value
  if (!d) return
  const p = d.patient
  const u = p.utilisateur
  form.prenom = u.prenom || ''
  form.nom = u.nom || ''
  form.telephone = u.telephone || ''
  form.adresse = p.adresse || ''
  form.dateNaissance = p.dateNaissance ? p.dateNaissance.slice(0, 10) : ''
  form.sexe = p.sexe || ''
  form.groupeSanguin = p.groupeSanguin || ''
  form.numeroIdentification = p.numeroIdentification || ''
  form.contactUrgenceNom = p.contactUrgenceNom || ''
  form.contactUrgenceTelephone = p.contactUrgenceTelephone || ''
  form.allergies = p.allergies || ''
  form.antecedents = p.antecedents || ''
  form.maladiesChroniques = p.maladiesChroniques || ''
  form.antecedentsFamiliaux = p.antecedentsFamiliaux || ''
  form.chirurgies = p.chirurgies || ''
  form.hospitalisationsPrecedentes = p.hospitalisationsPrecedentes || ''
}

function annulerEdit(section) {
  editMode[section] = false
  remplirForm()
}

async function sauvegarder(section) {
  saving.value = true
  try {
    await api.put(`/medecin/dossiers/${dossierDetail.value.id}`, { ...form })
    dossierDetail.value = await api.get(`/medecin/dossiers/${dossierDetail.value.id}`)
    editMode[section] = false
    remplirForm()
  } catch (e) { alert(e.message) }
  finally { saving.value = false }
}

// ─── Vaccinations ─────────────────────────────────────────────────────────────
async function soumettreVaccin() {
  saving.value = true
  try {
    await api.post(`/medecin/dossiers/${dossierDetail.value.id}/vaccinations`, { ...formVaccin })
    dossierDetail.value = await api.get(`/medecin/dossiers/${dossierDetail.value.id}`)
    modalVaccin.value = false
    Object.assign(formVaccin, { nom: '', dateAdministration: '', rappelPrevu: '', notes: '' })
  } catch (e) { alert(e.message) }
  finally { saving.value = false }
}

async function supprimerVaccinItem(id) {
  if (!confirm('Supprimer cette vaccination ?')) return
  await api.del(`/medecin/vaccinations/${id}`)
  dossierDetail.value = await api.get(`/medecin/dossiers/${dossierDetail.value.id}`)
}

// ─── Examens ──────────────────────────────────────────────────────────────────
async function soumettreExamen() {
  saving.value = true
  try {
    await api.post(`/medecin/dossiers/${dossierDetail.value.id}/examens`, { ...formExamen })
    dossierDetail.value = await api.get(`/medecin/dossiers/${dossierDetail.value.id}`)
    modalExamen.value = false
    Object.assign(formExamen, { type: 'LABORATOIRE', titre: '', description: '', resultats: '', date: '' })
  } catch (e) { alert(e.message) }
  finally { saving.value = false }
}

async function supprimerExamenItem(id) {
  if (!confirm('Supprimer cet examen ?')) return
  await api.del(`/medecin/examens/${id}`)
  dossierDetail.value = await api.get(`/medecin/dossiers/${dossierDetail.value.id}`)
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function calcAge(dateNaissance) {
  if (!dateNaissance) return '?'
  const diff = Date.now() - new Date(dateNaissance).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function rappelDepasse(date) { return new Date(date) < new Date() }

function typeExamenClass(type) {
  return { LABORATOIRE: 'ex-lab', RADIOLOGIE: 'ex-radio', ECHOGRAPHIE: 'ex-echo', SCANNER: 'ex-scanner', IRM: 'ex-irm', AUTRE: 'ex-autre' }[type] || 'ex-autre'
}

function labelTypeExamen(type) {
  return { LABORATOIRE: 'Labo', RADIOLOGIE: 'Radio', ECHOGRAPHIE: 'Écho', SCANNER: 'Scanner', IRM: 'IRM', AUTRE: 'Autre' }[type] || type
}

function statutRdvClass(s) {
  return { EN_ATTENTE: 'badge-orange', CONFIRME: 'badge-green', TERMINE: 'badge-gray', ANNULE: 'badge-red' }[s] || 'badge-gray'
}

// ─── Composants internes ──────────────────────────────────────────────────────
const SectionHeader = defineComponent({
  props: ['title', 'editing', 'saving'],
  emits: ['edit', 'cancel', 'save'],
  setup(props, { emit }) {
    return () => h('div', { class: 'section-title-row' }, [
      h('h2', { class: 'section-titre' }, props.title),
      props.editing
        ? h('div', { style: 'display:flex;gap:.5rem' }, [
            h('button', { class: 'btn btn-ghost btn-sm', onClick: () => emit('cancel') }, 'Annuler'),
            h('button', { class: 'btn btn-primary btn-sm', onClick: () => emit('save'), disabled: props.saving },
              props.saving ? 'Enregistrement…' : 'Enregistrer'),
          ])
        : h('button', { class: 'btn-edit', onClick: () => emit('edit') }, [
            h('span', { innerHTML: '✏️' }), ' Modifier',
          ]),
    ])
  },
})

const FieldRow = defineComponent({
  props: ['label'],
  setup(props, { slots }) {
    return () => h('div', { class: 'field-row' }, [
      h('div', { class: 'fr-label' }, props.label),
      h('div', { class: 'fr-val' }, slots.default?.()),
    ])
  },
})

const TagEditor = defineComponent({
  props: ['label', 'icon', 'color', 'editing', 'modelValue', 'display', 'placeholder'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const tags = (props.display || '').split(',').map(t => t.trim()).filter(Boolean)
      return h('div', { class: 'tag-section' }, [
        h('div', { class: `tag-label tag-${props.color}` }, [
          props.icon ? h(props.icon, { size: 12 }) : null,
          ' ' + props.label,
        ]),
        props.editing
          ? h('input', {
              value: props.modelValue,
              onInput: e => emit('update:modelValue', e.target.value),
              class: 'input input-sm',
              placeholder: props.placeholder,
              style: 'margin-top:.375rem',
            })
          : h('div', { class: 'tags-display' },
              tags.length
                ? tags.map(t => h('span', { class: `tag tag-${props.color}` }, t))
                : [h('span', { style: 'color:#CBD5E1;font-size:.8rem' }, '—')]
            ),
      ])
    }
  },
})
</script>

<style scoped>
@keyframes shimmer  { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes spin     { to { transform:rotate(360deg) } }
@keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
@keyframes slideIn  { from { opacity:0;transform:translateX(-8px) } to { opacity:1;transform:none } }

/* ─── Layout ─────────────────────────────────────────────── */
.dos-layout { display:flex;gap:1.25rem;height:calc(100vh - 120px);overflow:hidden; }

/* ─── Sidebar ────────────────────────────────────────────── */
.dos-sidebar { width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:.75rem;background:white;border:1px solid #E2E8F0;border-radius:1.25rem;padding:1rem;overflow:hidden; }
.sidebar-header { display:flex;align-items:center;justify-content:space-between; }
.sidebar-titre { display:flex;align-items:center;gap:.375rem;font-family:var(--font-display);font-size:.9rem;font-weight:700;color:var(--color-text);margin:0; }
.sidebar-count { background:#F1F5F9;color:#64748B;border-radius:9999px;font-size:.7rem;font-weight:700;padding:1px 8px; }
.search-box { position:relative; }
.search-ic  { position:absolute;left:.625rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted);pointer-events:none; }
.search-input { width:100%;padding:.45rem .625rem .45rem 2rem;border:1.5px solid #E2E8F0;border-radius:.75rem;font-size:.8rem;outline:none; }
.search-input:focus { border-color:var(--color-primary); }
.patient-list { flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.25rem; }
.patient-item { display:flex;align-items:center;gap:.625rem;padding:.6rem .75rem;border-radius:.75rem;cursor:pointer;transition:background .15s; }
.patient-item:hover { background:#F8FAFC; }
.patient-item.active { background:rgba(14,159,142,.08);border:1px solid rgba(14,159,142,.2); }
.pi-avatar { width:28px;height:28px;border-radius:50%;background:rgba(14,159,142,.1);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0; }
.pi-info { flex:1;min-width:0; }
.pi-nom  { font-size:.82rem;font-weight:600;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.pi-num  { font-size:.68rem;color:var(--color-text-muted);font-family:monospace; }
.pi-arrow { color:#CBD5E1;flex-shrink:0; }
.vide-sidebar { display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:2rem 1rem;color:var(--color-text-muted);font-size:.8rem; }

/* ─── Main ───────────────────────────────────────────────── */
.dos-main { flex:1;min-width:0;overflow-y:auto;display:flex;flex-direction:column;gap:1rem; }
.vide-main { display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--color-text-muted); }
.vide-titre { font-size:1rem;font-weight:600;margin:0; }
.vide-sub   { font-size:.83rem;margin:.25rem 0 0; }

/* ─── Dossier header ─────────────────────────────────────── */
.dossier-head { background:white;border:1px solid #E2E8F0;border-radius:1.25rem;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between; }
.dh-left { display:flex;align-items:center;gap:1rem; }
.dh-avatar { width:52px;height:52px;border-radius:50%;background:rgba(14,159,142,.12);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0; }
.dh-nom  { font-family:var(--font-display);font-size:1.15rem;font-weight:800;color:var(--color-text);margin:0; }
.dh-meta { display:flex;align-items:center;flex-wrap:wrap;gap:.625rem;margin-top:.25rem; }
.dh-meta span { display:inline-flex;align-items:center;gap:.25rem;font-size:.75rem;color:var(--color-text-muted); }
.badge-gs { background:rgba(220,38,38,.1);color:#DC2626;border-radius:9999px;padding:1px 7px;font-size:.7rem;font-weight:700; }
.spinner { display:flex;align-items:center;color:var(--color-primary);animation:spin 1s linear infinite; }

/* ─── Onglets ────────────────────────────────────────────── */
.onglets-bar { display:flex;gap:.25rem;flex-wrap:wrap;background:white;border:1px solid #E2E8F0;border-radius:1rem;padding:.5rem; }
.onglet-btn { display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .875rem;border-radius:.625rem;border:none;background:none;cursor:pointer;font-size:.78rem;font-weight:600;color:var(--color-text-muted);transition:all .15s;white-space:nowrap; }
.onglet-btn:hover { background:#F8FAFC;color:var(--color-text); }
.onglet-btn.active { background:linear-gradient(135deg,rgba(14,159,142,.12),rgba(14,159,142,.05));color:var(--color-primary);border:1px solid rgba(14,159,142,.25); }
.ocount { background:var(--color-primary);color:white;border-radius:9999px;font-size:.62rem;font-weight:700;padding:0 5px;min-width:16px;text-align:center; }

/* ─── Sections ───────────────────────────────────────────── */
.section-content { background:white;border:1px solid #E2E8F0;border-radius:1.25rem;padding:1.375rem;display:flex;flex-direction:column;gap:1.25rem; }
.section-title-row { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem; }
.section-titre { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text);margin:0; }
.subsection-titre { display:flex;align-items:center;gap:.375rem;font-size:.8rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;padding-bottom:.5rem;border-bottom:1px solid #F1F5F9; }
.btn-edit { display:inline-flex;align-items:center;gap:.35rem;padding:.375rem .875rem;border:1.5px solid #E2E8F0;border-radius:.625rem;background:white;cursor:pointer;font-size:.78rem;font-weight:600;color:var(--color-text-muted);transition:all .15s; }
.btn-edit:hover { border-color:var(--color-primary);color:var(--color-primary); }
.btn-add { display:inline-flex;align-items:center;gap:.35rem;padding:.375rem .875rem;background:linear-gradient(135deg,#22C55E,#059669);color:white;border:none;border-radius:.625rem;cursor:pointer;font-size:.78rem;font-weight:700;transition:box-shadow .2s; }
.btn-add:hover { box-shadow:0 4px 14px rgba(34,197,94,.4); }
.btn-del { background:none;border:none;cursor:pointer;color:#CBD5E1;display:flex;align-items:center;padding:.25rem;border-radius:.375rem;transition:all .15s; }
.btn-del:hover { color:#DC2626;background:rgba(220,38,38,.08); }
.vide-section { display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:3rem 1rem;color:var(--color-text-muted);font-size:.85rem; }

/* ─── Form grid ──────────────────────────────────────────── */
.form-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:.875rem; }
@media(max-width:700px) { .form-grid { grid-template-columns:1fr } }
.field-row { display:flex;flex-direction:column;gap:.25rem; }
.fr-label { font-size:.72rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em; }
.fr-val   { font-size:.88rem;color:var(--color-text); }
.assurance-card { display:flex;align-items:center;gap:.625rem;background:rgba(21,128,61,.06);border:1px solid rgba(21,128,61,.2);border-radius:.875rem;padding:.75rem 1rem;font-size:.84rem;color:#15803D; }

/* ─── Tag editor ─────────────────────────────────────────── */
.tag-section { display:flex;flex-direction:column;gap:.375rem;padding:.875rem;background:#F8FAFC;border-radius:.875rem;border:1px solid #F1F5F9; }
.tag-label { display:flex;align-items:center;gap:.35rem;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em; }
.tag-label.tag-red    { color:#DC2626; }
.tag-label.tag-blue   { color:#0284C7; }
.tag-label.tag-orange { color:#D97706; }
.tag-label.tag-purple { color:#7C3AED; }
.tag-label.tag-teal   { color:#0F766E; }
.tag-label.tag-gray   { color:#64748B; }
.tags-display { display:flex;flex-wrap:wrap;gap:.375rem;min-height:24px; }
.tag { font-size:.78rem;padding:2px 9px;border-radius:9999px;font-weight:500; }
.tag.tag-red    { background:rgba(220,38,38,.08);color:#DC2626; }
.tag.tag-blue   { background:rgba(2,132,199,.08);color:#0284C7; }
.tag.tag-orange { background:rgba(217,119,6,.08);color:#D97706; }
.tag.tag-purple { background:rgba(124,58,237,.08);color:#7C3AED; }
.tag.tag-teal   { background:rgba(15,118,110,.08);color:#0F766E; }
.tag.tag-gray   { background:rgba(100,116,139,.08);color:#64748B; }

/* ─── Timeline consultations ─────────────────────────────── */
.timeline { display:flex;flex-direction:column;gap:0;position:relative;padding-left:1.25rem; }
.timeline::before { content:'';position:absolute;left:.5rem;top:0;bottom:0;width:2px;background:#E2E8F0; }
.tl-item { position:relative;padding-bottom:1.25rem; }
.tl-dot  { position:absolute;left:-1.25rem;top:.375rem;width:10px;height:10px;border-radius:50%;background:var(--color-primary);border:2px solid white;box-shadow:0 0 0 2px var(--color-primary); }
.tl-card { background:#F8FAFC;border:1px solid #E2E8F0;border-radius:1rem;padding:1rem;transition:box-shadow .15s; }
.tl-card:hover { box-shadow:0 4px 14px rgba(0,0,0,.06); }
.tl-header { display:flex;align-items:center;gap:.625rem;flex-wrap:wrap;margin-bottom:.625rem; }
.tl-date  { display:flex;align-items:center;gap:.25rem;font-size:.75rem;font-weight:700;color:var(--color-primary); }
.tl-doc   { font-size:.75rem;color:var(--color-text-muted);flex:1; }
.tl-body  { display:flex;flex-direction:column;gap:.4rem; }
.tl-field { font-size:.83rem;color:var(--color-text);display:flex;gap:.5rem;flex-wrap:wrap; }
.tl-lbl   { font-weight:700;color:var(--color-text-muted);font-size:.75rem;white-space:nowrap;padding-top:.05rem; }
.tl-notes { background:rgba(14,159,142,.05);border-radius:.5rem;padding:.375rem .625rem; }
.ordo-mini-list { margin-top:.625rem;padding-top:.625rem;border-top:1px solid #E2E8F0;display:flex;flex-direction:column;gap:.25rem; }
.ordo-mini { display:flex;align-items:center;gap:.375rem;font-size:.78rem;color:#7C3AED; }

/* ─── Examens ────────────────────────────────────────────── */
.examens-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.875rem; }
.examen-card { background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:1rem;padding:1rem; }
.ex-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem; }
.ex-type { font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;text-transform:uppercase; }
.ex-lab     { background:rgba(14,159,142,.1);color:#0F766E; }
.ex-radio   { background:rgba(2,132,199,.1);color:#0284C7; }
.ex-echo    { background:rgba(124,58,237,.1);color:#7C3AED; }
.ex-scanner { background:rgba(245,158,11,.1);color:#D97706; }
.ex-irm     { background:rgba(220,38,38,.1);color:#DC2626; }
.ex-autre   { background:rgba(100,116,139,.1);color:#64748B; }
.ex-actions { display:flex;align-items:center;gap:.375rem; }
.ex-date { display:flex;align-items:center;gap:.2rem;font-size:.7rem;color:var(--color-text-muted); }
.ex-titre   { font-weight:700;font-size:.88rem;color:var(--color-text);margin-bottom:.375rem; }
.ex-desc    { font-size:.78rem;color:var(--color-text-muted);margin-bottom:.375rem; }
.ex-resultats { font-size:.8rem;color:var(--color-text);background:white;border-radius:.5rem;padding:.375rem .625rem;border:1px solid #E2E8F0; }

/* ─── Ordonnances ────────────────────────────────────────── */
.ordo-list { display:flex;flex-direction:column;gap:.875rem; }
.ordo-card-dos { background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:1rem;overflow:hidden; }
.oc-header { display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-bottom:1px solid #E2E8F0; }
.oc-meta { display:flex;align-items:center;gap:.3rem;font-size:.75rem;color:var(--color-text-muted); }
.oc-doc  { font-weight:600; }
.oc-statut { font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;text-transform:uppercase; }
.oc-instr { display:flex;align-items:center;gap:.3rem;font-size:.78rem;color:var(--color-text-muted);padding:.5rem 1rem;background:rgba(14,159,142,.04);border-bottom:1px solid #F1F5F9; }
.oc-meds { padding:.75rem 1rem;display:flex;flex-direction:column;gap:.4rem; }
.med-row { display:flex;align-items:center;gap:.5rem;font-size:.82rem; }
.med-bullet { width:6px;height:6px;border-radius:50%;background:#7C3AED;flex-shrink:0; }
.med-nom  { font-weight:600;color:var(--color-text); }
.med-info { color:var(--color-text-muted); }
.med-qte  { margin-left:auto;font-size:.72rem;color:var(--color-text-muted); }

/* ─── Vaccinations ───────────────────────────────────────── */
.vaccins-table-wrap { overflow-x:auto; }
.vaccins-table { width:100%;border-collapse:collapse;font-size:.83rem; }
.vaccins-table th { padding:.625rem .875rem;text-align:left;font-size:.7rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;border-bottom:1.5px solid #E2E8F0;background:#F8FAFC; }
.vaccin-row { border-bottom:1px solid #F1F5F9; }
.vaccin-row:last-child { border-bottom:none; }
.vaccin-row td { padding:.625rem .875rem;vertical-align:middle; }
.vn-nom  { font-weight:600;color:var(--color-text); }
.vn-date,.vn-notes { color:var(--color-text-muted); }

/* ─── Hospitalisations ───────────────────────────────────── */
.hospi-list { display:flex;flex-direction:column;gap:.875rem; }
.hospi-card { background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:1rem;overflow:hidden; }
.hospi-header { display:flex;align-items:center;justify-content:space-between;padding:.875rem 1rem;border-bottom:1px solid #E2E8F0; }
.hospi-dates { display:flex;flex-direction:column;gap:.15rem; }
.hospi-entry { font-size:.82rem;font-weight:600;color:var(--color-text); }
.hospi-exit  { font-size:.75rem;color:var(--color-text-muted); }
.hospi-body  { padding:.875rem 1rem;display:flex;flex-direction:column;gap:.5rem; }
.hospi-lit   { display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--color-text-muted);margin-bottom:.25rem; }
.hospi-statut { font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;text-transform:uppercase; }
.st-orange { background:rgba(245,158,11,.1);color:#D97706;border:1px solid rgba(245,158,11,.3); }
.st-green  { background:rgba(74,222,128,.1);color:#16A34A;border:1px solid rgba(74,222,128,.3); }
.st-gray   { background:rgba(148,163,184,.1);color:#64748B;border:1px solid rgba(148,163,184,.3); }
.st-red    { background:rgba(239,68,68,.1);color:#DC2626;border:1px solid rgba(239,68,68,.3); }

/* ─── RDVs ───────────────────────────────────────────────── */
.rdv-mini-list { display:flex;flex-direction:column;gap:.5rem; }
.rdv-mini-card { display:flex;align-items:center;gap:.75rem;padding:.625rem .875rem;background:#F8FAFC;border-radius:.875rem;border:1px solid #E2E8F0; }
.rdv-avenir { border-color:rgba(56,189,248,.3);background:rgba(56,189,248,.04); }
.rdv-time-dot { width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.rdv-time-blue { background:rgba(56,189,248,.12);color:#0284C7; }
.rdv-time-gray { background:#F1F5F9;color:#94A3B8; }
.rdv-mini-info { flex:1;min-width:0; }
.rdv-mini-date { font-size:.82rem;font-weight:600;color:var(--color-text); }
.rdv-mini-sub  { font-size:.72rem;color:var(--color-text-muted);margin-top:.1rem; }

/* ─── Badges ─────────────────────────────────────────────── */
.badge-pill { display:inline-flex;align-items:center;gap:.25rem;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px; }
.badge-purple { background:rgba(124,58,237,.1);color:#7C3AED;border:1px solid rgba(124,58,237,.2); }
.badge-blue   { background:rgba(56,189,248,.1);color:#0284C7;border:1px solid rgba(56,189,248,.2); }
.badge-green  { background:rgba(74,222,128,.1);color:#16A34A;border:1px solid rgba(74,222,128,.2); }
.badge-orange { background:rgba(245,158,11,.1);color:#D97706;border:1px solid rgba(245,158,11,.2); }
.badge-red    { background:rgba(239,68,68,.1);color:#DC2626;border:1px solid rgba(239,68,68,.2); }
.badge-gray   { background:#F1F5F9;color:#64748B; }

/* ─── Modal ──────────────────────────────────────────────── */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem;animation:fadeIn .2s; }
.modal-box { background:white;border-radius:1.5rem;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.18); }
.modal-sm  { max-width:480px; }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.125rem 1.375rem;border-bottom:1px solid #F1F5F9;position:sticky;top:0;background:white;z-index:1; }
.modal-titre { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text); }
.close-btn { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;padding:.25rem;border-radius:.5rem; }
.close-btn:hover { background:#F1F5F9; }
.modal-body { padding:1.25rem;display:flex;flex-direction:column;gap:.875rem; }
.modal-actions { display:flex;justify-content:flex-end;gap:.625rem;padding-top:.5rem;border-top:1px solid #F1F5F9; }
.field { display:flex;flex-direction:column;gap:.35rem; }
.field-label { font-size:.75rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em; }
.deux-cols { display:grid;grid-template-columns:1fr 1fr;gap:.75rem; }
.textarea { resize:vertical;min-height:64px; }
.input-sm { font-size:.82rem;padding:.375rem .625rem; }

/* ─── Skeleton ───────────────────────────────────────────── */
.skel-list { display:flex;flex-direction:column;gap:.375rem;flex:1; }
.skel-item { height:52px;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite; }
.spin { animation:spin 1s linear infinite; }
.fade-modal-enter-active,.fade-modal-leave-active { transition:opacity .2s; }
.fade-modal-enter-from,.fade-modal-leave-to { opacity:0; }
</style>
