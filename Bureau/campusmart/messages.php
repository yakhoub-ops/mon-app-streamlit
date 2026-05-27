<?php
require_once 'includes/config.php';
session_start_safe();

if (!est_connecte()) redirect('connexion.php');

$user         = utilisateur_connecte();
$destinataire = (int)($_GET['destinataire'] ?? 0);
$id_produit   = (int)($_GET['produit']      ?? 0);

// --- Si destinataire fourni → affichage du chat ---
if ($destinataire && $destinataire !== $user['id']) {

    // Infos interlocuteur
    $stmt = db()->prepare('SELECT * FROM utilisateurs WHERE id = ?');
    $stmt->execute([$destinataire]);
    $interlocuteur = $stmt->fetch();
    if (!$interlocuteur) redirect('messages.php');

    // Marquer comme lus
    db()->prepare('UPDATE messages SET lu=1 WHERE id_envoyeur=? AND id_receveur=?')
        ->execute([$destinataire, $user['id']]);

    // Envoi d'un message
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty(trim($_POST['contenu'] ?? ''))) {
        $contenu = trim($_POST['contenu']);
        // Pré-message produit
        if (!empty($_POST['produit_id'])) {
            $pid = (int)$_POST['produit_id'];
            $sp  = db()->prepare('SELECT titre, prix FROM produits WHERE id=?');
            $sp->execute([$pid]);
            $pp  = $sp->fetch();
            if ($pp) $contenu = '[Produit] ' . $pp['titre'] . ' (' . number_format($pp['prix'],0,',',' ') . ' FCFA)' . "\n" . $contenu;
        }
        $ins = db()->prepare('INSERT INTO messages (id_envoyeur, id_receveur, contenu) VALUES (?,?,?)');
        $ins->execute([$user['id'], $destinataire, $contenu]);
        redirect('messages.php?destinataire=' . $destinataire);
    }

    // Charger messages
    $stmt2 = db()->prepare(
        'SELECT * FROM messages
         WHERE (id_envoyeur=? AND id_receveur=?)
            OR (id_envoyeur=? AND id_receveur=?)
         ORDER BY date ASC');
    $stmt2->execute([$user['id'], $destinataire, $destinataire, $user['id']]);
    $msgs = $stmt2->fetchAll();

    // Produit en contexte
    $produit_ctx = null;
    if ($id_produit) {
        $sp = db()->prepare('SELECT * FROM produits WHERE id=?');
        $sp->execute([$id_produit]);
        $produit_ctx = $sp->fetch();
    }

    $page_title = 'Chat avec ' . $interlocuteur['nom'] . ' — CampusMart';
    include 'includes/header.php';
    ?>

    <div class="chat-page" style="padding-bottom:0">
        <!-- Header chat -->
        <div class="chat-header">
            <a href="messages.php" class="back-btn"><i class="ti ti-arrow-left"></i></a>
            <div class="conv-avatar"><?= initiales($interlocuteur['nom']) ?></div>
            <div style="flex:1">
                <div style="font-weight:600;font-size:.9rem"><?= htmlspecialchars($interlocuteur['nom']) ?></div>
                <div style="font-size:.75rem;color:var(--gray-mid)">
                    <i class="ti ti-school"></i> <?= htmlspecialchars($interlocuteur['universite']) ?>
                </div>
            </div>
            <a href="profil.php?id=<?= $interlocuteur['id'] ?>" style="color:var(--green);font-size:.8rem;font-weight:600">
                <i class="ti ti-user-circle"></i> Profil
            </a>
        </div>

        <!-- Contexte produit -->
        <?php if ($produit_ctx): ?>
        <div style="background:var(--green-light);padding:8px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #d0f0e5;">
            <i class="ti ti-package" style="color:var(--green)"></i>
            <span style="font-size:.82rem;font-weight:600;color:var(--green-dark)">
                <?= htmlspecialchars($produit_ctx['titre']) ?> —
                <?= number_format($produit_ctx['prix'],0,',',' ') ?> FCFA
            </span>
        </div>
        <?php endif; ?>

        <!-- Messages -->
        <div class="chat-messages" id="chat-messages">
            <?php if (empty($msgs)): ?>
            <div style="text-align:center;color:var(--gray-mid);font-size:.85rem;padding:30px">
                <i class="ti ti-message-dots" style="font-size:2rem;display:block;margin-bottom:8px"></i>
                Démarrez la conversation !
            </div>
            <?php else: ?>
            <?php foreach ($msgs as $m):
                $out = ($m['id_envoyeur'] == $user['id']);
            ?>
            <div style="display:flex;flex-direction:column;align-items:<?= $out ? 'flex-end' : 'flex-start' ?>">
                <div class="msg-bubble <?= $out ? 'msg-out' : 'msg-in' ?>">
                    <?= nl2br(htmlspecialchars($m['contenu'])) ?>
                </div>
                <div class="msg-time" style="<?= $out ? 'margin-right:4px' : 'margin-left:4px' ?>">
                    <?= formater_date($m['date']) ?>
                    <?php if ($out): ?>
                    <i class="ti ti-<?= $m['lu'] ? 'checks' : 'check' ?>" style="color:<?= $m['lu'] ? 'var(--green)' : 'var(--gray-mid)' ?>"></i>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <!-- Zone saisie -->
        <form method="POST" class="chat-input-bar">
            <?php if ($produit_ctx): ?>
            <input type="hidden" name="produit_id" value="<?= $produit_ctx['id'] ?>">
            <?php endif; ?>
            <textarea name="contenu" class="chat-input" rows="1"
                      placeholder="Écrire un message..."
                      onkeydown="submitOnEnter(event, this.form)"></textarea>
            <button type="submit" class="chat-send">
                <i class="ti ti-send"></i>
            </button>
        </form>
    </div>

    <script>
    // Scroll vers le bas
    const msgs = document.getElementById('chat-messages');
    msgs.scrollTop = msgs.scrollHeight;

    function submitOnEnter(e, form) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.submit(); }
    }
    </script>

    <?php
    // Footer sans bottom-nav dans le chat
    $non_lus_footer = nb_messages_non_lus($user['id']);
    ?>
    </body></html>
    <?php
    return;
}

// --- Liste des conversations ---
$stmt = db()->prepare(
    'SELECT
       u.id, u.nom, u.universite,
       m.contenu AS dernier_msg,
       m.date    AS dernier_date,
       SUM(CASE WHEN m.id_receveur = :me AND m.lu = 0 THEN 1 ELSE 0 END) AS non_lus
     FROM (
         SELECT
             CASE WHEN id_envoyeur = :me2 THEN id_receveur ELSE id_envoyeur END AS interlocuteur_id,
             MAX(date) AS last_date
         FROM messages
         WHERE id_envoyeur = :me3 OR id_receveur = :me4
         GROUP BY interlocuteur_id
     ) conv
     JOIN utilisateurs u ON u.id = conv.interlocuteur_id
     JOIN messages m ON (
         (m.id_envoyeur = :me5 AND m.id_receveur = u.id) OR
         (m.id_envoyeur = u.id AND m.id_receveur = :me6)
     ) AND m.date = conv.last_date
     GROUP BY u.id, u.nom, u.universite, m.contenu, m.date
     ORDER BY m.date DESC');
$stmt->execute([
    ':me'=>$user['id'],':me2'=>$user['id'],':me3'=>$user['id'],
    ':me4'=>$user['id'],':me5'=>$user['id'],':me6'=>$user['id']
]);
$convs = $stmt->fetchAll();

$page_title = 'Messages — CampusMart';
include 'includes/header.php';
?>

<div style="max-width:600px;margin:0 auto;">
    <div style="padding:14px 16px;background:#fff;border-bottom:1px solid #e8eaed;font-weight:700;font-size:1rem;position:sticky;top:56px;z-index:90">
        <i class="ti ti-message-circle"></i> Messages
        <?php if ($non_lus > 0): ?>
        <span style="background:var(--green);color:#fff;font-size:.72rem;padding:2px 8px;border-radius:10px;margin-left:6px"><?= $non_lus ?></span>
        <?php endif; ?>
    </div>

    <?php if (empty($convs)): ?>
    <div class="empty-state">
        <div class="empty-icon"><i class="ti ti-message-off" style="font-size:3rem;color:var(--gray-mid)"></i></div>
        <h3>Aucun message</h3>
        <p>Parcourez les produits et contactez un vendeur pour démarrer une conversation.</p>
        <a href="index.php" class="btn btn-green" style="margin-top:14px">
            <i class="ti ti-home"></i> Voir les produits
        </a>
    </div>
    <?php else: ?>
    <div class="conversations">
        <?php foreach ($convs as $c): ?>
        <a href="messages.php?destinataire=<?= $c['id'] ?>"
           class="conv-item <?= $c['non_lus'] > 0 ? 'unread' : '' ?>">
            <div class="conv-avatar"><?= initiales($c['nom']) ?></div>
            <div class="conv-info">
                <div class="conv-name"><?= htmlspecialchars($c['nom']) ?></div>
                <div class="conv-last"><?= htmlspecialchars(mb_substr($c['dernier_msg'],0,60)) ?></div>
            </div>
            <div class="conv-meta">
                <div class="conv-time"><?= formater_date($c['dernier_date']) ?></div>
                <?php if ($c['non_lus'] > 0): ?>
                <div class="conv-badge"><?= $c['non_lus'] ?></div>
                <?php endif; ?>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
