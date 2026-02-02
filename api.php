<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$host = "127.0.0.1"; // Vagy localhost
$user = "root";
$pass = "";
$db_name = "visualstock";

$conn = new mysqli($host, $user, $pass, $db_name);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    die(json_encode(["error" => "Kapcsolódási hiba: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

// --- HA ADATOT KÉRÜNK (GET) ---
if ($method == 'GET') {
    $sql = "SELECT * FROM termekek";
    $result = $conn->query($sql);
    $termekek = array();

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $row['db'] = (int)$row['db'];
            $row['max_keszlet'] = (int)$row['max_keszlet'];
            
            $termekek[] = array(
                "cikkszam" => $row['cikkszam'],
                "nev" => $row['nev'],
                "db" => $row['db'],
                "max" => $row['max_keszlet']
            );
        }
    }
    echo json_encode($termekek);
}

// --- HA MÓDOSÍTUNK (POST) ---
elseif ($method == 'POST') {
    // A bejövő JSON adat olvasása
    $data = json_decode(file_get_contents("php://input"));

    if(isset($data->cikkszam) && isset($data->valtozas)) {
        $cikkszam = $conn->real_escape_string($data->cikkszam);
        $valtozas = (int)$data->valtozas; // Ez lehet +1 vagy -1

        // SQL parancs: Frissítjük a darabszámot
        $sql = "UPDATE termekek SET db = db + $valtozas WHERE cikkszam = '$cikkszam'";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["message" => "Sikeres frissítés"]);
        } else {
            echo json_encode(["message" => "Hiba: " . $conn->error]);
        }
    } else {
        echo json_encode(["message" => "Hiányzó adatok"]);
    }
}

$conn->close();
?>