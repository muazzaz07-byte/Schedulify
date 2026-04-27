<?php
session_start();
include 'config.php';

if (isset($_POST['update_password'])) {
    $email = $_SESSION['reset_email'];
    $new_pass = password_hash($_POST['new_password'], PASSWORD_DEFAULT);

    $sql = "UPDATE users SET password = '$new_pass' WHERE email = '$email'";
    
    if ($conn->query($sql)) {
        $_SESSION['login_error'] = "Password updated! Please login.";
        unset($_SESSION['reset_email']);
        header("Location: index.php");
    } else {
        echo "Error updating password.";
    }
}
?>