<?php
session_start();
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_office'])) {
    $user_id = $_SESSION['user_id'];
    $new_office = mysqli_real_escape_string($conn, $_POST['new_office']);

    $sql = "UPDATE users SET office_location = '$new_office' WHERE id = '$user_id'";
    
    if (mysqli_query($conn, $sql)) {
        header("Location: profilelecturer.php?status=success");
    } else {
        echo "Error updating record: " . mysqli_error($conn);
    }
}
?>