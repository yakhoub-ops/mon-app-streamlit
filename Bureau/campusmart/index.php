<?php
require_once 'includes/config.php';
session_start_safe();

if (!est_connecte()) redirect('connexion.php');

$user       = utilisateur_connecte();
$page_title = 'CampusMart — Accueil';

$search = trim($_GET['q']         ?? '');
$cat    = trim($_GET['categorie'] ?? '');

$cats = ['Tout','Livres','Habits','Tech','Alimentaire','Services','Autre'];

// Requête produits
$sql    = 'SELECT p.*, u.nom AS vendeur_nom, u.note_moyenne, u.universite
           FROM produits p
           JOIN utilisateurs u ON p.id_vendeur = u.id
           WHERE p.statut != "supprime"
             AND p.id_vendeur != ?';
$params = [$user['id']];

if ($search) {
    $sql .= ' AND (p.titre LIKE ? OR p.description LIKE ?)';
    $params[] = "%$search%";
    $params[] = "%$search%";
}
if ($cat && $cat !== 'Tout') {
    $sql .= ' AND p.categorie = ?';
    $params[] = $cat;
}

$sql .= ' ORDER BY p.date DESC';

$stmt = db()->prepare($sql);
$stmt->execute($params);
$produits = $stmt->fetchAll();

$icones_cat = [
    'Tout'        => 'ti-layout-grid',
    'Livres'      => 'ti-book',
    'Habits'      => 'ti-shirt',
    'Tech'        => 'ti-device-laptop',
    'Alimentaire' => 'ti-apple',
    'Services'    => 'ti-tool',
    'Autre'       => 'ti-dots',
];

include 'includes/header.php';
?>

<!-- Barre de recherche -->
<div class="search-bar">
    <form method="GET" action="index.php" style="flex:1;display:flex;align-items:center;gap:8px;">
        <div class="search-wrap" style="flex:1">
            <i class="ti ti-search"></i>
            <input type="text" name="q" class="search-input"
                   placeholder="Rechercher un produit..."
                   value="<?= htmlspecialchars($search) ?>">
        </div>
        <?php if ($cat && $cat !== 'Tout'): ?>
        <input type="hidden" name="categorie" value="<?= htmlspecialchars($cat) ?>">
        <?php endif; ?>
        <button type="submit" class="btn btn-green" style="padding:9px 14px;">
            <i class="ti ti-search"></i>
        </button>
    </form>
</div>

<!-- Catégories -->
<div class="categories">
    <?php foreach ($cats as $c): ?>
    <a href="index.php?<?= $search ? 'q='.urlencode($search).'&' : '' ?>categorie=<?= urlencode($c) ?>"
       class="cat-pill <?= ($cat === $c || ($c === 'Tout' && !$cat)) ? 'active' : '' ?>">
        <i class="ti <?= $icones_cat[$c] ?>"></i>
        <?= $c ?>
    </a>
    <?php endforeach; ?>
</div>

<!-- Grille des produits -->
<?php if (empty($produits)): ?>
<div class="empty-state">
    <div class="empty-icon"><i class="ti ti-mood-empty" style="font-size:3.5rem;color:var(--gray-mid)"></i></div>
    <h3>Aucun produit trouvé</h3>
    <p>Essayez une autre recherche ou catégorie.</p>
</div>
<?php else: ?>
<div class="products-grid">
    <?php foreach ($produits as $p): ?>
    <a href="produit.php?id=<?= $p['id'] ?>" class="product-card">
        <?php if ($p['photo'] && file_exists('uploads/' . $p['photo'])): ?>
        <img src="uploads/<?= htmlspecialchars($p['photo']) ?>"
             alt="<?= htmlspecialchars($p['titre']) ?>"
             class="product-img">
        <?php else: ?>
        <div class="product-img-placeholder">
            <i class="ti <?= $icones_cat[$p['categorie']] ?? 'ti-package' ?>" style="font-size:2.8rem;color:var(--green)"></i>
        </div>
        <?php endif; ?>
        <div class="product-info">
            <div class="product-name"><?= htmlspecialchars($p['titre']) ?></div>
            <div class="product-price"><?= number_format($p['prix'], 0, ',', ' ') ?> FCFA</div>
            <div class="product-seller">
                <i class="ti ti-user" style="font-size:.75rem"></i>
                <?= htmlspecialchars($p['vendeur_nom']) ?>
            </div>
            <?php if ($p['statut'] === 'epuise'): ?>
            <span class="product-badge badge-epuise"><i class="ti ti-x"></i> Épuisé</span>
            <?php endif; ?>
        </div>
    </a>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php include 'includes/footer.php'; ?>
