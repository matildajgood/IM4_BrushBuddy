<?php
// family.php
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

if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT u.family_id, f.family_code
        FROM users u
        LEFT JOIN families f ON f.id = u.family_id
        WHERE u.id = :user_id
    ");
    $stmt->execute([':user_id' => $user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (empty($row['family_id'])) {
        $code = generateFamilyCode($pdo);

        $pdo->prepare("INSERT INTO families (family_code) VALUES (:code)")
            ->execute([':code' => $code]);
        $family_id = $pdo->lastInsertId();

        $pdo->prepare("UPDATE users SET family_id = :fid WHERE id = :uid")
            ->execute([':fid' => $family_id, ':uid' => $user_id]);
        $pdo->prepare("UPDATE children SET family_id = :fid WHERE user_id = :uid AND family_id IS NULL")
            ->execute([':fid' => $family_id, ':uid' => $user_id]);

        $row['family_code'] = $code;
    }

    echo json_encode(["status" => "success", "family_code" => $row['family_code']]);

// PUT — Familie per Code beitreten
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $code = strtoupper(trim($data['family_code'] ?? ''));

    if (!$code) {
        echo json_encode(["status" => "error", "message" => "Kein Code angegeben"]);
        exit;
    }

    // Familie suchen
    $fam = $pdo->prepare("SELECT id FROM families WHERE family_code = :code");
    $fam->execute([':code' => $code]);
    $family = $fam->fetch(PDO::FETCH_ASSOC);

    if (!$family) {
        echo json_encode(["status" => "error", "message" => "Family-Code nicht gefunden"]);
        exit;
    }

    $new_family_id = $family['id'];

    // Eigene family_id holen (zum Migrieren alter Kinder)
    $me = $pdo->prepare("SELECT family_id FROM users WHERE id = :user_id");
    $me->execute([':user_id' => $user_id]);
    $old_family_id = $me->fetch(PDO::FETCH_ASSOC)['family_id'];

    // Kinder der alten Familie zur neuen Familie migrieren
    if ($old_family_id && $old_family_id !== $new_family_id) {
        $pdo->prepare("UPDATE children SET family_id = :new_fid WHERE family_id = :old_fid")
            ->execute([':new_fid' => $new_family_id, ':old_fid' => $old_family_id]);
    }

    // Kinder ohne family_id (Altdaten) zuweisen
    $pdo->prepare("UPDATE children SET family_id = :fid WHERE user_id = :uid AND family_id IS NULL")
        ->execute([':fid' => $new_family_id, ':uid' => $user_id]);

    // User der neuen Familie zuweisen
    $pdo->prepare("UPDATE users SET family_id = :fid WHERE id = :uid")
        ->execute([':fid' => $new_family_id, ':uid' => $user_id]);

    echo json_encode(["status" => "success"]);

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Methode"]);
}
