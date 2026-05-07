function showPage(pageId) {
    // Ensure 'page-help' is in this list
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

function saveUsername() {
    // 1. Ambil nilai daripada input field
    var newName = document.getElementById('input-username').value;

    // 2. Jika input tidak kosong, tukar nama di page profile
    if (newName.trim() !== "") {
        document.getElementById('display-username').innerText = newName;
    }
// Beritahu pengguna berjaya (opsional)
    alert("New username updated successfully!");

    // 3. Kembali ke page profile (profile.html context)
    showPage('page-profile');
    
    // Opsional: Kosongkan balik input field untuk kegunaan akan datang
    document.getElementById('input-username').value = "";
}

function togglePasswordVisibility(button, inputName) {
    const input = document.getElementsByName(inputName)[0];
    if (input.type === "password") {
        input.type = "text";
        button.innerHTML = "👁"; // Eye open icon
    } else {
        input.type = "password";
        button.innerHTML = "◡"; // Eye closed/masked icon
    }
}

// Pastikan fungsi showPage anda juga menyembunyikan page-edit-username
function showPage(pageId) {
    const pages = ['page-profile', 'page-customize', 'page-password', 'page-security-q', 'page-edit-username'];
    pages.forEach(id => {
        const p = document.getElementById(id);
        if (p) p.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

function saveSecurityQuestion() {
    const question = document.getElementById('security-question-select').value;
    const answer = document.getElementById('security-answer').value;

    // Validasi: Pastikan soalan dipilih dan jawapan tidak kosong
    if (question === "" || answer.trim() === "") {
        alert("Please select a question and provide an answer.");
        return;
    }

    // Logik simpan data anda di sini (contoh: hantar ke database/API)
    console.log("Question ID:", question);
    console.log("Answer:", answer);

    // Beritahu pengguna berjaya (opsional)
    alert("Security question updated successfully!");

    // Kembali ke profile
    showPage('page-profile');

    // Reset form untuk kegunaan akan datang
    document.getElementById('security-question-select').value = "";
    document.getElementById('security-answer').value = "";
}

        // Fungsi Accordion untuk FAQ
        function toggleFaq(element) {
            const item = element.parentElement;
            item.classList.toggle('active');
        }