<?php
// sessions.php
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

// CREATE — Session starten
if ($method === 'POST') {
    $stmt = $pdo->prepare("INSERT INTO sessions (user_id, startTime) VALUES (:user_id, NOW())");
    $stmt->execute([':user_id' => $user_id]);
    $session_id = $pdo->lastInsertId();
    echo json_encode(["status" => "success", "session_id" => $session_id]);

// READ — Sessions laden
} elseif ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM sessions WHERE user_id = :user_id ORDER BY startTime DESC");
    $stmt->execute([':user_id' => $user_id]);
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "sessions" => $sessions]);

// UPDATE — Session abschliessen
} elseif ($method === 'PUT') {
    $data       = json_decode(file_get_contents("php://input"), true);
    $session_id = intval($data['session_id'] ?? 0);
    $duration   = intval($data['duration'] ?? 0);

    if (!$session_id) {
        echo json_encode(["status" => "error", "message" => "session_id fehlt"]);
        exit;
    }

    $completed = $duration >= 120 ? 1 : 0;

    $stmt = $pdo->prepare("UPDATE sessions SET endTime = NOW(), duration = :duration, completed = :completed WHERE id = :id AND user_id = :user_id");
    $stmt->execute([
        ':duration'  => $duration,
        ':completed' => $completed,
        ':id'        => $session_id,
        ':user_id'   => $user_id
    ]);
    echo json_encode(["status" => "success", "completed" => $completed]);

// DELETE — Session löschen
} elseif ($method === 'DELETE') {
    $data       = json_decode(file_get_contents("php://input"), true);
    $session_id = intval($data['session_id'] ?? 0);

    if (!$session_id) {
        echo json_encode(["status" => "error", "message" => "session_id fehlt"]);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = :id AND user_id = :user_id");
    $stmt->execute([':id' => $session_id, ':user_id' => $user_id]);
    echo json_encode(["status" => "success"]);

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Methode"]);
}
