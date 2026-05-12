<?php
// load.php — Empfängt Putzsessions vom Basecontroller
header('Content-Type: application/json');

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Nur POST erlaubt']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['device_id'], $data['timestamp'], $data['duration'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Fehlende Felder: device_id, timestamp oder duration']);
    exit;
}

$device_id = trim($data['device_id']);
$timestamp = trim($data['timestamp']);
$duration  = intval($data['duration']);

// Kind anhand device_id suchen
$stmt = $pdo->prepare("SELECT id FROM children WHERE device_id = :device_id");
$stmt->execute([':device_id' => $device_id]);
$child = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$child) {
    http_response_code(404);
    echo json_encode(['error' => 'Kein Kind mit dieser device_id gefunden']);
    exit;
}

$completed = $duration >= 120 ? 1 : 0;

$insert = $pdo->prepare("
    INSERT INTO sessions (child_id, startTime, endTime, duration, completed)
    VALUES (:child_id, :startTime, NOW(), :duration, :completed)
");
$insert->execute([
    ':child_id'  => $child['id'],
    ':startTime' => $timestamp,
    ':duration'  => $duration,
    ':completed' => $completed,
]);

echo json_encode(['success' => true, 'completed' => $completed]);
