<?php
require_once 'includes/config.php';
session_start_safe();

if (!est_connecte()) redirect('connexion.php');

$user  = utilisateur_connecte();
$mode  = $_GET['mode'] ?? 'ajouter';  // ajouter | modifier
$pid   = (int)($_GET['id'] ?? 0);
$produit = null;

// Chargement si modification
if ($mode === 'modifier' && $pid) {
    $stmt = db()->prepare('SELECT * FROM produits WHERE id = ? AND id_vendeur = ?');
    $stmt->execute([$pid, $user['id']]);
    $produit = $stmt->fetch();
    if (!$produit) redirect('mes-ventes.php');
}

$erreur = '';
$succes = '';
$cats   = ['Livres','Habits','Tech','Alimentaire','Services','Autre'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $titre  = trim($_POST['titre']       ?? '');
    $desc   = trim($_POST['description'] ?? '');
    $prix   = (float)($_POST['prix']     ?? 0);
    $stock  = (int)($_POST['stock']      ?? 1);
    $cat    = $_POST['categorie']        ?? 'Autre';

    if (!$titre || $prix <= 0 || $stock < 0) {
        $erreur = 'Veuillez remplir correctement tous les champs obligatoires.';
    } elseif (!in_array($cat, $cats)) {
        $erreur = 'Catégorie invalide.';
    } else {
        $photo = $produit['photo'] ?? null;

        // Upload photo
        if (!empty($_FILES['photo']['name'])) {
            $resultat = upload_image($_FILES['photo'], 'prod');
            if ($resultat === false) {
                $erreur = 'Image invalide (JPG/PNG/WebP, max 5 Mo).';
            } else {
                // Supprimer l'ancienne photo
                if ($photo && file_exists(UPLOAD_DIR . $photo)) {
                    unlink(UPLOAD_DIR . $photo);
                }
                $photo = $resultat;
            }
        }

        if (!$erreur) {
            $statut = $stock > 0 ? 'actif' : 'epuise';
            if ($mode === 'modifier' && $pid) {
                $upd = db()->prepare('UPDATE produits SET titre=?, description=?, prix=?, stock=?, categorie=?, photo=?, statut=? WHERE id=? AND id_vendeur=?');
                $upd->execute([$titre, $desc, $prix, $stock, $cat, $photo, $statut, $pid, $user['id']]);
                $succes = 'Produit modifié avec succès !';
                $stmt->execute([$pid, $user['id']]);
                $produit = $stmt->fetch();
            } else {
                $ins = db()->prepare('INSERT INTO produits (titre, description, prix, stock, categorie, photo, id_vendeur, statut) VALUES (?,?,?,?,?,?,?,?)');
                $ins->execute([$titre, $desc, $prix, $stock, $cat, $photo, $user['id'], $statut]);
                $succes = 'Produit publié avec succès !';
                $produit = null;
            }
        }
    }
}

$page_title = ($mode === 'modifier' ? 'Modifier' : 'Publier') . ' un produit — CampusMart';
$icones_cat = ['Livres'=>'ti-book','Habits'=>'ti-shirt','Tech'=>'ti-device-laptop','Alimentaire'=>'ti-apple','Services'=>'ti-tool','Autre'=>'ti-dots'];
include 'includes/header.php';
?>

<div style="max-width:600px;margin:0 auto;">
    <!-- En-tête -->
    <div class="publish-header">
        <a href="mes-ventes.php" style="color:var(--green);font-size:1.3rem;display:flex;align-items:center;">
            <i class="ti ti-arrow-left"></i>
        </a>
        <h2><?= $mode === 'modifier' ? 'Modifier le produit' : 'Publier un produit' ?></h2>
    </div>

    <div style="padding:14px 12px">
        <?php if ($erreur): ?>
        <div class="alert alert-error"><i class="ti ti-alert-circle"></i> <?= htmlspecialchars($erreur) ?></div>
        <?php endif; ?>
        <?php if ($succes): ?>
        <div class="alert alert-success"><i class="ti ti-circle-check"></i> <?= htmlspecialchars($succes) ?>
            <?php if ($mode !== 'modifier'): ?>
            <a href="mes-ventes.php" style="color:var(--green-dark);font-weight:700;margin-left:8px">Voir mes ventes</a>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <form method="POST" enctype="multipart/form-data">

            <!-- Upload photo -->
            <div class="photo-upload" id="photo-zone" onclick="document.getElementById('photo-input').click()">
                <input type="file" name="photo" id="photo-input" accept="image/*" onchange="previewPhoto(this)">
                <?php if ($produit && $produit['photo'] && file_exists('uploads/'.$produit['photo'])): ?>
                <img src="uploads/<?= htmlspecialchars($produit['photo']) ?>" id="photo-preview" alt="Photo">
                <?php else: ?>
                <div class="upload-hint" id="upload-hint">
                    <i class="ti ti-camera" style="font-size:2.5rem;color:var(--green);display:block;margin-bottom:6px"></i>
                    <span>Appuyer pour ajouter une photo</span>
                    <span style="font-size:.75rem;color:var(--gray-mid)">JPG, PNG, WebP — max 5 Mo</span>
                </div>
                <img id="photo-preview" style="display:none;width:100%;height:100%;object-fit:cover" alt="">
                <?php endif; ?>
            </div>

            <!-- Titre -->
            <div class="form-group">
                <label><i class="ti ti-tag"></i> Titre du produit *</label>
                <input type="text" name="titre" class="form-control" required
                       placeholder="Ex: Calculatrice Casio fx-991"
                       value="<?= htmlspecialchars($produit['titre'] ?? $_POST['titre'] ?? '') ?>">
            </div>

            <!-- Description -->
            <div class="form-group">
                <label><i class="ti ti-align-left"></i> Description</label>
                <textarea name="description" class="form-control"
                          placeholder="Décrivez votre produit (état, caractéristiques...)..."><?= htmlspecialchars($produit['description'] ?? $_POST['description'] ?? '') ?></textarea>
            </div>

            <!-- Prix & Stock -->
            <div class="form-row">
                <div class="form-group">
                    <label><i class="ti ti-currency-dollar"></i> Prix (FCFA) *</label>
                    <input type="number" name="prix" class="form-control" required min="1" step="50"
                           placeholder="5000"
                           value="<?= htmlspecialchars($produit['prix'] ?? $_POST['prix'] ?? '') ?>">
                </div>
                <div class="form-group">
                    <label><i class="ti ti-stack-2"></i> Stock *</label>
                    <input type="number" name="stock" class="form-control" required min="0"
                           placeholder="1"
                           value="<?= htmlspecialchars($produit['stock'] ?? $_POST['stock'] ?? '1') ?>">
                </div>
            </div>

            <!-- Catégorie -->
            <div class="form-group">
                <label><i class="ti ti-category"></i> Catégorie *</label>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
                    <?php foreach ($cats as $c):
                        $sel = ($produit['categorie'] ?? $_POST['categorie'] ?? 'Autre') === $c;
                    ?>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;
                        padding:7px 14px;border-radius:20px;border:1.5px solid <?= $sel ? 'var(--green)' : '#e0e3e8' ?>;
                        background:<?= $sel ? 'var(--green-light)' : '#fff' ?>;
                        color:<?= $sel ? 'var(--green-dark)' : 'var(--gray-mid)' ?>;
                        font-size:.84rem;font-weight:600;transition:all .15s"
                        onclick="selectCat('<?= $c ?>', this)">
                        <i class="ti <?= $icones_cat[$c] ?>"></i>
                        <input type="radio" name="categorie" value="<?= $c ?>"
                               style="display:none" <?= $sel ? 'checked' : '' ?>>
                        <?= $c ?>
                    </label>
                    <?php endforeach; ?>
                </div>
            </div>

            <button type="submit" class="btn btn-green btn-full" style="margin-top:6px">
                <i class="ti ti-<?= $mode === 'modifier' ? 'check' : 'circle-plus' ?>"></i>
                <?= $mode === 'modifier' ? 'Enregistrer les modifications' : 'Publier le produit' ?>
            </button>
        </form>
    </div>
</div>

<script>
function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('upload-hint') && (document.getElementById('upload-hint').style.display = 'none');
            const img = document.getElementById('photo-preview');
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function selectCat(val, lbl) {
    document.querySelectorAll('[name="categorie"]').forEach(r => {
        const parent = r.parentElement;
        const sel = r.value === val;
        parent.style.borderColor = sel ? 'var(--green)' : '#e0e3e8';
        parent.style.background  = sel ? 'var(--green-light)' : '#fff';
        parent.style.color       = sel ? 'var(--green-dark)' : 'var(--gray-mid)';
        r.checked = sel;
    });
}
</script>

<?php include 'includes/footer.php'; ?>
