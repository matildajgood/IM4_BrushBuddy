<?php
// children.php
session_start();
header('Content-Type: application/json');

require_once '../system/config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];

// READ — Kinder laden
if ($method === 'GET') {
    $userStmt = $pdo->prepare("SELECT family_id FROM users WHERE id = :user_id");
    $userStmt->execute([':user_id' => $user_id]);
    $family_id = $userStmt->fetchColumn() ?: null;

    if ($family_id) {
        $stmt = $pdo->prepare("SELECT * FROM children WHERE family_id = :family_id");
        $stmt->execute([':family_id' => $family_id]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM children WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $user_id]);
    }
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "children" => $children]);

// CREATE — Kind hinzufügen
} elseif ($method === 'POST') {
    $userStmt = $pdo->prepare("SELECT family_id FROM users WHERE id = :user_id");
    $userStmt->execute([':user_id' => $user_id]);
    $family_id = $userStmt->fetchColumn() ?: null;

    $data       = json_decode(file_get_contents("php://input"), true);
    $name       = trim($data['name'] ?? '');
    $geburtstag = trim($data['geburtstag'] ?? '');

    if (!$name || !$geburtstag) {
        echo json_encode(["status" => "error", "message" => "Name und Geburtstag sind erforderlich"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO children (user_id, family_id, name, geburtstag) VALUES (:user_id, :family_id, :name, :geburtstag)");
    $stmt->execute([':user_id' => $user_id, ':family_id' => $family_id, ':name' => $name, ':geburtstag' => $geburtstag]);
    $child_id = $pdo->lastInsertId();
    echo json_encode(["status" => "success", "child_id" => $child_id]);

// UPDATE — Kind bearbeiten
} elseif ($method === 'PUT') {
    $data       = json_decode(file_get_contents("php://input"), true);
    $child_id   = intval($data['child_id'] ?? 0);
    $name       = trim($data['name'] ?? '');
    $geburtstag = trim($data['geburtstag'] ?? '');
    $avatar     = trim($data['avatar'] ?? '');

    if (!$child_id) {
        echo json_encode(["status" => "error", "message" => "child_id fehlt"]);
        exit;
    }

    // Nur Avatar-Update
    if ($avatar && !$name && !$geburtstag) {
        $stmt = $pdo->prepare("UPDATE children SET avatar = :avatar WHERE id = :id AND user_id = :user_id");
        $stmt->execute([':avatar' => $avatar, ':id' => $child_id, ':user_id' => $user_id]);
        echo json_encode(["status" => "success"]);
        exit;
    }

    if (!$name || !$geburtstag) {
        echo json_encode(["status" => "error", "message" => "Alle Felder sind erforderlich"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE children SET name = :name, geburtstag = :geburtstag, avatar = COALESCE(NULLIF(:avatar,''), avatar) WHERE id = :id AND user_id = :user_id");
    $stmt->execute([':name' => $name, ':geburtstag' => $geburtstag, ':avatar' => $avatar, ':id' => $child_id, ':user_id' => $user_id]);
    echo json_encode(["status" => "success"]);

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Methode"]);
}
