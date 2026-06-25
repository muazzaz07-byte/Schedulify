let currentSlotId = null;

// 1. Tunjukkan Modal Konfirmasi (Unblock Card Data Grabber)
function confirmUnblock(slotId) {
    currentSlotId = slotId;
    const slotElement = document.getElementById(`slot-${slotId}`);
    
    if (slotElement) {
        // Ambil data dari h3 tags di dalam card yang ditekan secara dinamik
        const details = slotElement.querySelectorAll('h3');
        document.getElementById('modalDate').innerText = details[0].innerText;
        document.getElementById('modalTime').innerText = details[1].innerText;
        document.getElementById('modalDays').innerText = details[2].innerText;

        document.getElementById('unblock-overlay').classList.remove('hidden');
    } else {
        console.error(`DOM Element targets fail: slot-${slotId} not found.`);
    }
}

// 2. Tutup Modal Konfirmasi
function closeModal() {
    document.getElementById('unblock-overlay').classList.add('hidden');
    currentSlotId = null;
}

// 3. Tembak Data ke Backend API & Papar Sistem Notifikasi Schedulify
function executeUnblock() {
    if (!currentSlotId) return;

    fetch('/api/cancel-appointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            slot_id: currentSlotId,
            reason: "Slot unblocked via blocked slots management panel."
        })
    })
    .then(response => response.json())
    .then(data => {
        // Tutup modal konfirmasi asal terlebih dahulu
        closeModal();

        if (data.status === 'success') {
            // Buang card dari skrin secara reaktif
            const slotToRemove = document.getElementById(`slot-${currentSlotId}`);
            if (slotToRemove) {
                slotToRemove.remove();
            }
            
            // Panggil Custom System Modal Schedulify menggantikan default browser alert
            showSystemModal("Success", "The time slot has been successfully unblocked and is now available for student booking.");
            checkEmptyState();
        } else {
            // Papar ralat pangkalan data menggunakan reka bentuk sistem kita sendiri
            showSystemModal("Database Error", data.message);
        }
    })
    .catch(error => {
        console.error("Fetch Network Pipeline Failure:", error);
        closeModal();
        showSystemModal("Network Error", "Failed to communicate with the database server.");
    });
}

// 4. Semak empty-state secara real-time
function checkEmptyState() {
    const container = document.getElementById('slots-container');
    const emptyState = document.getElementById('empty-state');
    const remainingSlots = container.getElementsByClassName('slot-item');
    
    if (remainingSlots.length === 0) {
        if (!emptyState) {
            // Jika element empty state tiada secara statik, bina secara reaktif
            const newEmptyState = document.createElement('div');
            newEmptyState.id = 'empty-state';
            newEmptyState.innerHTML = `<p class="empty-text">No Blocked Slot for this time</p>`;
            container.appendChild(newEmptyState);
        } else {
            emptyState.classList.remove('hidden');
            emptyState.style.display = 'block';
        }
    }
}

// --- UTILITY DRIVERS FOR INTERACTIVE SCHEDULIFY SYSTEM NOTIFICATION ---
function showSystemModal(title, message) {
    const modal = document.getElementById('system-notification-modal');
    const titleEl = document.getElementById('system-modal-title');
    const msgEl = document.getElementById('system-modal-message');
    
    if (modal && titleEl && msgEl) {
        titleEl.innerText = title;
        msgEl.innerText = message;
        
        // Tukar warna tajuk mengikut jenis respon/alert
        if (title.toLowerCase().includes('error') || title.toLowerCase().includes('failed') || title.toLowerCase().includes('alert')) {
            titleEl.classList.add('danger-title');
        } else {
            titleEl.classList.remove('danger-title');
        }
        
        modal.classList.remove('hidden');
    }
}

function closeSystemModal() {
    const modal = document.getElementById('system-notification-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}