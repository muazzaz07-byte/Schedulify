<?php
session_start();
include 'config.php';

// --- REGISTER ---
if (isset($_POST['register'])) {
    // 1. Capture and sanitize inputs
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password_raw = $_POST['password'];
    $security_question = mysqli_real_escape_string($conn, $_POST['security_question']);
    $security_answer = $_POST['security_answer']; // Raw for re-filling

    // 2. Save to Session so the form "remembers" them
    $_SESSION['reg_name'] = $name;
    $_SESSION['reg_email'] = $email;
    $_SESSION['reg_question'] = $security_question;
    $_SESSION['reg_answer'] = $security_answer;

    // 3. Password Strength Validation
    $pattern = "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/";
    
    if (!preg_match($pattern, $password_raw)) {
        $_SESSION['register_error'] = "Password must be at least 8 characters, include uppercase, lowercase, a number, and a symbol.";
        $_SESSION['active_form'] = 'register';
        header("Location: index.php");
        exit();
    }

    // 4. Domain Validation
    $email = strtolower($email);
    $allowed_domains = ['student.mmu.edu.my', 'mmu.edu.my'];
    $email_parts = explode('@', $email);
    $domain = end($email_parts);

    if (!in_array($domain, $allowed_domains)) {
        $_SESSION['register_error'] = "Access denied. Use @student.mmu.edu.my or @mmu.edu.my only.";
        $_SESSION['active_form'] = 'register';
        header("Location: index.php");
        exit();
    }

    // 5. Check if email exists
    $check = $conn->query("SELECT email FROM users WHERE email = '$email'");
    
    if ($check->num_rows > 0) {
        $_SESSION['register_error'] = "Email already exists!";
        $_SESSION['active_form'] = 'register';
    } else {
        // Success: Clear the re-fill data so the form is empty for the next person
        unset($_SESSION['reg_name'], $_SESSION['reg_email'], $_SESSION['reg_question'], $_SESSION['reg_answer']);

        $password_hashed = password_hash($password_raw, PASSWORD_DEFAULT);
        $hashed_answer = password_hash($security_answer, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (`name`, `email`, `password`, `security_question`, `security_answer`) 
                VALUES ('$name', '$email', '$password_hashed', '$security_question', '$hashed_answer')";
        
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
    $email = mysqli_real_escape_string($conn, strtolower($_POST['email']));
    $password = $_POST['password'];

    $result = $conn->query("SELECT * FROM users WHERE email = '$email'");
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            
            if (str_ends_with($email, '@student.mmu.edu.my')) {
                header("Location: book.php"); 
            } elseif (str_ends_with($email, '@mmu.edu.my')) {
                header("Location: lecturer_dashboard.php"); 
            } else {
                $_SESSION['login_error'] = "Unauthorized email domain.";
                header("Location: index.php");
            }
            exit();
        }
    }
    $_SESSION['login_error'] = "Invalid email or password!";
    header("Location: index.php");
    exit();
}
?>