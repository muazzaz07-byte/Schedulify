<?php
session_start();
include 'config.php';

// 1. Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$status_message = "";
// Set default view to profile
$active_page = 'page-profile';

// 2. Handle POST Requests (Updating data)
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    // --- Update Username ---
    if (isset($_POST['save_username'])) {
        $active_page = 'page-edit-username';
        $new_username = mysqli_real_escape_string($conn, $_POST['username']);
        $sql = "UPDATE users SET username = '$new_username' WHERE id = '$user_id'";
        if ($conn->query($sql)) {
            $_SESSION['username'] = $new_username; 
            $status_message = "Username updated successfully!";
            $active_page = 'page-profile'; 
        } else {
            $status_message = "Error updating username.";
        }
    }

// --- Update Password ---
    if (isset($_POST['save_password'])) {
        $active_page = 'page-password'; 
        $current_pass = $_POST['current_password'];
        $new_pass = $_POST['new_password'];
        $confirm_pass = $_POST['confirm_password'];

        // Regular Expression for: 
        // At least 1 uppercase, 1 lowercase, 1 number, 1 special character, and min 8 chars
        $password_regex = "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/";

        $res = $conn->query("SELECT password FROM users WHERE id = '$user_id'");
        $user_data = $res->fetch_assoc();

        if (password_verify($current_pass, $user_data['password'])) {
            if ($new_pass !== $confirm_pass) {
                $status_message = "New passwords do not match.";
            } elseif (!preg_match($password_regex, $new_pass)) {
                // This is the new requirement check
                $status_message = "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
            } else {
                $hashed_new = password_hash($new_pass, PASSWORD_DEFAULT);
                $conn->query("UPDATE users SET password = '$hashed_new' WHERE id = '$user_id'");
                $status_message = "Password changed successfully!";
                $active_page = 'page-profile'; 
            }
        } else {
            $status_message = "Incorrect current password.";
        }
    }

    // --- Update Security Questions ---
    if (isset($_POST['save_security'])) {
        $active_page = 'page-security-q';
        $question = mysqli_real_escape_string($conn, $_POST['security_question']);
        $answer = password_hash($_POST['security_answer'], PASSWORD_DEFAULT);
        
        $sql = "UPDATE users SET security_question = '$question', security_answer = '$answer' WHERE id = '$user_id'";
        if ($conn->query($sql)) {
            $status_message = "Security details updated!";
            $active_page = 'page-profile';
        } else {
            $status_message = "Error updating security details.";
        }
    }
}

// 3. Fetch Current Data for Display
$user_res = $conn->query("SELECT * FROM users WHERE id = '$user_id'");
$user = $user_res->fetch_assoc();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedulify - Profile</title>
    <link rel="stylesheet" href="profile.css">
    <style>
        .hidden { display: none; }
        
        /* New Error Banner Styles */
        .status-banner {
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            position: relative;
            font-weight: bold;
            text-align: center;
        }
        
        .close-btn {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            font-size: 20px;
        }
    </style>
    <script>
        function showPage(pageId) {
            const pages = ['page-profile', 'page-customize', 'page-password', 'page-security-q', 'page-edit-username', 'page-help'];
            pages.forEach(id => {
                const p = document.getElementById(id);
                if (p) p.classList.add('hidden');
            });

            const target = document.getElementById(pageId);
            if (target) {
                target.classList.remove('hidden');
                window.scrollTo(0, 0);
            }
        }

        window.onload = function() {
            // The browser alert is removed. The banner is handled by HTML/PHP below.
            var startPage = "<?php echo $active_page; ?>";
            showPage(startPage);
        }
    </script>
</head>
<body>

    <header class="navbar">
        <div class="logo">Schedulify</div>
        <nav class="nav-buttons">
            <button onclick="location.href='book.php'">Book Appointment</button>
            <button onclick="location.href='appointments.php'">My Appointments</button>
            <button onclick="location.href='cancellation.php'">Cancellation Appoint</button>
            <button onclick="location.href='notification.php'">Notification</button>
            <button onclick="location.href='feedback.php'">Feedback</button>
            <button class="active" onclick="location.href='profile.php'">Profile</button>
        </nav>
    </header>

    <div class="container">
        <?php if (!empty($status_message)): ?>
            <div class="status-banner">
                <?php echo htmlspecialchars($status_message); ?>
                <span class="close-btn" onclick="this.parentElement.style.display='none'">&times;</span>
            </div>
        <?php endif; ?>

        <div id="page-profile">
            <h1>Profile</h1>
            <div class="card">
                <div class="profile-info">
                    <div class="user-details">
                        <h2 class="username"><?php echo htmlspecialchars($user['username'] ?? $user['name']); ?></h2> 
                        <span class="email"><?php echo htmlspecialchars($user['email']); ?></span>
                    </div>
                    <span class="role"><?php echo htmlspecialchars($user['role'] ?? 'Student'); ?></span>
                </div>
                <div class="divider"></div>
                <a class="menu-link" onclick="showPage('page-customize')">Customize Profile</a>
                <div class="divider"></div>
                <a class="menu-link" onclick="showPage('page-help')">Help Centre</a>
                <div class="divider"></div>
                <a class="menu-link" href="logout.php" style="color: #004aad;">Logout</a>
            </div>
        </div>

        <div id="page-customize" class="hidden">
            <h1>Customize Profile</h1>
            <div class="card">
                <h3>Account details</h3>
                <p style="margin: 15px 0;">Email : <?php echo htmlspecialchars($user['email']); ?></p>
                <div class="divider"></div>
                <h3>Role</h3>
                <p style="margin: 15px 0;"><?php echo htmlspecialchars($user['role'] ?? 'Student'); ?></p>
                <div class="divider"></div>
                <h3>Security</h3>
                <a class="menu-link" onclick="showPage('page-edit-username')">Edit Username</a>
                <a class="menu-link" onclick="showPage('page-password')">Change Password</a>
                <a class="menu-link" onclick="showPage('page-security-q')">Update Security Questions</a>
                <div style="text-align: right; margin-top: 20px;">
                    <button class="save-btn" onclick="showPage('page-profile')">Back</button>
                </div>
            </div>
        </div>

        <div id="page-edit-username" class="hidden">
            <h1>Edit Username</h1>
            <div class="card">
                <form method="POST">
                    <div class="form-group" style="margin: 50px 0;">
                        <input type="text" name="username" value="<?php echo htmlspecialchars($user['username'] ?? $user['name']); ?>" placeholder="New Username" required>
                    </div>
                    <div style="text-align: right;">
                        <button type="submit" name="save_username" class="save-btn">Save</button>
                        <button type="button" class="save-btn" onclick="showPage('page-customize')" style="background:#ccc; color:#333;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

<div id="page-password" class="hidden">
    <h1>Change Password</h1>
    <div class="card">
        <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">
            Requirement: Min. 8 characters (Uppercase, Lowercase, Number, & Symbol).
        </p>
        <form method="POST">
            <div class="form-group"><input type="password" name="current_password" placeholder="Current Password" required></div>
            <div class="form-group">
                <input type="password" name="new_password" placeholder="New Password" 
                       pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&]).{8,}" 
                       title="Must contain at least one number, one uppercase and lowercase letter, one special character, and at least 8 characters" 
                       required>
            </div>
            <div class="form-group"><input type="password" name="confirm_password" placeholder="Confirm Password" required></div>
            <div style="text-align: right;">
                <button type="submit" name="save_password" class="save-btn">Save</button>
                <button type="button" class="save-btn" onclick="showPage('page-customize')" style="background:#ccc; color:#333;">Cancel</button>
            </div>
            </form>
        </div>
    </div>

        <div id="page-security-q" class="hidden">
            <h1>Update Security Questions</h1>
            <div class="card">
                <form method="POST">
                    <div class="form-group">
                        <select name="security_question" required style="width: 100%; padding: 10px; margin-bottom: 20px;">
                            <option value="pet">What was your first pet's name?</option>
                            <option value="mother">What is your mother's maiden name?</option>
                            <option value="school">What was the name of your primary school?</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="text" name="security_answer" placeholder="Type your answer here..." required style="width: 100%; padding: 10px;">
                    </div>
                    <div style="text-align: right; margin-top: 30px;">
                        <button type="submit" name="save_security" class="save-btn">Save</button>
                        <button type="button" class="save-btn" onclick="showPage('page-customize')" style="background:#ccc; color:#333;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="page-help" class="hidden">
             <h1>Help Centre</h1>
             <div class="card">
                <p>Welcome to the Help Centre. If you need assistance with Schedulify, please contact support.</p>
                <div style="text-align: right; margin-top: 20px;">
                    <button class="save-btn" onclick="showPage('page-profile')">Back</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>