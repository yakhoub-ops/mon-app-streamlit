<?php
require_once 'includes/config.php';
session_start_safe();

if (!est_connecte()) redirect('connexion.php');

$user = utilisateur_connecte();

// Actions rapides
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $pid    = (int)($_POST['pid'] ?? 0);

    if ($action === 'supprimer' && $pid) {
        $stmt = db()->prepare('SELECT photo FROM produits WHERE id=? AND id_vendeur=?');
        $stmt->execute([$pid, $user['id']]);
        $p = $stmt->fetch();
        if ($p) {
            if ($p['photo'] && file_exists(UPLOAD_DIR . $p['photo'])) unlink(UPLOAD_DIR . $p['photo']);
            db()->prepare('UPDATE produits SET statut="supprime" WHERE id=? AND id_vendeur=?')->execute([$pid, $user['id']]);
        }
    }

    if ($action === 'maj_statut_cmd') {
        $cid     = (int)($_POST['cid']    ?? 0);
        $statut  = $_POST['statut']       ?? '';
        $allowed = ['en_attente','confirme','livre','annule'];
        if (in_array($statut, $allowed) && $cid) {
            db()->prepare('UPDATE commandes SET statut=? WHERE id=? AND id_vendeur=?')
                ->execute([$statut, $cid, $user['id']]);
        }
    }

    redirect('mes-ventes.php');
}

// Stats
$st = db()->prepare('SELECT
    COUNT(*)                                           AS nb_produits,
    COALESCE(SUM(CASE WHEN statut="actif"  THEN 1 ELSE 0 END),0) AS nb_actifs,
    COALESCE(SUM(CASE WHEN statut="epuise" THEN 1 ELSE 0 END),0) AS nb_epuises
    FROM produits WHERE id_vendeur=? AND statut != "supprime"');
$st->execute([$user['id']]);
$stats = $st->fetch();

$stv = db()->prepare("SELECT COUNT(*) AS nb_ventes, COALESCE(SUM(prix_total),0) AS chiffre
                      FROM commandes WHERE id_vendeur=? AND statut != 'annule'");
$stv->execute([$user['id']]);
$stats_ventes = $stv->fetch();

// Mes produits
$stmt = db()->prepare('SELECT * FROM produits WHERE id_vendeur=? AND statut != "supprime" ORDER BY date DESC');
$stmt->execute([$user['id']]);
$produits = $stmt->fetchAll();

// Commandes reçues
$stmt2 = db()->prepare('SELECT c.*, p.titre AS produit_titre, p.photo AS produit_photo,
                                u.nom AS acheteur_nom, u.telephone AS acheteur_tel
                         FROM commandes c
                         JOIN produits p     ON c.id_produit  = p.id
                         JOIN utilisateurs u ON c.id_acheteur = u.id
                         WHERE c.id_vendeur = ?
                         ORDER BY c.date DESC
                         LIMIT 50');
$stmt2->execute([$user['id']]);
$commandes = $stmt2->fetchAll();

$icones_cat = ['Livres'=>'ti-book','Habits'=>'ti-shirt','Tech'=>'ti-device-laptop','Alimentaire'=>'ti-apple','Services'=>'ti-tool','Autre'=>'ti-dots'];
$page_title = 'Mes ventes — CampusMart';
include 'includes/header.php';
?>

<!-- En-tête page -->
<div class="ventes-header">
    <h2><i class="ti ti-package"></i> Mes ventes</h2>
    <a href="publier.php" class="btn btn-green" style="padding:8px 14px;font-size:.85rem">
        <i class="ti ti-circle-plus"></i> Publier
    </a>
</div>

<div style="max-width:600px;margin:0 auto;">

    <!-- Stats -->
    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-val"><?= $stats['nb_produits'] ?></div>
            <div class="stat-lbl"><i class="ti ti-package"></i> Produits</div>
        </div>
        <div class="stat-card">
            <div class="stat-val"><?= $stats_ventes['nb_ventes'] ?></div>
            <div class="stat-lbl"><i class="ti ti-shopping-bag"></i> Ventes</div>
        </div>
        <div class="stat-card">
            <div class="stat-val"><?= number_format($stats_ventes['chiffre'], 0, ',', ' ') ?></div>
            <div class="stat-lbl"><i class="ti ti-cash"></i> FCFA</div>
        </div>
    </div>

    <!-- Mes produits -->
    <div style="padding:0 12px 4px">
        <div class="section-title"><i class="ti ti-layout-list"></i> Mes produits (<?= count($produits) ?>)</div>
    </div>

    <?php if (empty($produits)): ?>
    <div class="empty-state" style="padding:30px 20px">
        <div class="empty-icon"><i class="ti ti-package-off" style="font-size:3rem;color:var(--gray-mid)"></i></div>
        <h3>Aucun produit</h3>
        <p>Commencez à vendre en publiant votre premier produit.</p>
        <a href="publier.php" class="btn btn-green" style="margin-top:14px">
            <i class="ti ti-circle-plus"></i> Publier un produit
        </a>
    </div>
    <?php else: ?>
    <div style="padding:0 12px">
        <?php foreach ($produits as $p): ?>
        <div class="product-list-item">
            <?php if ($p['photo'] && file_exists('uploads/'.$p['photo'])): ?>
            <img src="uploads/<?= htmlspecialchars($p['photo']) ?>" class="product-list-thumb" alt="">
            <?php else: ?>
            <div class="product-list-thumb-placeholder">
                <i class="ti <?= $icones_cat[$p['categorie']] ?? 'ti-package' ?>" style="color:var(--green)"></i>
            </div>
            <?php endif; ?>
            <div class="product-list-info">
                <h4><?= htmlspecialchars($p['titre']) ?></h4>
                <div style="display:flex;gap:10px;font-size:.8rem;color:var(--gray-mid)">
                    <span><i class="ti ti-currency-dollar"></i> <?= number_format($p['prix'],0,',',' ') ?> FCFA</span>
                    <span><i class="ti ti-stack-2"></i> <?= $p['stock'] ?> en stock</span>
                </div>
                <span class="product-badge <?= $p['statut'] === 'epuise' ? 'badge-epuise' : 'badge-actif' ?>">
                    <i class="ti <?= $p['statut'] === 'epuise' ? 'ti-x' : 'ti-check' ?>"></i>
                    <?= $p['statut'] === 'epuise' ? 'Épuisé' : 'Actif' ?>
                </span>
                <div class="product-list-actions">
                    <a href="publier.php?mode=modifier&id=<?= $p['id'] ?>" class="btn btn-outline btn-xs">
                        <i class="ti ti-pencil"></i> Modifier
                    </a>
                    <form method="POST" style="display:inline" onsubmit="return confirm('Supprimer ce produit ?')">
                        <input type="hidden" name="action" value="supprimer">
                        <input type="hidden" name="pid"    value="<?= $p['id'] ?>">
                        <button type="submit" class="btn btn-red btn-xs">
                            <i class="ti ti-trash"></i> Supprimer
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- Commandes reçues -->
    <div style="padding:0 12px 4px;margin-top:10px">
        <div class="section-title"><i class="ti ti-shopping-bag"></i> Commandes reçues (<?= count($commandes) ?>)</div>
    </div>

    <?php if (empty($commandes)): ?>
    <div class="empty-state" style="padding:20px">
        <i class="ti ti-shopping-bag-x" style="font-size:2.5rem;color:var(--gray-mid)"></i>
        <p style="margin-top:8px">Aucune commande pour l'instant.</p>
    </div>
    <?php else: ?>
    <div style="padding:0 12px">
        <?php foreach ($commandes as $c): ?>
        <div class="commande-item">
            <div class="commande-header">
                <div>
                    <div style="font-weight:600;font-size:.9rem"><?= htmlspecialchars($c['produit_titre']) ?></div>
                    <div style="font-size:.8rem;color:var(--gray-mid)">
                        <i class="ti ti-user"></i> <?= htmlspecialchars($c['acheteur_nom']) ?>
                        &nbsp;·&nbsp;
                        <i class="ti ti-phone"></i> <?= htmlspecialchars($c['acheteur_tel']) ?>
                    </div>
                    <div style="font-size:.78rem;color:var(--gray-mid);margin-top:2px">
                        <i class="ti ti-calendar"></i> <?= formater_date($c['date']) ?>
                        &nbsp;·&nbsp;
                        <i class="ti ti-stack-2"></i> <?= $c['quantite'] ?> unité(s)
                        &nbsp;·&nbsp;
                        <strong><?= number_format($c['prix_total'],0,',',' ') ?> FCFA</strong>
                    </div>
                </div>
                <span class="commande-statut statut-<?= $c['statut'] ?>">
                    <?= ucfirst(str_replace('_',' ', $c['statut'])) ?>
                </span>
            </div>
            <div class="commande-actions">
                <?php
                $transitions = [
                    'en_attente' => ['confirme' => ['ti-check','Confirmer','btn-green'],   'annule' => ['ti-x','Annuler','btn-red']],
                    'confirme'   => ['livre'    => ['ti-truck','Marquer livré','btn-green'],'annule' => ['ti-x','Annuler','btn-red']],
                ];
                if (isset($transitions[$c['statut']])):
                    foreach ($transitions[$c['statut']] as $nv_statut => [$ico, $lbl, $cls]): ?>
                <form method="POST" style="display:inline">
                    <input type="hidden" name="action"  value="maj_statut_cmd">
                    <input type="hidden" name="cid"     value="<?= $c['id'] ?>">
                    <input type="hidden" name="statut"  value="<?= $nv_statut ?>">
                    <button type="submit" class="btn <?= $cls ?> btn-xs">
                        <i class="ti <?= $ico ?>"></i> <?= $lbl ?>
                    </button>
                </form>
                    <?php endforeach;
                endif; ?>
                <a href="messages.php?destinataire=<?= $c['id_acheteur'] ?>" class="btn btn-outline btn-xs">
                    <i class="ti ti-message-circle"></i> Message
                </a>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
