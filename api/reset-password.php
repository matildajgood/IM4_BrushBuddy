<?php
// reset-password.php
header('Content-Type: application/json');
require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Validate token
    $token = trim($_GET['token'] ?? '');
    if (!$token) {
        echo json_encode(["status" => "error", "message" => "missing_token"]);
        exit;
    }

    $stmt = $pdo->prepare(
        "SELECT user_id FROM password_reset_tokens WHERE token = :token AND expires_at > NOW()"
    );
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode(["status" => "valid"]);
    } else {
        echo json_encode(["status" => "error", "message" => "invalid_or_expired"]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data     = json_decode(file_get_contents("php://input"), true);
    $token    = trim($data['token'] ?? '');
    $password = $data['password'] ?? '';

    if (!$token || !$password) {
        echo json_encode(["status" => "error", "message" => "missing_fields"]);
        exit;
    }

    if (strlen($password) < 8) {
        echo json_encode(["status" => "error", "message" => "password_too_short"]);
        exit;
    }

    // Fetch valid token
    $stmt = $pdo->prepare(
        "SELECT user_id FROM password_reset_tokens WHERE token = :token AND expires_at > NOW()"
    );
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(["status" => "error", "message" => "invalid_or_expired"]);
        exit;
    }

    // Update password
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = :pw WHERE id = :id")
        ->execute([':pw' => $hashed, ':id' => $row['user_id']]);

    // Delete token
    $pdo->prepare("DELETE FROM password_reset_tokens WHERE token = :token")
        ->execute([':token' => $token]);

    echo json_encode(["status" => "success"]);
    exit;
}

echo json_encode(["status" => "error", "message" => "invalid_method"]);
