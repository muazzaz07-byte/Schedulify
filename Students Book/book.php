<?php
session_start();
include 'config.php';

// Fetch lecturers dynamically from the database
$lecturers_res = $conn->query("SELECT id, username, name FROM users WHERE role = 'Lecturer'");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedulify - Book Appointment</title>
    <link rel="stylesheet" href="book.css">
    <script src="book.js"></script>
</head>
<body>

    <header class="navbar">
        <div class="logo">Schedulify</div>
        <nav class="nav-buttons">
            <button class="active" onclick="location.href='book.php'">Book Appointment</button>
            <button onclick="location.href='appointments.php'">My Appointments</button>
            <button onclick="location.href='cancellation.php'">Cancellation Appoint</button>
            <button onclick="location.href='notification.php'">Notification</button>
            <button onclick="location.href='feedback.php'">Feedback</button>
            <button onclick="location.href='profile.php'">Profile</button>
        </nav>
    </header>

    <main class="container">
        <section id="step-lecturer" class="view">
            <h2 class="section-title">Select lecturer -</h2>
            <div class="lecturer-grid">
                <?php if ($lecturers_res->num_rows > 0): ?>
                    <?php while($row = $lecturers_res->fetch_assoc()): ?>
                        <button class="card btn-effect" onclick="selectLecturer('<?php echo addslashes($row['username'] ?? $row['name']); ?>')">
                            <!-- Using a default icon since images are local files -->
                            <img src="iconprofile.png" alt="Lecturer">
                            <span><?php echo htmlspecialchars($row['username'] ?? $row['name']); ?></span>
                        </button>
                    <?php endwhile; ?>
                <?php else: ?>
                    <p style="text-align: center; grid-column: 1/-1;">No lecturers found in the system.</p>
                <?php endif; ?>
            </div>
        </section>

        <section id="step-calendar" class="view hidden">
            <div class="lecturer-header-container">
                <p class="breadcrumb">Choose time slot</p>
                <div class="lecturer-info">
                    <h2 id="display-lecturer-name"></h2>
                    <p>Lecturer Room, Block A (Level 3)</p>
                </div>
            </div>

            <div class="calendar-wrapper">
                <button class="arrow-btn left btn-effect" onclick="changeWeek(-1)">&#9664;</button>
                <div class="calendar-card">
                    <div class="calendar-header" id="calendar-days"></div>
                    <div class="time-grid-container">
                        <div class="time-grid" id="time-slots"></div>
                    </div>
                </div>
                <button class="arrow-btn right btn-effect" onclick="changeWeek(1)">&#9654;</button>
            </div>
        </section>

        <!-- Modals remain the same but ensure Success redirect is .php -->
        <div id="modal-confirm" class="modal hidden">
            <div class="modal-content">
                <h1>Confirm appointment?</h1>
                <p>You are booking a session with</p>
                <h3 id="confirm-name" style="color: #004aad;"></h3>
                <p id="confirm-date"></p>
                <p>Lecturer Room, Block A (Level 3)</p>
                <p id="confirm-time"></p>
                <div class="modal-btns">
                    <button class="btn-yes btn-effect" onclick="showSuccess()">Yes</button>
                    <button class="btn-cancel btn-effect" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>

        <div id="modal-success" class="modal hidden">
            <div class="modal-content">
                <h1 style="color: #004aad; font-size: 2.5rem;">Success!</h1>
                <h2 style="margin: 20px 0; color: #334155;">Your appointment is successfully confirmed.</h2>
                <p style="margin-bottom: 20px;">To check your appointment approval, click Done</p>
                <button class="btn-yes btn-effect" onclick="location.href='appointments.php'">Done</button>
            </div>
        </div>
    </main>
</body>
</html>