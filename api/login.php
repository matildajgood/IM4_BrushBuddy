<?php
// login.php
ini_set('session.cookie_httponly', 1);
// ini_set('session.cookie_secure', 1); // if using HTTPS
session_start();
header('Content-Type: application/json');

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $password = trim($data['password'] ?? '');

    if (!$password) {
        echo json_encode(["status" => "error", "message" => "Password is required"]);
        exit;
    }

    // Find user by password (single-parent demo app)
    $stmt = $pdo->prepare("SELECT id, email, password FROM users");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $matched = null;
    foreach ($users as $user) {
        if (password_verify($password, $user['password'])) {
            $matched = $user;
            break;
        }
    }

    if ($matched) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $matched['id'];
        $_SESSION['email']   = $matched['email'];

        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid password"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
