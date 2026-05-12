<?php
// register.php
session_start();
header('Content-Type: application/json');

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents("php://input"), true);

    $vorname  = trim($data['vorname'] ?? '');
    $name     = trim($data['name'] ?? '');
    $email    = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    if (!$vorname || !$name || !$email || !$password) {
        echo json_encode(["status" => "error", "message" => "Alle Felder sind erforderlich"]);
        exit;
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Email is already in use"]);
        exit;
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Unique family code generieren
    do {
        $code = strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 4))
              . '-'
              . strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 4));
        $check = $pdo->prepare("SELECT id FROM families WHERE family_code = :code");
        $check->execute([':code' => $code]);
    } while ($check->fetch());

    $fam = $pdo->prepare("INSERT INTO families (family_code) VALUES (:code)");
    $fam->execute([':code' => $code]);
    $family_id = $pdo->lastInsertId();

    // User mit family_id einfügen
    $insert = $pdo->prepare("INSERT INTO users (vorname, name, email, password, family_id) VALUES (:vorname, :name, :email, :pass, :family_id)");
    $insert->execute([
        ':vorname'   => $vorname,
        ':name'      => $name,
        ':email'     => $email,
        ':pass'      => $hashedPassword,
        ':family_id' => $family_id
    ]);

    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
