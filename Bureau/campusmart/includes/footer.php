<?php
$page_act = basename($_SERVER['PHP_SELF'], '.php');
$pages = [
    ['href'=>'index.php',      'icon'=>'ti-home',           'label'=>'Accueil',    'id'=>'index'],
    ['href'=>'mes-ventes.php', 'icon'=>'ti-package',        'label'=>'Mes ventes', 'id'=>'mes-ventes'],
    ['href'=>'messages.php',   'icon'=>'ti-message-circle', 'label'=>'Messages',   'id'=>'messages'],
    ['href'=>'profil.php',     'icon'=>'ti-user',           'label'=>'Profil',     'id'=>'profil'],
];
?>
<!-- Bottom Nav -->
<nav class="bottom-nav">
    <?php foreach ($pages as $p): ?>
    <a href="<?= $p['href'] ?>" class="nav-item <?= $page_act === $p['id'] ? 'active' : '' ?>">
        <span class="nav-icon">
            <i class="ti <?= $p['icon'] ?>"></i>
            <?php if ($p['id'] === 'messages' && !empty($non_lus) && $non_lus > 0): ?>
            <span class="badge"><?= $non_lus ?></span>
            <?php endif; ?>
        </span>
        <span class="nav-label"><?= $p['label'] ?></span>
    </a>
    <?php endforeach; ?>
</nav>
<div class="bottom-spacer"></div>
<script src="<?= str_repeat('../', substr_count($_SERVER['PHP_SELF'], '/', 1)-1) ?>js/app.js"></script>
</body>
</html>
