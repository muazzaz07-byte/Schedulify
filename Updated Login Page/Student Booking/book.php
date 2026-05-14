<?php
session_start();
include 'config.php';

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}


// Fetch lecturers including their office location from the users table
$lecturers_res = $conn->query("SELECT id, username, name, office_location FROM users WHERE role = 'Lecturer'");
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedulify - Book Appointment</title>
    <link rel="stylesheet" href="book.css">
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
        <!-- STEP 1: LECTURER SELECTION -->
        <section id="step-lecturer" class="view">
            <h2 class="section-title">Select lecturer -</h2>
            <div class="lecturer-grid">
                <?php if ($lecturers_res->num_rows > 0): ?>
                    <?php while($row = $lecturers_res->fetch_assoc()): ?>
                        <?php 
                            $displayName = addslashes($row['username'] ?? $row['name']); 
                            $officeLoc = addslashes($row['office_location'] ?? 'Not Set'); 
                        ?>
                        <button class="card btn-effect" onclick="selectLecturer('<?php echo $displayName; ?>', '<?php echo $officeLoc; ?>')">
                            <img src="iconprofile.png" alt="Lecturer">
                            <span><?php echo htmlspecialchars($row['username'] ?? $row['name']); ?></span>
                        </button>
                    <?php endwhile; ?>
                <?php else: ?>
                    <p style="text-align: center; grid-column: 1/-1;">No lecturers found in the system.</p>
                <?php endif; ?>
            </div>
        </section>

        <!-- STEP 2: CALENDAR VIEW -->
        <section id="step-calendar" class="view hidden">
            <div class="lecturer-header-container">
                <p class="breadcrumb">Choose time slot</p>
                <div class="lecturer-info">
                    <h2 id="display-lecturer-name"></h2>
                    <p id="display-lecturer-location"></p>
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

        <!-- MODAL: CONFIRMATION -->
        <div id="modal-confirm" class="modal hidden">
            <div class="modal-content">
                <h1>Confirm appointment?</h1>
                <p>You are booking a session with</p>
                <h3 id="confirm-name" style="color: #004aad;"></h3>
                <p id="confirm-date"></p>
                <p id="confirm-location" style="font-weight: bold; color: #4a5568;"></p>
                <p id="confirm-time"></p>
                <div class="modal-btns">
                    <button class="btn-yes btn-effect" onclick="submitBooking()">Yes</button>
                    <button class="btn-cancel btn-effect" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- MODAL: SUCCESS -->
        <div id="modal-success" class="modal hidden">
            <div class="modal-content">
                <h1 style="color: #004aad; font-size: 2.5rem;">Success!</h1>
                <h2 style="margin: 20px 0; color: #334155;">Your appointment is successfully confirmed.</h2>
                <button class="btn-yes btn-effect" onclick="location.href='appointments.php'">Done</button>
            </div>
        </div>
    </main>

    <script src="book.js"></script>
</body>
</html>