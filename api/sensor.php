<?php
// sensor.php — Empfängt Daten vom Sensor
header('Content-Type: application/json');

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Nur POST erlaubt"]);
    exit;
}

$data      = json_decode(file_get_contents("php://input"), true);
$device_id = trim($data['device_id'] ?? '');
$timestamp = trim($data['timestamp'] ?? '');
$duration  = intval($data['duration'] ?? 0);

if (!$device_id || !$timestamp || !$duration) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "device_id, timestamp und duration sind erforderlich"]);
    exit;
}

// Kind anhand device_id suchen
$stmt = $pdo->prepare("SELECT id FROM children WHERE device_id = :device_id");
$stmt->execute([':device_id' => $device_id]);
$child = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$child) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Kein Kind mit dieser device_id gefunden"]);
    exit;
}

$child_id  = $child['id'];
$completed = $duration >= 120 ? 1 : 0;

// Session speichern
$insert = $pdo->prepare("INSERT INTO sessions (child_id, startTime, endTime, duration, completed) VALUES (:child_id, :startTime, NOW(), :duration, :completed)");
$insert->execute([
    ':child_id'  => $child_id,
    ':startTime' => $timestamp,
    ':duration'  => $duration,
    ':completed' => $completed,
]);

echo json_encode(["status" => "success", "completed" => $completed]);
