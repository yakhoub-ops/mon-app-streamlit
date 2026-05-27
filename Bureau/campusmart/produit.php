<?php
require_once 'includes/config.php';
session_start_safe();

if (!est_connecte()) redirect('connexion.php');

$user = utilisateur_connecte();
$id   = (int)($_GET['id'] ?? 0);
if (!$id) redirect('index.php');

$stmt = db()->prepare('SELECT p.*, u.nom AS vendeur_nom, u.note_moyenne, u.nb_avis, u.universite, u.telephone
                       FROM produits p JOIN utilisateurs u ON p.id_vendeur = u.id
                       WHERE p.id = ? AND p.statut != "supprime"');
$stmt->execute([$id]);
$p = $stmt->fetch();
if (!$p) redirect('index.php');

// Traitement commande
$msg_cmd = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['commander'])) {
    $qte = max(1, (int)($_POST['quantite'] ?? 1));
    if ($p['statut'] === 'epuise') {
        $msg_cmd = 'error:Ce produit est épuisé.';
    } elseif ($p['id_vendeur'] === $user['id']) {
        $msg_cmd = 'error:Vous ne pouvez pas acheter votre propre produit.';
    } elseif ($qte > $p['stock']) {
        $msg_cmd = 'error:Stock insuffisant (' . $p['stock'] . ' disponibles).';
    } else {
        $total = $p['prix'] * $qte;
        $ins = db()->prepare('INSERT INTO commandes (id_produit, id_acheteur, id_vendeur, quantite, prix_total) VALUES (?,?,?,?,?)');
        $ins->execute([$p['id'], $user['id'], $p['id_vendeur'], $qte, $total]);
        $msg_cmd = 'success:Commande passée avec succès !';
        // Recharger le produit pour avoir le stock mis à jour
        $stmt->execute([$id]);
        $p = $stmt->fetch();
    }
}

$icones_cat = [
    'Livres'=>'ti-book','Habits'=>'ti-shirt','Tech'=>'ti-device-laptop',
    'Alimentaire'=>'ti-apple','Services'=>'ti-tool','Autre'=>'ti-dots'
];
$page_title = htmlspecialchars($p['titre']) . ' — CampusMart';
include 'includes/header.php';
?>

<div style="max-width:600px;margin:0 auto;">
    <!-- Bouton retour -->
    <div style="padding:10px 12px;background:#fff;border-bottom:1px solid #e8eaed;display:flex;align-items:center;gap:8px;">
        <a href="javascript:history.back()" style="color:var(--green);font-size:1.3rem;display:flex;align-items:center;">
            <i class="ti ti-arrow-left"></i>
        </a>
        <span style="font-weight:600;font-size:.95rem;"><?= htmlspecialchars($p['titre']) ?></span>
    </div>

    <!-- Image -->
    <?php if ($p['photo'] && file_exists('uploads/'.$p['photo'])): ?>
    <img src="uploads/<?= htmlspecialchars($p['photo']) ?>" class="detail-img" alt="<?= htmlspecialchars($p['titre']) ?>">
    <?php else: ?>
    <div class="detail-img-placeholder">
        <i class="ti <?= $icones_cat[$p['categorie']] ?? 'ti-package' ?>" style="color:var(--green)"></i>
    </div>
    <?php endif; ?>

    <div class="detail-body">
        <?php
        [$type_msg, $texte_msg] = $msg_cmd ? explode(':', $msg_cmd, 2) : [null, null];
        if ($type_msg): ?>
        <div class="alert alert-<?= $type_msg === 'success' ? 'success' : 'error' ?>" style="margin-bottom:12px">
            <?= htmlspecialchars($texte_msg) ?>
        </div>
        <?php endif; ?>

        <div class="flex-between" style="margin-bottom:8px">
            <div>
                <div class="detail-title"><?= htmlspecialchars($p['titre']) ?></div>
                <span style="font-size:.78rem;background:var(--green-light);color:var(--green-dark);padding:2px 10px;border-radius:10px;font-weight:600">
                    <i class="ti <?= $icones_cat[$p['categorie']] ?? 'ti-dots' ?>"></i>
                    <?= $p['categorie'] ?>
                </span>
            </div>
            <div class="detail-price"><?= number_format($p['prix'], 0, ',', ' ') ?> FCFA</div>
        </div>

        <?php if ($p['description']): ?>
        <p style="font-size:.88rem;color:var(--gray-mid);line-height:1.5;margin:10px 0"><?= nl2br(htmlspecialchars($p['description'])) ?></p>
        <?php endif; ?>

        <div style="display:flex;align-items:center;gap:8px;font-size:.83rem;margin:8px 0">
            <i class="ti ti-package" style="color:var(--green)"></i>
            <?php if ($p['statut'] === 'epuise'): ?>
            <span class="product-badge badge-epuise"><i class="ti ti-x"></i> Épuisé</span>
            <?php else: ?>
            <span style="color:var(--green);font-weight:600"><?= $p['stock'] ?> en stock</span>
            <?php endif; ?>
        </div>

        <!-- Vendeur -->
        <div class="detail-seller">
            <div class="avatar-md"><?= initiales($p['vendeur_nom']) ?></div>
            <div style="flex:1">
                <div style="font-weight:600;font-size:.9rem"><?= htmlspecialchars($p['vendeur_nom']) ?></div>
                <div style="font-size:.78rem;color:var(--gray-mid)">
                    <i class="ti ti-school"></i> <?= htmlspecialchars($p['universite']) ?>
                </div>
                <div style="font-size:.8rem;margin-top:2px">
                    <?= etoiles($p['note_moyenne']) ?>
                    <span style="color:var(--gray-mid);font-size:.75rem">(<?= $p['nb_avis'] ?> avis)</span>
                </div>
            </div>
            <a href="profil.php?id=<?= $p['id_vendeur'] ?>"
               style="font-size:.78rem;color:var(--green);font-weight:600">Voir profil</a>
        </div>

        <!-- Actions -->
        <?php if ($p['id_vendeur'] !== $user['id']): ?>
        <?php if ($p['statut'] !== 'epuise'): ?>
        <form method="POST" id="form-cmd">
            <div style="display:flex;align-items:center;gap:12px;margin:12px 0">
                <span style="font-size:.88rem;font-weight:600">Quantité :</span>
                <div class="qty-control">
                    <button type="button" class="qty-btn" onclick="changeQty(-1)">
                        <i class="ti ti-minus"></i>
                    </button>
                    <span class="qty-val" id="qty-val">1</span>
                    <input type="hidden" name="quantite" id="qty-input" value="1">
                    <button type="button" class="qty-btn" onclick="changeQty(1)">
                        <i class="ti ti-plus"></i>
                    </button>
                </div>
            </div>
            <div class="detail-actions">
                <button type="submit" name="commander" class="btn btn-green">
                    <i class="ti ti-shopping-cart-plus"></i> Commander
                </button>
                <a href="messages.php?destinataire=<?= $p['id_vendeur'] ?>&produit=<?= $p['id'] ?>"
                   class="btn btn-outline">
                    <i class="ti ti-message-circle"></i> Contacter
                </a>
            </div>
        </form>
        <?php else: ?>
        <div class="detail-actions">
            <a href="messages.php?destinataire=<?= $p['id_vendeur'] ?>&produit=<?= $p['id'] ?>"
               class="btn btn-outline btn-full">
                <i class="ti ti-message-circle"></i> Contacter le vendeur
            </a>
        </div>
        <?php endif; ?>
        <?php else: ?>
        <div style="text-align:center;padding:14px;background:var(--green-light);border-radius:var(--radius);color:var(--green-dark);font-size:.88rem;margin-top:12px">
            <i class="ti ti-info-circle"></i> C'est votre produit.
            <a href="mes-ventes.php" style="font-weight:600;color:var(--green)">Gérer mes ventes</a>
        </div>
        <?php endif; ?>
    </div>
</div>

<script>
const MAX_QTE = <?= (int)$p['stock'] ?>;
let qty = 1;
function changeQty(delta) {
    qty = Math.max(1, Math.min(MAX_QTE, qty + delta));
    document.getElementById('qty-val').textContent   = qty;
    document.getElementById('qty-input').value = qty;
}
</script>

<?php include 'includes/footer.php'; ?>
