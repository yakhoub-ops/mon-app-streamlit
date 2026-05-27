<?php
require_once 'includes/config.php';
session_start_safe();

if (!est_connecte()) redirect('connexion.php');

$moi = utilisateur_connecte();

// Profil à afficher (le sien ou celui d'un autre)
$pid  = (int)($_GET['id'] ?? $moi['id']);
$stmt = db()->prepare('SELECT * FROM utilisateurs WHERE id = ?');
$stmt->execute([$pid]);
$profil = $stmt->fetch();
if (!$profil) redirect('index.php');

$est_moi = ($profil['id'] === $moi['id']);

// Traitement : déconnexion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['deconnexion'])) {
    session_destroy();
    redirect('connexion.php');
}

// Traitement : modifier profil (le sien seulement)
$erreur = ''; $succes = '';
if ($est_moi && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['modifier_profil'])) {
    $nom  = trim($_POST['nom']         ?? '');
    $univ = trim($_POST['universite']  ?? '');
    $tel  = trim($_POST['telephone']   ?? '');
    if (!$nom || !$univ || !$tel) {
        $erreur = 'Champs obligatoires manquants.';
    } else {
        $photo = $profil['photo'];
        if (!empty($_FILES['photo']['name'])) {
            $r = upload_image($_FILES['photo'], 'avatar');
            if ($r) {
                if ($photo && file_exists(UPLOAD_DIR.$photo)) unlink(UPLOAD_DIR.$photo);
                $photo = $r;
            }
        }
        db()->prepare('UPDATE utilisateurs SET nom=?, universite=?, telephone=?, photo=? WHERE id=?')
            ->execute([$nom, $univ, $tel, $photo, $moi['id']]);
        $succes = 'Profil mis à jour.';
        $stmt->execute([$pid]);
        $profil = $stmt->fetch();
    }
}

// Traitement : soumettre un avis
if (!$est_moi && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['soumettre_avis'])) {
    $note = (int)($_POST['note'] ?? 0);
    $comm = trim($_POST['commentaire'] ?? '');
    if ($note >= 1 && $note <= 5) {
        $ins = db()->prepare('INSERT INTO avis (id_auteur, id_cible, note, commentaire) VALUES (?,?,?,?)
                              ON DUPLICATE KEY UPDATE note=VALUES(note), commentaire=VALUES(commentaire), date=NOW()');
        $ins->execute([$moi['id'], $profil['id'], $note, $comm]);
        $succes = 'Avis enregistré !';
        $stmt->execute([$pid]);
        $profil = $stmt->fetch();
    }
}

// Stats
$s1 = db()->prepare("SELECT COUNT(*) FROM produits  WHERE id_vendeur=? AND statut != 'supprime'");
$s1->execute([$profil['id']]); $nb_produits = (int)$s1->fetchColumn();

$s2 = db()->prepare("SELECT COUNT(*) FROM commandes WHERE id_vendeur=?  AND statut='livre'");
$s2->execute([$profil['id']]); $nb_ventes = (int)$s2->fetchColumn();

$s3 = db()->prepare("SELECT COUNT(*) FROM commandes WHERE id_acheteur=? AND statut='livre'");
$s3->execute([$profil['id']]); $nb_achats = (int)$s3->fetchColumn();

// Avis reçus
$stmt3 = db()->prepare('SELECT a.*, u.nom AS auteur_nom FROM avis a JOIN utilisateurs u ON a.id_auteur = u.id WHERE a.id_cible=? ORDER BY a.date DESC');
$stmt3->execute([$profil['id']]);
$avis_liste = $stmt3->fetchAll();

// Mon avis existant
$mon_avis = null;
if (!$est_moi) {
    $sa = db()->prepare('SELECT * FROM avis WHERE id_auteur=? AND id_cible=?');
    $sa->execute([$moi['id'], $profil['id']]);
    $mon_avis = $sa->fetch();
}

// Produits du profil
$stmt4 = db()->prepare("SELECT * FROM produits WHERE id_vendeur=? AND statut='actif' ORDER BY date DESC LIMIT 6");
$stmt4->execute([$profil['id']]);
$produits_profil = $stmt4->fetchAll();

$icones_cat = ['Livres'=>'ti-book','Habits'=>'ti-shirt','Tech'=>'ti-device-laptop','Alimentaire'=>'ti-apple','Services'=>'ti-tool','Autre'=>'ti-dots'];
$page_title = $profil['nom'] . ' — CampusMart';
include 'includes/header.php';
?>

<div style="max-width:600px;margin:0 auto;">

    <!-- Hero profil -->
    <div class="profil-hero">
        <?php if ($profil['photo'] && file_exists('uploads/'.$profil['photo'])): ?>
        <img src="uploads/<?= htmlspecialchars($profil['photo']) ?>"
             style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.5);margin:0 auto 10px"
             alt="Avatar">
        <?php else: ?>
        <div class="avatar-lg"><?= initiales($profil['nom']) ?></div>
        <?php endif; ?>
        <h2><?= htmlspecialchars($profil['nom']) ?></h2>
        <div class="univ"><i class="ti ti-school"></i> <?= htmlspecialchars($profil['universite']) ?></div>
        <div class="univ"><i class="ti ti-phone"></i> <?= htmlspecialchars($profil['telephone']) ?></div>
        <div class="profil-stars">
            <?= etoiles($profil['note_moyenne']) ?>
            <span style="font-size:.8rem;opacity:.85">(<?= $profil['nb_avis'] ?> avis)</span>
        </div>
        <div style="font-size:.85rem;margin-top:4px;opacity:.85">
            Membre depuis <?= date('M Y', strtotime($profil['date_inscription'])) ?>
        </div>
    </div>

    <!-- Stats -->
    <div class="profil-stats">
        <div class="profil-stat">
            <div class="val"><?= $nb_produits ?></div>
            <div class="lbl"><i class="ti ti-package"></i> Produits</div>
        </div>
        <div class="profil-stat">
            <div class="val"><?= $nb_ventes ?></div>
            <div class="lbl"><i class="ti ti-shopping-bag"></i> Ventes</div>
        </div>
        <div class="profil-stat">
            <div class="val"><?= $nb_achats ?></div>
            <div class="lbl"><i class="ti ti-shopping-cart"></i> Achats</div>
        </div>
    </div>

    <?php if ($erreur): ?><div class="alert alert-error" style="margin:0 12px 10px"><?= htmlspecialchars($erreur) ?></div><?php endif; ?>
    <?php if ($succes): ?><div class="alert alert-success" style="margin:0 12px 10px"><?= htmlspecialchars($succes) ?></div><?php endif; ?>

    <!-- Boutons actions (visiteur) -->
    <?php if (!$est_moi): ?>
    <div style="padding:12px;display:flex;gap:10px">
        <a href="messages.php?destinataire=<?= $profil['id'] ?>" class="btn btn-green" style="flex:1">
            <i class="ti ti-message-circle"></i> Envoyer un message
        </a>
    </div>
    <?php endif; ?>

    <!-- Produits du profil -->
    <?php if (!empty($produits_profil)): ?>
    <div class="section-title"><i class="ti ti-layout-grid"></i> Produits en vente</div>
    <div class="products-grid" style="padding:8px 12px">
        <?php foreach ($produits_profil as $p): ?>
        <a href="produit.php?id=<?= $p['id'] ?>" class="product-card">
            <?php if ($p['photo'] && file_exists('uploads/'.$p['photo'])): ?>
            <img src="uploads/<?= htmlspecialchars($p['photo']) ?>" class="product-img" alt="">
            <?php else: ?>
            <div class="product-img-placeholder">
                <i class="ti <?= $icones_cat[$p['categorie']] ?? 'ti-package' ?>" style="font-size:2rem;color:var(--green)"></i>
            </div>
            <?php endif; ?>
            <div class="product-info">
                <div class="product-name"><?= htmlspecialchars($p['titre']) ?></div>
                <div class="product-price"><?= number_format($p['prix'],0,',',' ') ?> FCFA</div>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- Laisser un avis (visiteur) -->
    <?php if (!$est_moi): ?>
    <div class="section-title"><i class="ti ti-star"></i> <?= $mon_avis ? 'Mon avis' : 'Laisser un avis' ?></div>
    <div class="card" style="margin:0 12px 12px">
        <form method="POST">
            <div style="margin-bottom:10px">
                <div style="font-size:.85rem;color:var(--gray-mid);margin-bottom:6px">Note</div>
                <div class="star-selector" id="star-selector">
                    <?php for ($i = 1; $i <= 5; $i++): ?>
                    <i class="ti star-pick <?= ($mon_avis && $mon_avis['note'] >= $i) ? 'ti-star-filled on' : 'ti-star' ?>"
                       data-val="<?= $i ?>"
                       onclick="pickStar(<?= $i ?>)"
                       style="font-size:1.6rem;cursor:pointer;color:<?= ($mon_avis && $mon_avis['note'] >= $i) ? 'var(--orange)' : '#ddd' ?>"></i>
                    <?php endfor; ?>
                </div>
                <input type="hidden" name="note" id="star-input" value="<?= $mon_avis['note'] ?? 0 ?>">
            </div>
            <div class="form-group" style="margin-bottom:10px">
                <textarea name="commentaire" class="form-control" rows="2"
                          placeholder="Commentaire (optionnel)..."><?= htmlspecialchars($mon_avis['commentaire'] ?? '') ?></textarea>
            </div>
            <button type="submit" name="soumettre_avis" class="btn btn-green btn-full">
                <i class="ti ti-star-filled"></i> <?= $mon_avis ? 'Modifier mon avis' : 'Soumettre' ?>
            </button>
        </form>
    </div>
    <?php endif; ?>

    <!-- Liste des avis reçus -->
    <div class="section-title">
        <i class="ti ti-star-filled" style="color:var(--orange)"></i>
        Avis reçus (<?= count($avis_liste) ?>)
    </div>
    <?php if (empty($avis_liste)): ?>
    <div style="text-align:center;padding:20px;color:var(--gray-mid);font-size:.85rem">
        <i class="ti ti-mood-happy" style="font-size:2rem;display:block;margin-bottom:6px"></i>
        Aucun avis pour l'instant.
    </div>
    <?php else: ?>
    <div style="padding:0 12px">
        <?php foreach ($avis_liste as $a): ?>
        <div class="avis-item">
            <div class="avis-header">
                <div class="flex-center gap-8">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.75rem;flex-shrink:0">
                        <?= initiales($a['auteur_nom']) ?>
                    </div>
                    <div>
                        <div class="avis-auteur"><?= htmlspecialchars($a['auteur_nom']) ?></div>
                        <div class="avis-date"><i class="ti ti-calendar" style="font-size:.7rem"></i> <?= formater_date($a['date']) ?></div>
                    </div>
                </div>
                <div class="avis-stars">
                    <?php for ($i=1; $i<=5; $i++): ?>
                    <i class="ti <?= $i <= $a['note'] ? 'ti-star-filled' : 'ti-star' ?>" style="color:<?= $i <= $a['note'] ? 'var(--orange)' : '#ddd' ?>"></i>
                    <?php endfor; ?>
                </div>
            </div>
            <?php if ($a['commentaire']): ?>
            <p style="font-size:.85rem;color:var(--gray-mid);line-height:1.4"><?= htmlspecialchars($a['commentaire']) ?></p>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- Modifier profil (le sien) -->
    <?php if ($est_moi): ?>
    <div class="section-title"><i class="ti ti-settings"></i> Mon compte</div>
    <div class="card" style="margin:0 12px 12px">
        <form method="POST" enctype="multipart/form-data">
            <div class="form-group">
                <label><i class="ti ti-user"></i> Nom complet</label>
                <input type="text" name="nom" class="form-control" value="<?= htmlspecialchars($profil['nom']) ?>" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="ti ti-school"></i> Université</label>
                    <input type="text" name="universite" class="form-control" value="<?= htmlspecialchars($profil['universite']) ?>" required>
                </div>
                <div class="form-group">
                    <label><i class="ti ti-phone"></i> Téléphone</label>
                    <input type="tel" name="telephone" class="form-control" value="<?= htmlspecialchars($profil['telephone']) ?>" required>
                </div>
            </div>
            <div class="form-group">
                <label><i class="ti ti-camera"></i> Photo de profil</label>
                <input type="file" name="photo" class="form-control" accept="image/*">
            </div>
            <button type="submit" name="modifier_profil" class="btn btn-green btn-full">
                <i class="ti ti-check"></i> Enregistrer
            </button>
        </form>
    </div>

    <div style="padding:0 12px 12px">
        <form method="POST" onsubmit="return confirm('Se déconnecter ?')">
            <button type="submit" name="deconnexion" class="btn btn-red btn-full">
                <i class="ti ti-logout"></i> Se déconnecter
            </button>
        </form>
    </div>
    <?php endif; ?>

</div>

<script>
function pickStar(n) {
    document.getElementById('star-input').value = n;
    document.querySelectorAll('.star-pick').forEach((s, i) => {
        const filled = i < n;
        s.style.color = filled ? 'var(--orange)' : '#ddd';
        s.className = s.className.replace(/ti-star(-filled)?/, filled ? 'ti-star-filled' : 'ti-star');
    });
}
</script>

<?php include 'includes/footer.php'; ?>
