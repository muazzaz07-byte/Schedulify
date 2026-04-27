<?php
session_start();
include 'config.php';

$step = 1;
$user_data = null;
$msg = "";
$msg_type = "error"; // Default to error styling

// STEP 1: Check if Email exists
if (isset($_POST['check_email'])) {
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $result = $conn->query("SELECT * FROM users WHERE email = '$email'");
    
    if ($result->num_rows > 0) {
        $user_data = $result->fetch_assoc();
        $_SESSION['reset_email'] = $email;
        $_SESSION['temp_question'] = $user_data['security_question'];
        $step = 2; 
    } else {
        $msg = "Email not found!";
    }
}

// STEP 2: Verify Security Answer
if (isset($_POST['verify_answer'])) {
    $email = $_SESSION['reset_email'];
    $answer = mysqli_real_escape_string($conn, $_POST['answer']);
    
    $result = $conn->query("SELECT * FROM users WHERE email = '$email' AND security_answer = '$answer'");
    
    if ($result->num_rows > 0) {
        $step = 3; 
    } else {
        $msg = "Incorrect answer!";
        $step = 2;
    }
}

// STEP 3: Update Password Logic
if (isset($_POST['update_password'])) {
    $email = $_SESSION['reset_email'];
    $new_password = password_hash($_POST['new_password'], PASSWORD_DEFAULT);

    $sql = "UPDATE users SET password = '$new_password' WHERE email = '$email'";
    
    if ($conn->query($sql)) {
        $_SESSION['login_error'] = "Password updated successfully! Please login.";
        unset($_SESSION['reset_email'], $_SESSION['temp_question']);
        header("Location: index.php");
        exit();
    } else {
        $msg = "Database error. Please try again.";
        $step = 3;
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset Password | Schedulify</title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* Specific styling for the reset steps */
        .instruction-text { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
        .question-box { 
            background: #f3f4f6; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            border-left: 4px solid #004aad;
            text-align: left;
        }
        .msg-error { color: #d9534f; font-size: 14px; margin-bottom: 15px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="form-box active">
            <h2>Reset Password</h2>
            
            <?php if(!empty($msg)) echo "<p class='msg-error'>$msg</p>"; ?>

            <?php if ($step == 1): ?>
                <form method="POST">
                    <p class="instruction-text">Enter your registered email to find your account.</p>
                    <input type="email" name="email" placeholder="Email Address" required>
                    <button type="submit" name="check_email">Next</button>
                </form>

            <?php elseif ($step == 2): ?>
                <form method="POST">
                    <div class="question-box">
                        <strong>Security Question:</strong><br>
                        <?php echo $_SESSION['temp_question']; ?>
                    </div>
                    <input type="text" name="answer" placeholder="Your Answer" required>
                    <button type="submit" name="verify_answer">Verify Answer</button>
                </form>

            <?php elseif ($step == 3): ?>
                <form method="POST">
                    <p class="instruction-text">Answer verified. Please enter a new password.</p>
                    <input type="password" name="new_password" placeholder="New Password" required>
                    <button type="submit" name="update_password">Update Password</button>
                </form>
            <?php endif; ?>

            <p style="margin-top: 20px;">
                <a href="index.php" style="font-size: 13px; color: #004aad; text-decoration: none;">Back to Login</a>
            </p>
        </div>
    </div>
</body>
</html>