<?php
session_start();
include 'config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];
$status_message = "";
$status_type = ""; 
$active_page = 'page-profile';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // --- Update Username ---
    if (isset($_POST['save_username'])) {
        $active_page = 'page-edit-username';
        $new_username = mysqli_real_escape_string($conn, $_POST['username']);
        $sql = "UPDATE users SET username = '$new_username' WHERE id = '$user_id'";
        if ($conn->query($sql)) {
            $_SESSION['username'] = $new_username; 
            $status_message = "Username updated successfully!";
            $status_type = "success";
            $active_page = 'page-profile'; 
        } else {
            $status_message = "Error updating username.";
            $status_type = "error";
        }
    }

    // --- Update Password ---
    if (isset($_POST['save_password'])) {
        $active_page = 'page-password'; 
        $current_pass = $_POST['current_password'];
        $new_pass = $_POST['new_password'];
        $confirm_pass = $_POST['confirm_password'];
        $password_regex = "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/";

        $res = $conn->query("SELECT password FROM users WHERE id = '$user_id'");
        $user_data = $res->fetch_assoc();

        if (password_verify($current_pass, $user_data['password'])) {
            if ($new_pass !== $confirm_pass) {
                $status_message = "New passwords do not match.";
                $status_type = "error";
            } elseif (!preg_match($password_regex, $new_pass)) {
                $status_message = "Password requirements not met.";
                $status_type = "error";
            } else {
                $hashed_new = password_hash($new_pass, PASSWORD_DEFAULT);
                $conn->query("UPDATE users SET password = '$hashed_new' WHERE id = '$user_id'");
                $status_message = "Password changed successfully!";
                $status_type = "success";
                $active_page = 'page-profile'; 
            }
        } else {
            $status_message = "Incorrect current password.";
            $status_type = "error";
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
            $status_type = "success";
            $active_page = 'page-profile';
        } else {
            $status_message = "Error updating security.";
            $status_type = "error";
        }
    }
}

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
        .status-banner { padding: 15px; margin: 20px auto; border-radius: 8px; max-width: 800px; text-align: center; }
        .status-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .password-wrapper { position: relative; width: 100%; }
        .toggle-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; }
    </style>
    <script>
        function showPage(pageId) {
            const pages = ['page-profile', 'page-customize', 'page-password', 'page-security-q', 'page-edit-username', 'page-help'];
            pages.forEach(id => { document.getElementById(id)?.classList.add('hidden'); });
            document.getElementById(pageId)?.classList.remove('hidden');
        }
        function togglePasswordVisibility(btn, name) {
            const input = document.getElementsByName(name)[0];
            input.type = input.type === "password" ? "text" : "password";
            btn.innerText = input.type === "password" ? "◡" : "👁";
        }
        window.onload = function() { showPage("<?php echo $active_page; ?>"); }
    </script>
</head>
<body>

<header class="navbar">
    <div class="logo">Schedulify</div>
    <nav class="nav-buttons">
        <button onclick="location.href='managelecturer.php'">Manage Appointment</button>
        <button onclick="location.href='blocklecturer.php'">Block Slot</button>
        <button class="active" onclick="location.href='unblocklecturer.php'">Manage Blocked Slot</button>
        <button onclick="location.href='appointmentlecturer.php'">My Appointment</button>
        <button onclick="location.href='historylecturer.php'">Appointment History</button>
        <button onclick="location.href='notificationlecturer.php'">Notification</button>
        <button onclick="location.href='feedbacklecturer.php'">Feedback</button>
        <button onclick="location.href='profilelecturer.php'">Profile</button>
    </nav>
</header>

    <div class="container">
        <!-- Dynamic Status Banner -->
        <?php if (!empty($status_message)): ?>
            <div class="status-banner <?php echo ($status_type == 'success') ? 'status-success' : 'status-error'; ?>">
                <?php echo htmlspecialchars($status_message); ?>
                <span class="close-btn" onclick="this.parentElement.style.display='none'">&times;</span>
            </div>
        <?php endif; ?>

        <div id="page-profile">
            <h1 style="text-align:center; color: #2d3748; margin: 40px 0;">Profile</h1>
            <div class="card">
                <div class="profile-header-container">
                    <div class="user-titles">
                        <h2 class="username"><?php echo htmlspecialchars($user['username'] ?? $user['name']); ?></h2>
                        <span class="role-text"><?php echo htmlspecialchars($user['role'] ?? 'Student'); ?></span>
                    </div>
                    <div class="user-email-display">
                        <?php echo htmlspecialchars($user['email']); ?>
                    </div>
                </div>
<div class="profile-menu-actions">
    <a class="menu-link" onclick="showPage('page-customize')">Customize Profile</a>
    <a class="menu-link" onclick="showPage('page-help')">Help Centre</a>
    <!-- Point this directly to index.php with the logout flag -->
    <a class="menu-link logout-link" href="index.php?logout=true">Logout</a>
</div>

        <div id="page-customize" class="hidden">
            <h1>Customize Profile</h1>
            <div class="card">
                <h3>Account details</h3>
                <p style="color: #718096; margin: 15px 0;">Email : <?php echo htmlspecialchars($user['email']); ?></p>
                <p style="color: #718096; margin: 5px 0;">Role : Student</p>
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
                    <div class="form-group" style="margin: 30px 0;">
                        <input type="text" name="username" value="<?php echo htmlspecialchars($user['username'] ?? $user['name']); ?>" required>
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
                <form method="POST">
                    <div class="form-group">
                        <div class="password-wrapper">
                            <input type="password" name="current_password" placeholder="Current Password" required>
                            <button type="button" class="toggle-password" onclick="togglePasswordVisibility(this, 'current_password')">👁</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="password-wrapper">
                            <input type="password" name="new_password" placeholder="New Password" required>
                            <button type="button" class="toggle-password" onclick="togglePasswordVisibility(this, 'new_password')">👁</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="password-wrapper">
                            <input type="password" name="confirm_password" placeholder="Confirm Password" required>
                            <button type="button" class="toggle-password" onclick="togglePasswordVisibility(this, 'confirm_password')">👁</button>
                        </div>
                    </div>

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
                        <select name="security_question" required style="width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 5px; border: 1px solid #ddd;">
                            <option value="pet">What was your first pet's name?</option>
                            <option value="mother">What is your mother's maiden name?</option>
                            <option value="school">What was the name of your primary school?</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="text" name="security_answer" placeholder="Type your answer here..." required style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                    </div>
                    <div style="text-align: right; margin-top: 30px;">
                        <button type="submit" name="save_security" class="save-btn">Save</button>
                        <button type="button" class="save-btn" onclick="showPage('page-customize')" style="background:#ccc; color:#333;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

            <!-- Help Centre / FAQ Page -->
        <div id="page-help" class="hidden">
            <h1 style="text-align:center; color: #2d3748; margin: 40px 0;">Help Centre</h1>
            <div class="card">
                <h3>Frequently Asked Questions</h3>
                <div class="divider"></div>
                
                <div style="margin-bottom: 20px;">
                    <p><strong>How do I book an appointment?</strong></p>
                    <p style="color: #718096; font-size: 0.9rem;">Go to "Book Appointment," select a lecturer, and choose an available time slot from the calendar.</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <p><strong>How do I know if my appointment is confirmed?</strong></p>
                    <p style="color: #718096; font-size: 0.9rem;">Check the "Notification" tab. You will see updates when a lecturer approves or rejects your booking.</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <p><strong>Can I change my username?</strong></p>
                    <p style="color: #718096; font-size: 0.9rem;">Yes, navigate to Customize Profile > Edit Username. This updates how lecturers see your name.</p>
                </div>

                <div style="text-align: right; margin-top: 30px;">
                    <button class="save-btn" onclick="showPage('page-profile')">Back to Profile</button>
                </div>
            </div>
        </div>
</body>
</html>