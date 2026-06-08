const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seed Tropical Medical...')

  // ──────────────────────────────────────────────────────────────────────────
  // UTILISATEURS
  // ──────────────────────────────────────────────────────────────────────────
  const hash = (pwd) => bcrypt.hashSync(pwd, 10)

  const admin = await prisma.utilisateur.upsert({
    where: { email: 'admin@tropical.sn' },
    update: {},
    create: {
      nom: 'Diallo', prenom: 'Amadou', email: 'admin@tropical.sn',
      telephone: '771000001', mot_de_passe: hash('Admin123!'), role: 'ADMIN',
      preferences: { create: { langue: 'FR', theme: 'CLAIR' } },
    },
  })

  const recep = await prisma.utilisateur.upsert({
    where: { email: 'receptionniste@tropical.sn' },
    update: {},
    create: {
      nom: 'Sarr', prenom: 'Khady', email: 'receptionniste@tropical.sn',
      telephone: '771000002', mot_de_passe: hash('Recep123!'), role: 'RECEPTIONNISTE',
      preferences: { create: { langue: 'FR', theme: 'CLAIR' } },
    },
  })

  const pharma = await prisma.utilisateur.upsert({
    where: { email: 'pharmacien@tropical.sn' },
    update: {},
    create: {
      nom: 'Ndiaye', prenom: 'Moussa', email: 'pharmacien@tropical.sn',
      telephone: '771000003', mot_de_passe: hash('Pharma123!'), role: 'PHARMACIEN',
      preferences: { create: { langue: 'FR', theme: 'CLAIR' } },
    },
  })

  // Médecins (utilisateur + profil)
  const u_med1 = await prisma.utilisateur.upsert({
    where: { email: 'medecin@tropical.sn' },
    update: {},
    create: {
      nom: 'Ba', prenom: 'Ibrahima', email: 'medecin@tropical.sn',
      telephone: '771000010', mot_de_passe: hash('Medecin123!'), role: 'MEDECIN',
      preferences: { create: { langue: 'FR', theme: 'CLAIR' } },
    },
  })
  const u_med2 = await prisma.utilisateur.upsert({
    where: { email: 'fatou.diouf@tropical.sn' },
    update: {},
    create: {
      nom: 'Diouf', prenom: 'Fatou', email: 'fatou.diouf@tropical.sn',
      telephone: '771000011', mot_de_passe: hash('Medecin123!'), role: 'MEDECIN',
      preferences: { create: { langue: 'FR', theme: 'CLAIR' } },
    },
  })
  const u_med3 = await prisma.utilisateur.upsert({
    where: { email: 'cheikh.fall@tropical.sn' },
    update: {},
    create: {
      nom: 'Fall', prenom: 'Cheikh', email: 'cheikh.fall@tropical.sn',
      telephone: '771000012', mot_de_passe: hash('Medecin123!'), role: 'MEDECIN',
      preferences: { create: { langue: 'WO', theme: 'CLAIR' } },
    },
  })

  const med1 = await prisma.medecin.upsert({
    where: { utilisateurId: u_med1.id },
    update: {},
    create: { utilisateurId: u_med1.id, specialite: 'Médecine Générale', numeroOrdre: 'SN-MG-0042', consultationTarif: 5000, description: 'Médecin généraliste avec 10 ans d\'expérience' },
  })
  const med2 = await prisma.medecin.upsert({
    where: { utilisateurId: u_med2.id },
    update: {},
    create: { utilisateurId: u_med2.id, specialite: 'Pédiatrie', numeroOrdre: 'SN-PED-0017', consultationTarif: 7500, description: 'Spécialiste en santé de l\'enfant' },
  })
  const med3 = await prisma.medecin.upsert({
    where: { utilisateurId: u_med3.id },
    update: {},
    create: { utilisateurId: u_med3.id, specialite: 'Cardiologie', numeroOrdre: 'SN-CAR-0033', consultationTarif: 12000, description: 'Cardiologue interventionnel' },
  })

  // Patients (utilisateur + profil)
  const u_pat1 = await prisma.utilisateur.upsert({
    where: { email: 'patient@tropical.sn' },
    update: {},
    create: {
      nom: 'Sow', prenom: 'Mariama', email: 'patient@tropical.sn',
      telephone: '771000020', mot_de_passe: hash('Patient123!'), role: 'PATIENT',
      preferences: { create: { langue: 'FR', theme: 'CLAIR' } },
    },
  })
  const u_pat2 = await prisma.utilisateur.upsert({
    where: { email: 'ousmane.mbaye@gmail.com' },
    update: {},
    create: {
      nom: 'Mbaye', prenom: 'Ousmane', email: 'ousmane.mbaye@gmail.com',
      telephone: '771000021', mot_de_passe: hash('Patient123!'), role: 'PATIENT',
      preferences: { create: { langue: 'WO', theme: 'CLAIR' } },
    },
  })
  const u_pat3 = await prisma.utilisateur.upsert({
    where: { email: 'aissatou.sy@gmail.com' },
    update: {},
    create: {
      nom: 'Sy', prenom: 'Aissatou', email: 'aissatou.sy@gmail.com',
      telephone: '771000022', mot_de_passe: hash('Patient123!'), role: 'PATIENT',
      preferences: { create: { langue: 'FR', theme: 'SOMBRE' } },
    },
  })
  const u_pat4 = await prisma.utilisateur.upsert({
    where: { email: 'lamine.gueye@gmail.com' },
    update: {},
    create: {
      nom: 'Gueye', prenom: 'Lamine', email: 'lamine.gueye@gmail.com',
      telephone: '771000023', mot_de_passe: hash('Patient123!'), role: 'PATIENT',
      preferences: { create: { langue: 'FR', theme: 'CLAIR' } },
    },
  })

  // Assurance pour un patient
  const assurance = await prisma.assurance.create({
    data: { type: 'CNSS', organisme: 'CNSS Sénégal', numero: 'CNSS-2024-77101', tauxCouverture: 80 },
  })

  const pat1 = await prisma.patient.upsert({
    where: { utilisateurId: u_pat1.id },
    update: {},
    create: { utilisateurId: u_pat1.id, dateNaissance: new Date('1990-05-14'), sexe: 'F', adresse: 'Dakar, Plateau', groupeSanguin: 'A+', allergies: '["Pénicilline"]', antecedents: '["Hypertension"]', assuranceId: assurance.id },
  })
  const pat2 = await prisma.patient.upsert({
    where: { utilisateurId: u_pat2.id },
    update: {},
    create: { utilisateurId: u_pat2.id, dateNaissance: new Date('1985-11-22'), sexe: 'M', adresse: 'Dakar, Parcelles Assainies', groupeSanguin: 'O+', allergies: '[]', antecedents: '["Diabète type 2"]' },
  })
  const pat3 = await prisma.patient.upsert({
    where: { utilisateurId: u_pat3.id },
    update: {},
    create: { utilisateurId: u_pat3.id, dateNaissance: new Date('2001-03-08'), sexe: 'F', adresse: 'Thiès, Centre', groupeSanguin: 'B+', allergies: '[]', antecedents: '[]' },
  })
  const pat4 = await prisma.patient.upsert({
    where: { utilisateurId: u_pat4.id },
    update: {},
    create: { utilisateurId: u_pat4.id, dateNaissance: new Date('1975-07-30'), sexe: 'M', adresse: 'Saint-Louis', groupeSanguin: 'AB-', allergies: '["Aspirine"]', antecedents: '["Asthme"]' },
  })

  // ──────────────────────────────────────────────────────────────────────────
  // DOSSIERS MÉDICAUX
  // ──────────────────────────────────────────────────────────────────────────
  const dos1 = await prisma.dossierMedical.upsert({
    where: { patientId: pat1.id },
    update: {},
    create: { patientId: pat1.id, numeroDossier: 'TM-2024-0001' },
  })
  const dos2 = await prisma.dossierMedical.upsert({
    where: { patientId: pat2.id },
    update: {},
    create: { patientId: pat2.id, numeroDossier: 'TM-2024-0002' },
  })
  const dos3 = await prisma.dossierMedical.upsert({
    where: { patientId: pat3.id },
    update: {},
    create: { patientId: pat3.id, numeroDossier: 'TM-2024-0003' },
  })
  const dos4 = await prisma.dossierMedical.upsert({
    where: { patientId: pat4.id },
    update: {},
    create: { patientId: pat4.id, numeroDossier: 'TM-2024-0004' },
  })

  // ──────────────────────────────────────────────────────────────────────────
  // MÉDICAMENTS
  // ──────────────────────────────────────────────────────────────────────────
  const medicaments = await Promise.all([
    prisma.medicament.upsert({ where: { id: 1 }, update: {}, create: { nom: 'Paracétamol 500mg', dci: 'Paracétamol', forme: 'Comprimé', dosage: '500 mg', categorie: 'Antalgique', prixUnitaire: 50, stockActuel: 500, stockMinimum: 50 } }),
    prisma.medicament.upsert({ where: { id: 2 }, update: {}, create: { nom: 'Amoxicilline 500mg', dci: 'Amoxicilline', forme: 'Gélule', dosage: '500 mg', categorie: 'Antibiotique', prixUnitaire: 200, stockActuel: 200, stockMinimum: 30 } }),
    prisma.medicament.upsert({ where: { id: 3 }, update: {}, create: { nom: 'Ibuprofène 400mg', dci: 'Ibuprofène', forme: 'Comprimé', dosage: '400 mg', categorie: 'Anti-inflammatoire', prixUnitaire: 100, stockActuel: 150, stockMinimum: 20 } }),
    prisma.medicament.upsert({ where: { id: 4 }, update: {}, create: { nom: 'Metformine 850mg', dci: 'Metformine', forme: 'Comprimé', dosage: '850 mg', categorie: 'Antidiabétique', prixUnitaire: 75, stockActuel: 300, stockMinimum: 40 } }),
    prisma.medicament.upsert({ where: { id: 5 }, update: {}, create: { nom: 'Amlodipine 5mg', dci: 'Amlodipine', forme: 'Comprimé', dosage: '5 mg', categorie: 'Antihypertenseur', prixUnitaire: 150, stockActuel: 180, stockMinimum: 25 } }),
    prisma.medicament.upsert({ where: { id: 6 }, update: {}, create: { nom: 'Salbutamol spray', dci: 'Salbutamol', forme: 'Spray', dosage: '100 mcg', categorie: 'Bronchodilatateur', prixUnitaire: 1500, stockActuel: 45, stockMinimum: 10 } }),
    prisma.medicament.upsert({ where: { id: 7 }, update: {}, create: { nom: 'Chloroquine 100mg', dci: 'Chloroquine', forme: 'Comprimé', dosage: '100 mg', categorie: 'Antipaludéen', prixUnitaire: 30, stockActuel: 8, stockMinimum: 50 } }),
    prisma.medicament.upsert({ where: { id: 8 }, update: {}, create: { nom: 'Artéméther/Luméfantrine', dci: 'Artéméther + Luméfantrine', forme: 'Comprimé', dosage: '20/120 mg', categorie: 'Antipaludéen', prixUnitaire: 500, stockActuel: 120, stockMinimum: 30 } }),
    prisma.medicament.upsert({ where: { id: 9 }, update: {}, create: { nom: 'Oméprazole 20mg', dci: 'Oméprazole', forme: 'Gélule', dosage: '20 mg', categorie: 'Gastroprotecteur', prixUnitaire: 120, stockActuel: 90, stockMinimum: 20 } }),
    prisma.medicament.upsert({ where: { id: 10 }, update: {}, create: { nom: 'Vitamine C 1000mg', dci: 'Acide ascorbique', forme: 'Comprimé effervescent', dosage: '1000 mg', categorie: 'Vitamines', prixUnitaire: 80, stockActuel: 250, stockMinimum: 30 } }),
    prisma.medicament.upsert({ where: { id: 11 }, update: {}, create: { nom: 'Serum Physiologique 500ml', dci: 'Chlorure de sodium 0,9%', forme: 'Solution injectable', dosage: '0,9 %', categorie: 'Soluté', prixUnitaire: 800, stockActuel: 60, stockMinimum: 15 } }),
    prisma.medicament.upsert({ where: { id: 12 }, update: {}, create: { nom: 'Doxycycline 100mg', dci: 'Doxycycline', forme: 'Comprimé', dosage: '100 mg', categorie: 'Antibiotique', prixUnitaire: 180, stockActuel: 0, stockMinimum: 20 } }),
  ])

  // Lots de médicaments
  const now = new Date()
  const exp1 = new Date(now); exp1.setFullYear(exp1.getFullYear() + 1)
  const exp2 = new Date(now); exp2.setMonth(exp2.getMonth() + 3)
  const expPasse = new Date(now); expPasse.setMonth(expPasse.getMonth() - 1)

  const lotsExistants = await prisma.lotMedicament.count()
  if (lotsExistants === 0) {
    await prisma.lotMedicament.createMany({
      data: [
        { medicamentId: medicaments[0].id, numeroLot: 'LOT-2024-001', dateExpiration: exp1, quantite: 500, quantiteRestante: 500, fournisseur: 'Laborex Sénégal', prixAchat: 30 },
        { medicamentId: medicaments[1].id, numeroLot: 'LOT-2024-002', dateExpiration: exp1, quantite: 200, quantiteRestante: 200, fournisseur: 'COPHASE', prixAchat: 120 },
        { medicamentId: medicaments[6].id, numeroLot: 'LOT-2024-007', dateExpiration: exp2, quantite: 100, quantiteRestante: 8, fournisseur: 'Laborex Sénégal', prixAchat: 20 },
        { medicamentId: medicaments[11].id, numeroLot: 'LOT-2023-012', dateExpiration: expPasse, quantite: 50, quantiteRestante: 0, fournisseur: 'Sotrapharm', prixAchat: 100 },
      ],
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LITS
  // ──────────────────────────────────────────────────────────────────────────
  const litsDef = [
    // Étage 1 — Standard
    { numero: '101', chambre: 'Chambre 101', etage: 1, type: 'STANDARD', statut: 'LIBRE' },
    { numero: '102', chambre: 'Chambre 102', etage: 1, type: 'STANDARD', statut: 'OCCUPE' },
    { numero: '103', chambre: 'Chambre 103', etage: 1, type: 'STANDARD', statut: 'LIBRE' },
    { numero: '104', chambre: 'Chambre 104', etage: 1, type: 'STANDARD', statut: 'RESERVE' },
    { numero: '105', chambre: 'Chambre 105', etage: 1, type: 'STANDARD', statut: 'MAINTENANCE', notes: 'Révision électrique en cours' },
    { numero: '106', chambre: 'Chambre 106', etage: 1, type: 'STANDARD', statut: 'LIBRE' },
    // Étage 2 — VIP
    { numero: '201', chambre: 'Suite VIP 201', etage: 2, type: 'VIP', statut: 'LIBRE' },
    { numero: '202', chambre: 'Suite VIP 202', etage: 2, type: 'VIP', statut: 'OCCUPE' },
    { numero: '203', chambre: 'Suite VIP 203', etage: 2, type: 'VIP', statut: 'LIBRE' },
    // Étage 3 — Soins Intensifs
    { numero: '301', chambre: 'SI 301', etage: 3, type: 'SOINS_INTENSIFS', statut: 'LIBRE' },
    { numero: '302', chambre: 'SI 302', etage: 3, type: 'SOINS_INTENSIFS', statut: 'OCCUPE' },
    { numero: '303', chambre: 'SI 303', etage: 3, type: 'SOINS_INTENSIFS', statut: 'LIBRE' },
    // Maternité
    { numero: 'M01', chambre: 'Maternité M01', etage: 1, type: 'MATERNITE', statut: 'LIBRE' },
    { numero: 'M02', chambre: 'Maternité M02', etage: 1, type: 'MATERNITE', statut: 'OCCUPE' },
    { numero: 'M03', chambre: 'Maternité M03', etage: 1, type: 'MATERNITE', statut: 'LIBRE' },
  ]

  const lits = []
  for (const l of litsDef) {
    const lit = await prisma.lit.upsert({
      where: { numero: l.numero },
      update: {},
      create: l,
    })
    lits.push(lit)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDEZ-VOUS
  // ──────────────────────────────────────────────────────────────────────────
  const demain = new Date(); demain.setDate(demain.getDate() + 1); demain.setHours(9, 0, 0, 0)
  const apresmidi = new Date(); apresmidi.setDate(apresmidi.getDate() + 1); apresmidi.setHours(14, 30, 0, 0)
  const hier = new Date(); hier.setDate(hier.getDate() - 1); hier.setHours(10, 0, 0, 0)
  const dansDeuxJours = new Date(); dansDeuxJours.setDate(dansDeuxJours.getDate() + 2); dansDeuxJours.setHours(11, 0, 0, 0)

  const rdv1 = await prisma.rendezVous.create({
    data: { patientId: pat1.id, medecinId: med1.id, date: demain, type: 'PRESENTIEL', statut: 'CONFIRME', motif: 'Suivi hypertension' },
  })
  const rdv2 = await prisma.rendezVous.create({
    data: { patientId: pat2.id, medecinId: med1.id, date: apresmidi, type: 'PRESENTIEL', statut: 'EN_ATTENTE', motif: 'Contrôle diabète' },
  })
  const rdv3 = await prisma.rendezVous.create({
    data: { patientId: pat3.id, medecinId: med3.id, date: dansDeuxJours, type: 'TELECONSULTATION', statut: 'CONFIRME', motif: 'Palpitations cardiaques' },
  })
  const rdv4 = await prisma.rendezVous.create({
    data: { patientId: pat1.id, medecinId: med2.id, date: hier, type: 'PRESENTIEL', statut: 'TERMINE', motif: 'Fièvre enfant' },
  })

  // Téléconsultation pour rdv3
  const random = Math.random().toString(36).substring(2, 8)
  await prisma.teleconsultation.create({
    data: {
      rendezvousId: rdv3.id,
      medecinId: med3.id,
      urlVisio: `https://meet.jit.si/tropical-rdv-${rdv3.id}-${random}`,
      plateforme: 'JITSI',
      statut: 'PLANIFIEE',
    },
  })

  // ──────────────────────────────────────────────────────────────────────────
  // FILE D'ATTENTE
  // ──────────────────────────────────────────────────────────────────────────
  await prisma.passageFileAttente.createMany({
    data: [
      { patientId: pat1.id, medecinId: med1.id, rendezvousId: rdv1.id, niveauUrgence: 'FAIBLE', statut: 'EN_ATTENTE', motif: 'Suivi tension' },
      { patientId: pat4.id, medecinId: med1.id, niveauUrgence: 'MODERE', statut: 'EN_ATTENTE', motif: 'Douleur thoracique' },
    ],
  })

  // ──────────────────────────────────────────────────────────────────────────
  // CONSULTATION + ORDONNANCE + FACTURE
  // ──────────────────────────────────────────────────────────────────────────
  const consult1 = await prisma.consultation.create({
    data: {
      dossierId: dos1.id,
      medecinId: med1.id,
      date: hier,
      motif: 'Céphalées et fièvre',
      diagnostic: 'Paludisme simple',
      traitement: 'Artéméther/Luméfantrine 6 comprimés sur 3 jours, Paracétamol si douleur',
      examenClinique: 'Température 38,8°C, SPO2 98%, TA 120/80',
    },
  })

  const ordo1 = await prisma.ordonnance.create({
    data: {
      dossierId: dos1.id,
      consultationId: consult1.id,
      medecinNom: 'Dr. Ibrahima Ba',
      statut: 'ACTIVE',
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      instructions: 'Prendre avec un verre d\'eau. Ne pas conduire.',
      lignes: {
        create: [
          { medicamentId: medicaments[7].id, posologie: '2 comprimés matin et soir', duree: '3 jours', quantite: 6 },
          { medicamentId: medicaments[0].id, posologie: '1 comprimé si fièvre > 38,5°C', duree: '5 jours', quantite: 10 },
        ],
      },
    },
  })

  const facture1 = await prisma.facture.create({
    data: {
      patientId: pat1.id,
      consultationId: consult1.id,
      numero: 'FAC-2024-0001',
      montantTotal: 8500,
      montantAssurance: 6800,
      montantPatient: 1700,
      statut: 'PAYE',
      lignes: {
        create: [
          { description: 'Consultation médecine générale', quantite: 1, prixUnitaire: 5000, montant: 5000 },
          { description: 'Artéméther/Luméfantrine 6 cp', quantite: 6, prixUnitaire: 500, montant: 3000 },
          { description: 'Paracétamol 500mg x10', quantite: 10, prixUnitaire: 50, montant: 500 },
        ],
      },
    },
  })

  await prisma.paiement.create({
    data: {
      factureId: facture1.id,
      montant: 1700,
      mode: 'MOBILE_MONEY',
      statut: 'PAYE',
      reference: 'WV-2024-88912',
      transactionMobile: {
        create: {
          operateur: 'WAVE',
          telephone: '771000020',
          statut: 'REUSSI',
          reference: 'WV-2024-88912',
        },
      },
    },
  })

  // ──────────────────────────────────────────────────────────────────────────
  // HOSPITALISATION
  // ──────────────────────────────────────────────────────────────────────────
  const admissionDate = new Date(); admissionDate.setDate(admissionDate.getDate() - 3)
  await prisma.hospitalisation.create({
    data: {
      patientId: pat4.id,
      litId: lits[1].id, // lit 102 OCCUPE
      medecinId: med3.id,
      dateAdmission: admissionDate,
      statut: 'EN_COURS',
      motif: 'Douleur thoracique aiguë',
      diagnostic: 'Angor instable — surveillance cardio',
      coutParJour: 25000,
    },
  })

  // ──────────────────────────────────────────────────────────────────────────
  // ACTUALITÉS
  // ──────────────────────────────────────────────────────────────────────────
  await prisma.actualite.deleteMany({})
  await prisma.actualite.createMany({
    data: [
      {
        titre: 'Journée mondiale du Don de Sang — 14 juin',
        contenu: 'Le 14 juin est la Journée mondiale du don de sang. Tropical Medical organise une collecte gratuite dans ses locaux de 8h à 17h. Chaque don peut sauver jusqu\'à 3 vies. Venez nombreux ! Conditions : avoir entre 18 et 65 ans, peser au moins 50 kg, être en bonne santé. Collation offerte à tous les donneurs.',
        categorie: 'DON_SANG', publiee: true, auteurId: recep.id,
      },
      {
        titre: 'Campagne de vaccination contre le paludisme',
        contenu: 'Du 15 au 30 juin, Tropical Medical participe à la campagne nationale de prévention du paludisme. Vaccination gratuite pour les enfants de moins de 5 ans et les femmes enceintes. Apportez le carnet de santé de votre enfant. Aucun rendez-vous nécessaire, accueil de 8h à 12h du lundi au samedi.',
        categorie: 'VACCINATION', publiee: true, auteurId: recep.id,
      },
      {
        titre: 'Sensibilisation au diabète : dépistage gratuit',
        contenu: 'À l\'occasion de la semaine mondiale de sensibilisation au diabète, Tropical Medical propose un dépistage gratuit (glycémie à jeun) du 20 au 25 juin. Le diabète de type 2 touche près de 3 % des Sénégalais. Un dépistage précoce permet de mieux contrôler la maladie. Présentez-vous à jeun entre 7h et 10h.',
        categorie: 'SENSIBILISATION', publiee: true, auteurId: recep.id,
      },
      {
        titre: 'Dépistage gratuit du cancer du col de l\'utérus',
        contenu: 'Dans le cadre de la lutte contre le cancer du col de l\'utérus, Tropical Medical organise des consultations gynécologiques gratuites pour les femmes de 25 à 65 ans le samedi 28 juin de 8h à 14h. Le dépistage (frottis cervical) est indolore et prend moins de 5 minutes. Sur rendez-vous au 77 XXX XX XX.',
        categorie: 'EVENEMENT', publiee: true, auteurId: recep.id,
      },
      {
        titre: 'Hygiène des mains : adoptez les bons gestes',
        contenu: 'Le lavage des mains reste le geste barrière le plus efficace contre la transmission des maladies infectieuses. Lavez-vous les mains avec du savon pendant au moins 20 secondes : avant et après les repas, après les toilettes, après avoir toussé ou éternué, avant de toucher un nourrisson. Des distributeurs de gel hydroalcoolique sont disponibles à l\'entrée de la clinique.',
        categorie: 'SENSIBILISATION', publiee: true, auteurId: recep.id,
      },
      {
        titre: 'Formation aux premiers secours — Ouverte au public',
        contenu: 'Tropical Medical organise une session de formation aux gestes de premiers secours (massage cardiaque, position latérale de sécurité, utilisation du défibrillateur) le samedi 5 juillet de 9h à 13h. Formation gratuite, ouverte à tous. Inscription obligatoire au secrétariat ou par téléphone. Places limitées à 30 participants.',
        categorie: 'EVENEMENT', publiee: true, auteurId: recep.id,
      },
      {
        titre: 'Nouveau service : téléconsultation disponible',
        contenu: 'Désormais, consultez nos médecins depuis chez vous via notre plateforme sécurisée. Plus besoin de vous déplacer pour un avis médical ! La téléconsultation est disponible du lundi au vendredi de 8h à 18h. Connexion possible via smartphone, tablette ou ordinateur. Tarif identique à une consultation normale, paiement Mobile Money accepté.',
        categorie: 'INFO', publiee: true, auteurId: recep.id,
      },
    ],
  })

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { utilisateurId: u_pat1.id, titre: 'Rendez-vous confirmé', message: 'Votre RDV avec Dr. Ba demain à 09h00 est confirmé.', canal: 'IN_APP', statut: 'ENVOYE', lu: false },
      { utilisateurId: u_pat1.id, titre: 'Ordonnance disponible', message: 'Votre ordonnance du Dr. Ba est disponible dans votre espace patient.', canal: 'IN_APP', statut: 'ENVOYE', lu: true },
      { utilisateurId: u_med1.id, titre: 'Nouveau patient en file d\'attente', message: 'Lamine Gueye attend votre consultation (urgence modérée).', canal: 'IN_APP', statut: 'ENVOYE', lu: false },
      { utilisateurId: u_pat3.id, titre: 'Téléconsultation dans 2 jours', message: 'Votre téléconsultation avec Dr. Fall est planifiée dans 2 jours.', canal: 'IN_APP', statut: 'ENVOYE', lu: false },
    ],
  })

  console.log('Seed terminé avec succes.')
  console.log('')
  console.log('Comptes de démonstration :')
  console.log('  admin@tropical.sn         / Admin123!')
  console.log('  medecin@tropical.sn       / Medecin123!')
  console.log('  receptionniste@tropical.sn / Recep123!')
  console.log('  pharmacien@tropical.sn    / Pharma123!')
  console.log('  patient@tropical.sn       / Patient123!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
