<?php
session_start();
include 'config.php';

// Get the JSON data from the fetch request
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $student_id = $_SESSION['user_id'];
    $lecturer_name = mysqli_real_escape_string($conn, $data['lecturer_name']);
    $date = mysqli_real_escape_string($conn, $data['date']);
    $time = mysqli_real_escape_string($conn, $data['time']);

    // 1. Find the Lecturer ID based on their name
    $res = $conn->query("SELECT id FROM users WHERE username = '$lecturer_name'");
    $lecturer = $res->fetch_assoc();
    $lecturer_id = $lecturer['id'];

    // 2. Insert into the appointments table
    $sql = "INSERT INTO appointments (student_id, lecturer_id, appointment_date, start_time, status) 
            VALUES ('$student_id', '$lecturer_id', '$date', '$time', 'pending')";

    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => $conn->error]);
    }
}
?>