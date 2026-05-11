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
    $stmt = $pdo->prepare("SELECT * FROM children WHERE user_id = :user_id");
    $stmt->execute([':user_id' => $user_id]);
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "children" => $children]);

// CREATE — Kind hinzufügen
} elseif ($method === 'POST') {
    $data       = json_decode(file_get_contents("php://input"), true);
    $name       = trim($data['name'] ?? '');
    $geburtstag = trim($data['geburtstag'] ?? '');

    if (!$name || !$geburtstag) {
        echo json_encode(["status" => "error", "message" => "Name und Geburtstag sind erforderlich"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO children (user_id, name, geburtstag) VALUES (:user_id, :name, :geburtstag)");
    $stmt->execute([':user_id' => $user_id, ':name' => $name, ':geburtstag' => $geburtstag]);
    $child_id = $pdo->lastInsertId();
    echo json_encode(["status" => "success", "child_id" => $child_id]);

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Methode"]);
}
