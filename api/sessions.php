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
    $data     = json_decode(file_get_contents("php://input"), true);
    $child_id = intval($data['child_id'] ?? 0);

    if (!$child_id) {
        echo json_encode(["status" => "error", "message" => "child_id fehlt"]);
        exit;
    }

    // Prüfen ob das Kind dem eingeloggten User gehört
    $check = $pdo->prepare("SELECT id FROM children WHERE id = :child_id AND user_id = :user_id");
    $check->execute([':child_id' => $child_id, ':user_id' => $user_id]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Kein Zugriff"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO sessions (child_id, startTime) VALUES (:child_id, NOW())");
    $stmt->execute([':child_id' => $child_id]);
    $session_id = $pdo->lastInsertId();
    echo json_encode(["status" => "success", "session_id" => $session_id]);

// READ — Sessions laden
} elseif ($method === 'GET') {
    $child_id = intval($_GET['child_id'] ?? 0);

    if (!$child_id) {
        echo json_encode(["status" => "error", "message" => "child_id fehlt"]);
        exit;
    }

    // Prüfen ob das Kind dem eingeloggten User gehört
    $check = $pdo->prepare("SELECT id FROM children WHERE id = :child_id AND user_id = :user_id");
    $check->execute([':child_id' => $child_id, ':user_id' => $user_id]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Kein Zugriff"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM sessions WHERE child_id = :child_id ORDER BY startTime DESC");
    $stmt->execute([':child_id' => $child_id]);
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

    $stmt = $pdo->prepare("
        UPDATE sessions s
        JOIN children c ON s.child_id = c.id
        SET s.endTime = NOW(), s.duration = :duration, s.completed = :completed
        WHERE s.id = :id AND c.user_id = :user_id
    ");
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

    $stmt = $pdo->prepare("
        DELETE s FROM sessions s
        JOIN children c ON s.child_id = c.id
        WHERE s.id = :id AND c.user_id = :user_id
    ");
    $stmt->execute([':id' => $session_id, ':user_id' => $user_id]);
    echo json_encode(["status" => "success"]);

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Methode"]);
}
