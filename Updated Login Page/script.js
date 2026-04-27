function showForm(formId) {
document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
document.getElementById(formId).classList.add("active");
}

function showPage(pageId) {
    const pages = ['page-profile', 'page-customize', 'page-password', 'page-security-q', 'page-help', 'page-edit-name'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
    window.scrollTo(0, 0);
}