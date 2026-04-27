<?php
session_start();

$errors = [
    'login' => $_SESSION['login_error'] ?? '',
    'register' => $_SESSION['register_error'] ?? ''
];
$activeForm = $_SESSION['active_form'] ?? 'login';

$reg_data = [
    'name' => $_SESSION['reg_name'] ?? '',
    'email' => $_SESSION['reg_email'] ?? '',
    'question' => $_SESSION['reg_question'] ?? '',
    'answer' => $_SESSION['reg_answer'] ?? ''
];

unset($_SESSION['login_error'], $_SESSION['register_error'], $_SESSION['active_form']);

function showMessage($message) {
    if (empty($message)) return '';
    $class = (strpos(strtolower($message), 'successful') !== false) ? 'msg-success' : 'msg-error';
    return "<p class='$class'>$message</p>";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Schedulify | Login & Register</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .form-box { display: none; }
        .form-box.active { display: block; }
        .forgot-container { text-align: right; margin-bottom: 15px; margin-top: -10px; }
        .forgot-link { font-size: 12px; color: #6b7280; text-decoration: none; }
        .forgot-link:hover { text-decoration: underline; color: #004aad; }
        .msg-error { color: #dc2626; background: #fee2e2; padding: 10px; border-radius: 5px; font-size: 13px; margin-bottom: 15px; }
        .msg-success { color: #16a34a; background: #dcfce7; padding: 10px; border-radius: 5px; font-size: 13px; margin-bottom: 15px; }
        
        .password-container {
            position: relative;
            width: 100%;
        }
        .password-container input {
            width: 100%;
            padding-right: 40px;
        }
        .toggle-password {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #6b7280;
            font-size: 18px;
            user-select: none;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="form-box <?php echo ($activeForm === 'login') ? 'active' : ''; ?>" id="login-form">
        <form action="login_register.php" method="POST">
            <h2>Schedulify</h2>
            <?php echo showMessage($errors['login']); ?>
            <input type="email" name="email" placeholder="Email" required>
            
            <div class="password-container">
                <input type="password" name="password" id="login-pass" placeholder="Password" required>
                <span class="toggle-password" onclick="togglePass('login-pass', this)">👁</span>
            </div>
            
            <div class="forgot-container">
                <a href="forgot.php" class="forgot-link">Forgot Password?</a>
            </div>

            <button type="submit" name="login">Login</button>
            <p>Need an account? <a href="#" onclick="showForm('register-form')">Register</a></p>
        </form>
    </div>

    <div class="form-box <?php echo ($activeForm === 'register') ? 'active' : ''; ?>" id="register-form">
        <form action="login_register.php" method="POST">
            <h2>Register</h2>
            <?php echo showMessage($errors['register']); ?>
            
            <input type="text" name="name" placeholder="Full Name" value="<?php echo htmlspecialchars($reg_data['name']); ?>" required>
            <input type="email" name="email" placeholder="Email" value="<?php echo htmlspecialchars($reg_data['email']); ?>" required>
            
            <div class="password-container">
                <input type="password" name="password" id="reg-pass" placeholder="Password" required>
                <span class="toggle-password" onclick="togglePass('reg-pass', this)">👁</span>
            </div>

            <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; text-align: left;">Security Question</label>
            <select class="select-style" name="security_question" required>
                <option value="" disabled <?php echo empty($reg_data['question']) ? 'selected' : ''; ?>>Select a question</option>
                <option value="What is your pet's name?" <?php echo ($reg_data['question'] == "What is your pet's name?") ? 'selected' : ''; ?>>What is your pet's name?</option>
                <option value="What is your mother's maiden name?" <?php echo ($reg_data['question'] == "What is your mother's maiden name?") ? 'selected' : ''; ?>>What is your mother's maiden name?</option>
                <option value="What city were you born in?" <?php echo ($reg_data['question'] == "What city were you born in?") ? 'selected' : ''; ?>>What city were you born in?</option>
            </select>

            <input type="text" name="security_answer" placeholder="Your answer" value="<?php echo htmlspecialchars($reg_data['answer']); ?>" required style="margin: 10px 0 20px 0;">

            <button type="submit" name="register">Register</button>
            <p>Already have an account? <a href="#" onclick="showForm('login-form')">Login</a></p>
        </form>
    </div>
</div>

<script>
    function showForm(id) {
        document.querySelectorAll('.form-box').forEach(box => box.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    function togglePass(inputId, icon) {
        const passInput = document.getElementById(inputId);
        if (passInput.type === "password") {
            passInput.type = "text";
            icon.textContent = "◡";
        } else {
            passInput.type = "password";
            icon.textContent = "👁";
        }
    }
</script>
</body>
</html>