<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

// For simplicity, using a hardcoded API key or just allowing if present
$api_key = "my-secret-api-key";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Get API key from headers (standardize to X-API-Key)
$headers = array_change_key_case(getallheaders(), CASE_LOWER);
$received_key = $headers['x-api-key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? '';

if ($received_key !== $api_key) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$db_file = __DIR__ . '/passwords.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $content = file_exists($db_file) ? file_get_contents($db_file) : '';
    $data = json_decode($content, true);

    if (!$data) {
        echo json_encode(['passwords' => [], 'notes' => []]);
    } else {
        echo $content;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    if (file_put_contents($db_file, json_encode($data, JSON_PRETTY_PRINT)) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write to database file. Check permissions.']);
        exit;
    }
    echo json_encode(['status' => 'success']);
}
