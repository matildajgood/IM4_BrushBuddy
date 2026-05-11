<?php
// profile.php
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

// READ — Profil laden
if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT id, vorname, name, email FROM users WHERE id = :id");
    $stmt->execute([':id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "user" => $user]);

// UPDATE — Profil bearbeiten
} elseif ($method === 'PUT') {
    $data    = json_decode(file_get_contents("php://input"), true);
    $vorname = trim($data['vorname'] ?? '');
    $name    = trim($data['name'] ?? '');
    $email   = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    if (!$vorname || !$name || !$email) {
        echo json_encode(["status" => "error", "message" => "Vorname, Name und Email sind erforderlich"]);
        exit;
    }

    if ($password) {
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET vorname = :vorname, name = :name, email = :email, password = :password WHERE id = :id");
        $stmt->execute([':vorname' => $vorname, ':name' => $name, ':email' => $email, ':password' => $hashed, ':id' => $user_id]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET vorname = :vorname, name = :name, email = :email WHERE id = :id");
        $stmt->execute([':vorname' => $vorname, ':name' => $name, ':email' => $email, ':id' => $user_id]);
    }

    $_SESSION['email'] = $email;
    echo json_encode(["status" => "success"]);

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Methode"]);
}
