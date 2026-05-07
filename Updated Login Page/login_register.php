<?php
session_start();
include 'config.php';

// --- REGISTER ---
if (isset($_POST['register'])) {
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $email = mysqli_real_escape_string($conn, strtolower($_POST['email']));
    $password_raw = $_POST['password'];
    $security_question = mysqli_real_escape_string($conn, $_POST['security_question']);
    $security_answer = $_POST['security_answer']; // Keep raw for hashing

    // Save inputs to session in case of error (to refill the form)
    $_SESSION['reg_name'] = $name;
    $_SESSION['reg_email'] = $email;
    $_SESSION['reg_question'] = $security_question;
    $_SESSION['reg_answer'] = $security_answer;

    // 1. Password Validation
    $pattern = "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/";
    if (!preg_match($pattern, $password_raw)) {
        $_SESSION['register_error'] = "Password must be at least 8 characters, include uppercase, lowercase, a number, and a symbol.";
        $_SESSION['active_form'] = 'register';
        header("Location: index.php");
        exit();
    }

    // 2. Domain Validation & Role Assignment
    if (str_ends_with($email, '@student.mmu.edu.my')) {
        $role = 'Student';
    } elseif (str_ends_with($email, '@mmu.edu.my')) {
        $role = 'Lecturer';
    } else {
        $_SESSION['register_error'] = "Access denied. Use @student.mmu.edu.my or @mmu.edu.my only.";
        $_SESSION['active_form'] = 'register';
        header("Location: index.php");
        exit();
    }

    // 3. Check for existing email
    $check = $conn->query("SELECT email FROM users WHERE email = '$email'");
    
    if ($check->num_rows > 0) {
        $_SESSION['register_error'] = "Email already exists!";
        $_SESSION['active_form'] = 'register';
    } else {
        // Clear session inputs since we are proceeding with success
        unset($_SESSION['reg_name'], $_SESSION['reg_email'], $_SESSION['reg_question'], $_SESSION['reg_answer']);

        // 4. Hash sensitive data
        $password_hashed = password_hash($password_raw, PASSWORD_DEFAULT);
        // We hash the security answer so it is never stored in plain text
        $hashed_answer = password_hash($security_answer, PASSWORD_DEFAULT);

        // 5. FINAL SINGLE INSERT (Includes all necessary fields for the new structure)
        $sql = "INSERT INTO users (`username`, `name`, `email`, `password`, `role`, `security_question`, `security_answer`, `login_attempts`) 
                VALUES ('$name', '$name', '$email', '$password_hashed', '$role', '$security_question', '$hashed_answer', 0)";
        
        if ($conn->query($sql)) {
            $_SESSION['login_error'] = "Registration successful as $role! Please login.";
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
        $now = new DateTime();

        // 1. Check for Account Lock (5-minute buffer)
        if ($user['login_attempts'] >= 3) {
            if ($user['last_attempt_time']) {
                $last_attempt = new DateTime($user['last_attempt_time']);
                $diff = $now->getTimestamp() - $last_attempt->getTimestamp();

                if ($diff < 300) { // 300 seconds = 5 minutes
                    $remaining = ceil((300 - $diff) / 60);
                    $_SESSION['login_error'] = "Too many failed attempts. Please try again in $remaining minute(s).";
                    header("Location: index.php");
                    exit();
                } else {
                    // Reset attempts after timeout
                    $conn->query("UPDATE users SET login_attempts = 0, last_attempt_time = NULL WHERE id = " . $user['id']);
                    $user['login_attempts'] = 0;
                }
            }
        }

        // 2. Verify Password
        if (password_verify($password, $user['password'])) {
            // SUCCESS: Reset attempts
            $conn->query("UPDATE users SET login_attempts = 0, last_attempt_time = NULL WHERE id = " . $user['id']);
            
            $_SESSION['user_id'] = $user['id']; 
            $_SESSION['username'] = $user['username'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            
            // Redirect based on role
            if ($user['role'] === 'Student') {
                header("Location: book.php"); 
            } else {
                header("Location: managelecturer.php"); 
            }
            exit();
        } else {
            // FAILURE: Update attempts
            $new_attempts = $user['login_attempts'] + 1;
            $conn->query("UPDATE users SET login_attempts = $new_attempts, last_attempt_time = NOW() WHERE id = " . $user['id']);
            
            $attempts_left = 3 - $new_attempts;
            if ($attempts_left <= 0) {
                $_SESSION['login_error'] = "Invalid password. Account locked for 5 minutes.";
            } else {
                $_SESSION['login_error'] = "Invalid password! $attempts_left attempts remaining.";
            }
        }
    } else {
        $_SESSION['login_error'] = "Invalid email or password!";
    }
    header("Location: index.php");
    exit();
}
?>
