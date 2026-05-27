<?php
require_once __DIR__ . '/config.php';
session_start_safe();
$user      = utilisateur_connecte();
$non_lus   = $user ? nb_messages_non_lus($user['id']) : 0;
$page_act  = basename($_SERVER['PHP_SELF'], '.php');
$base      = str_repeat('../', substr_count($_SERVER['PHP_SELF'], '/', 1)-1);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($page_title ?? SITE_NAME) ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
    <link rel="stylesheet" href="<?= $base ?>css/style.css">
</head>
<body>
<!-- Topbar -->
<header class="topbar">
    <div class="topbar-inner">
        <span class="topbar-logo"><i class="ti ti-shopping-cart"></i> CampusMart</span>
        <?php if ($user): ?>
        <div class="topbar-user">
            <span class="avatar-sm"><?= initiales($user['nom']) ?></span>
            <span class="topbar-name"><?= htmlspecialchars(explode(' ',$user['nom'])[0]) ?></span>
        </div>
        <?php else: ?>
        <a href="connexion.php" class="btn-sm-white">Connexion</a>
        <?php endif; ?>
    </div>
</header>
