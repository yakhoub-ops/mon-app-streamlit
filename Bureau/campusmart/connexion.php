<?php
require_once 'includes/config.php';
session_start_safe();

if (est_connecte()) redirect('index.php');

$erreur  = '';
$succes  = '';
$tab     = 'connexion';

// --- CONNEXION ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'connexion') {
    $email = trim($_POST['email'] ?? '');
    $mdp   = $_POST['mot_de_passe'] ?? '';

    if (!$email || !$mdp) {
        $erreur = 'Veuillez remplir tous les champs.';
    } else {
        $stmt = db()->prepare('SELECT * FROM utilisateurs WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($mdp, $user['mot_de_passe'])) {
            $_SESSION['user_id'] = $user['id'];
            redirect('index.php');
        } else {
            $erreur = 'Email ou mot de passe incorrect.';
        }
    }
    $tab = 'connexion';
}

// --- INSCRIPTION ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'inscription') {
    $tab  = 'inscription';
    $nom  = trim($_POST['nom']          ?? '');
    $email= trim($_POST['email']        ?? '');
    $mdp  = $_POST['mot_de_passe']      ?? '';
    $mdp2 = $_POST['mot_de_passe2']     ?? '';
    $univ = trim($_POST['universite']   ?? '');
    $tel  = trim($_POST['telephone']    ?? '');

    if (!$nom || !$email || !$mdp || !$univ || !$tel) {
        $erreur = 'Veuillez remplir tous les champs obligatoires.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erreur = 'Adresse email invalide.';
    } elseif (strlen($mdp) < 6) {
        $erreur = 'Le mot de passe doit contenir au moins 6 caractères.';
    } elseif ($mdp !== $mdp2) {
        $erreur = 'Les mots de passe ne correspondent pas.';
    } else {
        $check = db()->prepare('SELECT id FROM utilisateurs WHERE email = ?');
        $check->execute([$email]);
        if ($check->fetch()) {
            $erreur = 'Cet email est déjà utilisé.';
        } else {
            $hash = password_hash($mdp, PASSWORD_BCRYPT);
            $ins  = db()->prepare('INSERT INTO utilisateurs (nom, email, mot_de_passe, universite, telephone) VALUES (?,?,?,?,?)');
            $ins->execute([$nom, $email, $hash, $univ, $tel]);
            $_SESSION['user_id'] = db()->lastInsertId();
            redirect('index.php');
        }
    }
}

$page_title = 'CampusMart — Connexion';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $page_title ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="auth-page">
    <div class="auth-card">
        <div class="auth-logo">
            <h1><i class="ti ti-shopping-cart"></i> CampusMart</h1>
            <p>La marketplace des étudiants</p>
        </div>

        <?php if ($erreur): ?>
        <div class="alert alert-error"><?= htmlspecialchars($erreur) ?></div>
        <?php endif; ?>
        <?php if ($succes): ?>
        <div class="alert alert-success"><?= htmlspecialchars($succes) ?></div>
        <?php endif; ?>

        <div class="auth-tabs">
            <div class="auth-tab <?= $tab === 'connexion'   ? 'active' : '' ?>" onclick="switchTab('connexion')">Connexion</div>
            <div class="auth-tab <?= $tab === 'inscription' ? 'active' : '' ?>" onclick="switchTab('inscription')">Inscription</div>
        </div>

        <!-- Formulaire connexion -->
        <form class="auth-form <?= $tab === 'connexion' ? 'active' : '' ?>" id="form-connexion" method="POST">
            <input type="hidden" name="action" value="connexion">
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" class="form-control" placeholder="votre@email.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
            </div>
            <div class="form-group">
                <label>Mot de passe</label>
                <input type="password" name="mot_de_passe" class="form-control" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn btn-green btn-full" style="margin-top:6px">Se connecter</button>
        </form>

        <!-- Formulaire inscription -->
        <form class="auth-form <?= $tab === 'inscription' ? 'active' : '' ?>" id="form-inscription" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="action" value="inscription">
            <div class="form-group">
                <label>Nom complet *</label>
                <input type="text" name="nom" class="form-control" placeholder="Amadou Diallo" value="<?= htmlspecialchars($_POST['nom'] ?? '') ?>" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" class="form-control" placeholder="votre@email.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Université *</label>
                    <input type="text" name="universite" class="form-control" placeholder="UCAD, UGB..." value="<?= htmlspecialchars($_POST['universite'] ?? '') ?>" required>
                </div>
                <div class="form-group">
                    <label>Téléphone *</label>
                    <input type="tel" name="telephone" class="form-control" placeholder="7X XXX XX XX" value="<?= htmlspecialchars($_POST['telephone'] ?? '') ?>" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Mot de passe *</label>
                    <input type="password" name="mot_de_passe" class="form-control" placeholder="6 car. min." required>
                </div>
                <div class="form-group">
                    <label>Confirmer *</label>
                    <input type="password" name="mot_de_passe2" class="form-control" placeholder="••••••" required>
                </div>
            </div>
            <button type="submit" class="btn btn-green btn-full" style="margin-top:6px">Créer mon compte</button>
        </form>
    </div>
</div>
<script>
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t,i) => {
        t.classList.toggle('active', (i === 0 && tab === 'connexion') || (i === 1 && tab === 'inscription'));
    });
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('form-' + tab).classList.add('active');
}
</script>
</body>
</html>
