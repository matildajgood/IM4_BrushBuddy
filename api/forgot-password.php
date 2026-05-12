<?php
// forgot-password.php
header('Content-Type: application/json');
require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "invalid_method"]);
    exit;
}

$data  = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "invalid_email"]);
    exit;
}

// Check if email exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
$stmt->execute([':email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // Don't reveal if email exists or not (security)
    echo json_encode(["status" => "success"]);
    exit;
}

// Delete any existing tokens for this user
$pdo->prepare("DELETE FROM password_reset_tokens WHERE user_id = :uid")
    ->execute([':uid' => $user['id']]);

// Generate secure token
$token     = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

$stmt = $pdo->prepare(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:uid, :token, :expires)"
);
$stmt->execute([':uid' => $user['id'], ':token' => $token, ':expires' => $expiresAt]);

// Build reset link
$protocol  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host      = $_SERVER['HTTP_HOST'];
$resetLink = "$protocol://$host/reset-password.html?token=$token";

// Send email
$subject = "BrushBuddy – Passwort zurücksetzen";
$body    = "Hallo,\n\n"
         . "Du hast angefordert, dein Passwort bei BrushBuddy zurückzusetzen.\n\n"
         . "Klicke auf den folgenden Link, um ein neues Passwort zu setzen (gültig für 1 Stunde):\n\n"
         . $resetLink . "\n\n"
         . "Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.\n\n"
         . "Dein BrushBuddy-Team";

$headers = "From: noreply@brushbuddy.ch\r\nContent-Type: text/plain; charset=UTF-8";

if (mail($email, $subject, $body, $headers)) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "mail_failed"]);
}
