<?php
require_once __DIR__ . '/config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function read_content(): array {
    if (!is_file(CONTENT_FILE)) {
        return ['profile' => [], 'projects' => []];
    }
    $content = json_decode(file_get_contents(CONTENT_FILE), true);
    return is_array($content) ? $content : ['profile' => [], 'projects' => []];
}

function is_admin(): bool {
    return !empty($_SESSION['portfolio_admin']);
}

$action = $_GET['action'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $credentials = json_decode(file_get_contents('php://input'), true) ?: [];
    if (hash_equals((string) constant('ADMIN_USERNAME'), (string) ($credentials['username'] ?? '')) && hash_equals((string) constant('ADMIN_PASSWORD'), (string) ($credentials['password'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['portfolio_admin'] = true;
        respond(['ok' => true]);
    }
    respond(['error' => 'Invalid username or password'], 401);
}

if ($action === 'session') {
    respond(['authenticated' => is_admin()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    $_SESSION = [];
    session_destroy();
    respond(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(read_content());
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !is_admin()) {
    respond(['error' => 'Unauthorized'], 401);
}

if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 20 * 1024 * 1024) {
        respond(['error' => 'File upload failed or exceeds the 20MB limit'], 422);
    }
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'zip', 'doc', 'docx'];
    if (!in_array($extension, $allowedExtensions, true)) {
        respond(['error' => 'Unsupported file type'], 422);
    }
    $uploadDirectory = __DIR__ . '/uploads';
    if (!is_dir($uploadDirectory)) mkdir($uploadDirectory, 0755, true);
    $fileName = bin2hex(random_bytes(12)) . '.' . $extension;
    if (!move_uploaded_file($file['tmp_name'], $uploadDirectory . '/' . $fileName)) {
        respond(['error' => 'Unable to store uploaded file'], 500);
    }
    respond(['url' => 'uploads/' . $fileName]);
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload) || !isset($payload['profile'], $payload['projects'])) {
    respond(['error' => 'Invalid content payload'], 422);
}

$dataDirectory = dirname(CONTENT_FILE);
if (!is_dir($dataDirectory)) {
    mkdir($dataDirectory, 0755, true);
}
if (file_put_contents(CONTENT_FILE, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
    respond(['error' => 'Unable to save content'], 500);
}
respond(['ok' => true, 'content' => $payload]);

