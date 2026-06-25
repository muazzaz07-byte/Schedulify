let currentWeekOffset = 0;
let lecturerSlotsData = {}; // Global dictionary to hold fetched slot details

// Automatically run initialization when page fires up
window.onload = function() {
    fetchLecturerGrid();
};

// 1. Fetch live slot states from backend before rendering
function fetchLecturerGrid() {
    fetch('/api/get-lecturer-slots')
        .then(response => response.json())
        .then(data => {
            lecturerSlotsData = data; // Save data dictionary securely
            renderCalendar();         // Generate calendar once dataset is cached
        })
        .catch(err => {
            console.error("Critical error fetching lecturer slots data packet:", err);
            lecturerSlotsData = {};
            renderCalendar();
        });
}

function renderCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const slotsContainer = document.getElementById('time-slots');
    
    if (!daysContainer || !slotsContainer) return;
    
    daysContainer.innerHTML = "";
    slotsContainer.innerHTML = "";

    const days = ["MON", "TUE", "WED", "THU", "FRI"];
    
    // Find Monday of the current active system week profile boundary block
    const today = new Date();
    const currentDay = today.getDay();
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
    const startOfCurrentWeek = new Date(new Date().setDate(diffToMonday));
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // Calculate baseline calendar date range offset window tracking vectors
    const baseDate = new Date(startOfCurrentWeek);
    baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));

    // Render Calendar Header Columns
    days.forEach((day, index) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + index);
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        
        daysContainer.innerHTML += `
            <div class="day-col">
                <h4>${day}</h4>
                <span>${dateStr}</span>
            </div>
        `;
    });

    // Render Master Time Slots (8:00 AM - 6:00 PM Matrix Grid Arrays)
    for (let hour = 8; hour < 18; hour++) {
        for (let min of ["00", "30"]) {
            let period = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;
            if (displayHour === 0) displayHour = 12; 
            let timeLabel = `${displayHour}:${min} ${period}`;

            // Draw horizontal rows tracking Monday through Friday
            for (let i = 0; i < 5; i++) {
                const targetDate = new Date(baseDate);
                targetDate.setDate(targetDate.getDate() + i);
                
                let yearStr = targetDate.getFullYear();
                let monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
                let dayStr = String(targetDate.getDate()).padStart(2, '0');
                let hourStr = String(hour).padStart(2, '0');
                
                // FIXED: Formats match key strictly without trailing timezone shifts
                let dateStringISO = `${yearStr}-${monthStr}-${dayStr}`;
                let isoKeyCompare = `${dateStringISO}T${hourStr}:${min}:00`;

                // Calculate past expirations accurately based on timestamps
                let checkTime = new Date(targetDate);
                checkTime.setHours(hour, parseInt(min), 0, 0);
                const isPast = checkTime.getTime() < new Date().getTime();

                let statusClass = "available";
                let onClickAttr = "";
                let displayTxt = timeLabel;

                // --- LIVE DATABASE STRUCTURAL MATCH ENGINE ---
                if (lecturerSlotsData[isoKeyCompare]) {
                    let slotInfo = lecturerSlotsData[isoKeyCompare];

                    if (slotInfo.booked) {
                        statusClass = "booked";
                        displayTxt = slotInfo.student_name || "Booked Slot";
                        if (!isPast) {
                            onClickAttr = `onclick="openCancelFlow('${timeLabel}', '${dateStringISO}', ${slotInfo.slot_id}, '${displayTxt}')"`;
                        }
                    } else if (slotInfo.status === 'BLOCKED' || !slotInfo.is_available) {
                        statusClass = "blocked";
                        displayTxt = "BLOCKED";
                        if (!isPast) {
                            // FIXED: Replaced the standard window browser alert() with our custom HTML modal overlay handler
                            onClickAttr = `onclick="showBlockedSlotModal()"`;
                        }
                    }
                }

                if (isPast) {
                    statusClass += " disabled-slot";
                    onClickAttr = ""; 
                }

                slotsContainer.innerHTML += `
                    <div class="slot ${statusClass}" ${onClickAttr} ${isPast ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>
                        ${displayTxt}
                    </div>
                `;
            }
        }
    }
}

// Dynamic Pagination controls with automatic calendar refreshing bounds
function changeWeek(direction) {
    const newOffset = currentWeekOffset + direction;
    if (newOffset >= 0 && newOffset <= 4) {
        currentWeekOffset = newOffset;
        fetchLecturerGrid(); 
    }
}

// --- MODAL TRACKING CONTROLLERS ---
let activeTargetSlotId = null;
let selectedPostCancellationStatus = 'available'; // Default choice state

function openCancelFlow(time, date, slotId, studentName) {
    activeTargetSlotId = slotId; 
    
    const studentHeaderElement = document.getElementById('cancel-student-name');
    if (studentHeaderElement) studentHeaderElement.innerText = studentName;

    document.getElementById('cancel-date').innerText = "Date: " + date;
    document.getElementById('cancel-time').innerText = "Time: " + time;
    
    const commentBox = document.getElementById('cancelReasonBox');
    if (commentBox) commentBox.value = '';

    document.getElementById('modal-cancel').classList.remove('hidden');
}

function confirmCancellationAction() {
    if (!activeTargetSlotId) return;

    const commentBox = document.getElementById('cancelReasonBox');
    const customReasonText = commentBox ? commentBox.value.trim() : '';

    const payload = { 
        slot_id: activeTargetSlotId,
        reason: customReasonText
    };

    fetch('/api/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            showSuccess();
            fetchLecturerGrid(); 
        } else {
            alert("Error trying to process cancel transaction request: " + data.message);
        }
    })
    .catch(err => console.error("Network interface error calling cancel route: ", err));
}

function openReasonModal() {
    hideAllModals();
    document.getElementById('modal-reason').classList.remove('hidden');
}

// ADDED: MODAL CONTROLLER FOR BLOCKED OVERLAYS
function showBlockedSlotModal() {
    hideAllModals();
    const blockedModal = document.getElementById('modal-blocked-notice');
    if (blockedModal) {
        blockedModal.classList.remove('hidden');
    }
}

function openChoiceModal() {
    hideAllModals();
    document.getElementById('modal-choice').classList.remove('hidden');
}

// FIXED: Remapped name matching signature requested by HTML template element nodes
function openFinalConfirm(statusChoice) {
    hideAllModals();
    selectedPostCancellationStatus = statusChoice; 
    document.getElementById('modal-final').classList.remove('hidden');
}

function showSuccess() {
    hideAllModals();
    document.getElementById('modal-success').classList.remove('hidden');
}

function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.classList.add('hidden'));
}

function closeAllModals() {
    hideAllModals();
}

window.onclick = function(event) {
    const modalCancel = document.getElementById('modal-cancel');
    if (event.target === modalCancel) {
        closeAllModals();
    }
}