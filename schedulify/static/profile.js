// Fungsi untuk tukar page tanpa refresh
        function showPage(pageId) {
            // Sembunyikan semua page
            const pages = ['page-profile', 'page-customize', 'page-password', 'page-security-q', 'page-help'];
            pages.forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            // Tunjukkan page yang dipilih
            document.getElementById(pageId).classList.remove('hidden');
            // Scroll ke atas
            window.scrollTo(0, 0);
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