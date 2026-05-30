#!/usr/bin/env bash
# ================================================================
#  TROPICAL MEDICAL — Script de test des nouvelles routes (v2)
#  Usage : bash test_backend.sh
# ================================================================

BASE="http://localhost:5000/api"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; }
info() { echo -e "${YELLOW}>>> $1${NC}"; }

# ----------------------------------------------------------------
# 0. Obtenir un token JWT admin
# ----------------------------------------------------------------
info "Connexion admin (amadou.diallo@tropical.sn)"
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"amadou.diallo@tropical.sn","mot_de_passe":"tropical123"}')

TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  fail "Impossible d'obtenir un token. Réponse : $LOGIN"
  exit 1
fi
ok "Token obtenu (${#TOKEN} caractères)"
echo ""

AUTH="-H \"Authorization: Bearer $TOKEN\""

# Fonction d'appel curl avec token
api() {
  local method="$1"
  local path="$2"
  local data="$3"
  if [ -n "$data" ]; then
    curl -s -X "$method" "$BASE$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -s -X "$method" "$BASE$path" \
      -H "Authorization: Bearer $TOKEN"
  fi
}

# ----------------------------------------------------------------
# 1. Profil utilisateur
# ----------------------------------------------------------------
info "TEST 1 — PUT /api/auth/profile"
RES=$(api PUT "/auth/profile" '{"nom":"Diallo","prenom":"Amadou","telephone":"776543210"}')
if echo "$RES" | grep -q "mis à jour"; then
  ok "Profil mis à jour : $RES"
else
  fail "Profil : $RES"
fi
echo ""

# ----------------------------------------------------------------
# 2. GET /api/assurances
# ----------------------------------------------------------------
info "TEST 2 — GET /api/assurances"
RES=$(api GET "/assurances")
COUNT=$(echo "$RES" | grep -o '"nom"' | wc -l)
if [ "$COUNT" -ge 1 ]; then
  ok "$COUNT assurances retournées"
  echo "$RES" | grep -o '"nom":"[^"]*"' | sed 's/"nom":"//;s/"//'
else
  fail "Assurances : $RES"
fi
echo ""

# ----------------------------------------------------------------
# 3. GET /api/medecins
# ----------------------------------------------------------------
info "TEST 3 — GET /api/medecins (avec colonnes service et teleconsult_active)"
RES=$(api GET "/medecins")
if echo "$RES" | grep -q "teleconsult_active"; then
  ok "Champ teleconsult_active présent dans la réponse"
else
  fail "teleconsult_active absent : $RES"
fi
echo ""

# ----------------------------------------------------------------
# 4. Interactions médicamenteuses
# ----------------------------------------------------------------
info "TEST 4 — POST /api/interactions (créer)"

# Récupérer deux ID de médicaments existants
MED1=$(mysql -u root tropical_medical -sNe "SELECT id_medicament FROM medicament ORDER BY id_medicament LIMIT 1;")
MED2=$(mysql -u root tropical_medical -sNe "SELECT id_medicament FROM medicament ORDER BY id_medicament LIMIT 1,1;")

if [ -z "$MED1" ] || [ -z "$MED2" ]; then
  fail "Aucun médicament en base — on saute ce test"
else
  PAYLOAD=$(printf '{"id_medicament_a":%s,"id_medicament_b":%s,"niveau":"eleve","description":"Interaction test automatique"}' "$MED1" "$MED2")
  RES=$(api POST "/interactions" "$PAYLOAD")
  if echo "$RES" | grep -q "id_interaction"; then
    ID_INTER=$(echo "$RES" | grep -o '"id_interaction":[0-9]*' | cut -d: -f2)
    ok "Interaction créée — id=$ID_INTER"

    # 4b. Checker avec ces deux médicaments
    info "TEST 4b — POST /api/interactions/checker"
    CHECKER=$(printf '{"ids_medicaments":[%s,%s]}' "$MED1" "$MED2")
    RES2=$(api POST "/interactions/checker" "$CHECKER")
    if echo "$RES2" | grep -q "bloquant"; then
      BLOQUANT=$(echo "$RES2" | grep -o '"bloquant":[a-z]*' | cut -d: -f2)
      ok "Checker OK — bloquant=$BLOQUANT"
    else
      fail "Checker : $RES2"
    fi

    # 4c. Supprimer l'interaction de test
    RES3=$(api DELETE "/interactions/$ID_INTER")
    ok "Interaction de test supprimée : $RES3"
  else
    fail "Création interaction : $RES"
  fi
fi
echo ""

# ----------------------------------------------------------------
# 5. Liste d'attente RDV (RG12)
# ----------------------------------------------------------------
info "TEST 5 — GET /api/liste-attente-rdv"
RES=$(api GET "/liste-attente-rdv")
if echo "$RES" | grep -qE '^\['; then
  COUNT=$(echo "$RES" | grep -o '"id_liste"' | wc -l)
  ok "Liste d'attente accessible — $COUNT entrées"
else
  fail "Liste d'attente : $RES"
fi
echo ""

# ----------------------------------------------------------------
# 6. Téléconsultations
# ----------------------------------------------------------------
info "TEST 6 — GET /api/teleconsultations"
RES=$(api GET "/teleconsultations")
if echo "$RES" | grep -qE '^\['; then
  COUNT=$(echo "$RES" | grep -o '"id_teleconsult"' | wc -l)
  ok "Téléconsultations accessibles — $COUNT sessions"
else
  fail "Téléconsultations : $RES"
fi
echo ""

# ----------------------------------------------------------------
# 7. Facture avec tiers-payant (RG14) — lecture des stats
# ----------------------------------------------------------------
info "TEST 7 — GET /api/factures/stats"
RES=$(api GET "/factures/stats")
if echo "$RES" | grep -q "total"; then
  ok "Stats factures OK"
  echo "  $RES"
else
  fail "Stats factures : $RES"
fi
echo ""

# ----------------------------------------------------------------
# 8. Patients — numéro dossier
# ----------------------------------------------------------------
info "TEST 8 — Numéro dossier patient (BDD)"
RESULT=$(mysql -u root tropical_medical -sNe \
  "SELECT id_patient, numero_dossier FROM patient LIMIT 5;")
if [ -n "$RESULT" ]; then
  ok "Numéros de dossier :"
  echo "$RESULT" | while IFS=$'\t' read -r id num; do
    echo "  Patient $id → ${num:-NON GÉNÉRÉ}"
  done
else
  fail "Aucun patient trouvé"
fi
echo ""

# ----------------------------------------------------------------
# 9. Vérification de la table assurance dans la BDD
# ----------------------------------------------------------------
info "TEST 9 — Tables nouvelles en BDD"
TABLES=$(mysql -u root tropical_medical -sNe \
  "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_SCHEMA='tropical_medical'
   AND TABLE_NAME IN ('assurance','interaction_medicamenteuse','teleconsultation','liste_attente_rdv')
   ORDER BY TABLE_NAME;")
EXPECTED=4
COUNT=$(echo "$TABLES" | wc -l)
if [ "$COUNT" -eq "$EXPECTED" ]; then
  ok "Les 4 nouvelles tables existent : $(echo $TABLES | tr '\n' ' ')"
else
  fail "Seulement $COUNT/4 tables trouvées : $TABLES"
fi
echo ""

# ----------------------------------------------------------------
# Résumé
# ----------------------------------------------------------------
echo -e "${GREEN}==============================${NC}"
echo -e "${GREEN}  Tests terminés.${NC}"
echo -e "${GREEN}==============================${NC}"
