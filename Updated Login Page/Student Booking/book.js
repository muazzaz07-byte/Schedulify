// 1. Global State Management
let selectedLecturer = "";
let selectedLocation = ""; 
let selectedDate = "";
let selectedTime = "";
let currentWeekOffset = 0;

// 2. Navigation Logic
window.onpopstate = function(event) {
    document.getElementById('step-calendar').classList.add('hidden');
    document.getElementById('step-lecturer').classList.remove('hidden');
    selectedLecturer = "";
    selectedLocation = "";
};

// 3. Lecturer Selection
function selectLecturer(name, location) {
    selectedLecturer = name; 
    selectedLocation = location; 

    window.history.pushState({ step: 'calendar' }, "Calendar View", "#calendar");

    const nameElem = document.getElementById('display-lecturer-name');
    const locElem = document.getElementById('display-lecturer-location');

    if (nameElem) nameElem.innerText = name;
    if (locElem) {
        locElem.innerText = (location && location !== 'Not Set') ? location : "Location to be confirmed";
        locElem.style.display = 'block'; 
    }

    document.getElementById('step-lecturer').classList.add('hidden');
    document.getElementById('step-calendar').classList.remove('hidden');
    renderCalendar(); 
}

// 4. Modal Management
function openConfirmation(time, date, isBooked, isPast, isBlocked) {
    if (isPast) return;
    if (isBooked) return alert("This slot is already booked!");
    if (isBlocked) return alert("This slot is blocked by the lecturer!");

    selectedDate = date; 
    selectedTime = time; 

    document.getElementById('confirm-name').innerText = selectedLecturer;
    
    const modalLoc = (selectedLocation && selectedLocation !== 'Not Set') ? selectedLocation : "Location to be confirmed";
    document.getElementById('confirm-location').innerText = "Location: " + modalLoc;
    
    document.getElementById('confirm-date').innerText = "Date: " + date;
    document.getElementById('confirm-time').innerText = "Time: " + time + " - " + calculateEndTime(time);

    document.getElementById('modal-confirm').classList.remove('hidden');
}

// 5. Database Submission (Using booking_confirm.php)
function submitBooking() {
    const formData = new FormData();
    formData.append('lecturer_name', selectedLecturer);
    formData.append('appointment_date', selectedDate);
    formData.append('appointment_time', selectedTime);

    fetch('booking_confirm.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        if (data.trim() === "success") {
            document.getElementById('modal-confirm').classList.add('hidden');
            document.getElementById('modal-success').classList.remove('hidden');
            renderCalendar(); // Refresh calendar to show the new red slot
        } else {
            alert("Database Error: " + data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("An error occurred while communicating with the server.");
    });
}

// 6. Real-Time Calendar Rendering (Using booked_slot.php)
function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const slotsContainer = document.getElementById('time-slots');
    daysContainer.innerHTML = "<p>Loading slots...</p>"; 

    // 1. Fetch real booked data from your bridge file
    fetch(`booked_slot.php?lecturer=${encodeURIComponent(selectedLecturer)}`)
        .then(response => response.json())
        .then(bookedSlots => {
            daysContainer.innerHTML = "";
            slotsContainer.innerHTML = "";

            const days = ["MON", "TUE", "WED", "THU", "FRI"];
            const today = new Date();
            const currentDay = today.getDay();
            const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
            const startOfCurrentWeek = new Date(new Date().setDate(diffToMonday));
            startOfCurrentWeek.setHours(0, 0, 0, 0);

            const baseDate = new Date(startOfCurrentWeek);
            baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));

            // Render Day Headers
            days.forEach((day, index) => {
                const date = new Date(baseDate);
                date.setDate(date.getDate() + index);
                const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                daysContainer.innerHTML += `<div class="day-col"><h4>${day}</h4><span>${dateStr}</span></div>`;
            });

            // Render Time Slots
            for (let hour = 8; hour < 18; hour++) {
                for (let min of ["00", "30"]) {
                    let period = hour >= 12 ? "PM" : "AM";
                    let displayHour = hour > 12 ? hour - 12 : hour;
                    if (displayHour === 0) displayHour = 12;
                    let timeLabel = `${displayHour}:${min} ${period}`;

                    for (let i = 0; i < 5; i++) {
                        const date = new Date(baseDate);
                        date.setDate(date.getDate() + i);
                        const slotDateTime = new Date(date);
                        slotDateTime.setHours(hour, parseInt(min), 0, 0);
                        
                        const isPast = slotDateTime < new Date();
                        const dateStrFull = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
                        
                        // Check if this specific date|time exists in the database array
                        const currentSlotKey = `${dateStrFull}|${timeLabel}`;
                        const isBooked = bookedSlots.includes(currentSlotKey);
                        
                        // Set the Red class if booked
                        let statusClass = isBooked ? "booked" : ""; 
                        if (isPast) statusClass += " disabled-slot";
                        
                        slotsContainer.innerHTML += `
                            <div class="slot ${statusClass}" 
                                 onclick="openConfirmation('${timeLabel}', '${dateStrFull}', ${isBooked}, ${isPast}, false)"
                                 ${isPast ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>
                                ${timeLabel}
                            </div>
                        `;
                    }
                }
            }
        })
        .catch(err => {
            console.error("Error loading slots:", err);
            slotsContainer.innerHTML = "<p>Error loading availability.</p>";
        });
}

function changeWeek(direction) {
    const newOffset = currentWeekOffset + direction;
    if (newOffset >= 0 && newOffset <= 4) {
        currentWeekOffset = newOffset;
        renderCalendar();
    }
}

function calculateEndTime(startTime) {
    if (startTime.includes("00")) return startTime.replace("00", "30");
    let parts = startTime.split(":");
    let h = parseInt(parts[0]);
    let p = startTime.split(" ")[1];
    if (h === 11 && p === "AM") return "12:00 PM";
    if (h === 12) return "1:00 PM";
    return (h + 1) + ":00 " + p;
}

function closeModal() { document.getElementById('modal-confirm').classList.add('hidden'); }