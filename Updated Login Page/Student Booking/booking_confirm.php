<?php
session_start();
include 'config.php';

// Verify login and get the correct session name
$student_name = isset($_SESSION['username']) ? $_SESSION['username'] : "Guest User"; 

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $lecturer_name = mysqli_real_escape_string($conn, $_POST['lecturer_name']);
    $app_date = mysqli_real_escape_string($conn, $_POST['appointment_date']);
    $app_time = mysqli_real_escape_string($conn, $_POST['appointment_time']);

    // INSERT query (removed student_id as per your request)
    $sql = "INSERT INTO appointment (student_name, lecturer_name, appointment_date, appointment_time, status) 
            VALUES ('$student_name', '$lecturer_name', '$app_date', '$app_time', 'Confirmed')";

    if ($conn->query($sql)) {
        echo "success"; // This prevents the warning popup seen in image_b0997a.png
    } else {
        echo "Database Error: " . $conn->error;
    }
}
?>