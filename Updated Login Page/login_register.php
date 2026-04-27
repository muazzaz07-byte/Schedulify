<?php
session_start();
include 'config.php';

// --- REGISTER ---
if (isset($_POST['register'])) {
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    
    // Catch the new Security Question data
    $security_question = mysqli_real_escape_string($conn, $_POST['security_question']);
    $security_answer = mysqli_real_escape_string($conn, $_POST['security_answer']);

    // Check if email already exists
    $check = $conn->query("SELECT email FROM users WHERE email = '$email'");
    
    if ($check->num_rows > 0) {
        $_SESSION['register_error'] = "Email already exists!";
        $_SESSION['active_form'] = 'register';
    } else {
        // Updated SQL to include Security Questions
        $sql = "INSERT INTO users (`name`, `email`, `password`, `security_question`, `security_answer`) 
                VALUES ('$name', '$email', '$password', '$security_question', '$security_answer')";
        
        if ($conn->query($sql)) {
            $_SESSION['login_error'] = "Registration successful! Please login.";
            $_SESSION['active_form'] = 'login';
        } else {
            $_SESSION['register_error'] = "Database Error: " . $conn->error;
        }
    }
    header("Location: index.php");
    exit();
}

// --- LOGIN ---
if (isset($_POST['login'])) {
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = $_POST['password'];

    $result = $conn->query("SELECT * FROM users WHERE email = '$email'");
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            
            header("Location: book.php");
            exit();
        }
    }
    $_SESSION['login_error'] = "Invalid email or password!";
    header("Location: index.php");
    exit();
}
?>