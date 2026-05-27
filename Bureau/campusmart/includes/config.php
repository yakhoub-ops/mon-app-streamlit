<?php
// ============================================================
// CampusMart — Configuration base de données
// ============================================================

define('DB_HOST',     'localhost');
define('DB_USER',     'root');
define('DB_PASS',     '');
define('DB_NAME',     'campusmart');
define('SITE_NAME',   'CampusMart');
define('UPLOAD_DIR',  __DIR__ . '/../uploads/');
define('UPLOAD_URL',  'uploads/');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            die(json_encode(['error' => 'Connexion DB échouée: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

function session_start_safe(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function est_connecte(): bool {
    session_start_safe();
    return isset($_SESSION['user_id']);
}

function utilisateur_connecte(): array|null {
    session_start_safe();
    if (!isset($_SESSION['user_id'])) return null;
    $stmt = db()->prepare('SELECT * FROM utilisateurs WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch() ?: null;
}

function redirect(string $url): void {
    header('Location: ' . $url);
    exit;
}

function etoiles(float $note): string {
    $html = '';
    for ($i = 1; $i <= 5; $i++) {
        $filled = $i <= $note;
        $html .= '<i class="ti ti-star' . ($filled ? '-filled star filled' : ' star empty') . '" style="color:' . ($filled ? 'var(--orange)' : 'rgba(255,255,255,.35)') . '"></i>';
    }
    return $html;
}

function upload_image(array $file, string $prefix = 'img'): string|false {
    $exts = ['jpg','jpeg','png','gif','webp'];
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $exts)) return false;
    if ($file['size'] > 5 * 1024 * 1024) return false;
    $nom  = $prefix . '_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $nom)) return $nom;
    return false;
}

function initiales(string $nom): string {
    $mots = explode(' ', trim($nom));
    $ini  = '';
    foreach (array_slice($mots, 0, 2) as $m) {
        $ini .= mb_strtoupper(mb_substr($m, 0, 1));
    }
    return $ini ?: '?';
}

function nb_messages_non_lus(int $user_id): int {
    $stmt = db()->prepare('SELECT COUNT(*) FROM messages WHERE id_receveur = ? AND lu = 0');
    $stmt->execute([$user_id]);
    return (int)$stmt->fetchColumn();
}

function formater_date(string $date): string {
    $ts = strtotime($date);
    $diff = time() - $ts;
    if ($diff < 60)     return 'À l\'instant';
    if ($diff < 3600)   return (int)($diff/60)   . ' min';
    if ($diff < 86400)  return (int)($diff/3600)  . 'h';
    if ($diff < 604800) return (int)($diff/86400) . 'j';
    return date('d/m/Y', $ts);
}
