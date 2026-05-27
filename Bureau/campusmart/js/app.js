// CampusMart — JavaScript principal

// Toast notification
function showToast(msg, type = '') {
    let t = document.querySelector('.toast');
    if (!t) {
        t = document.createElement('div');
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className   = 'toast' + (type ? ' ' + type : '');
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Auto-resize textarea
document.querySelectorAll('textarea.chat-input').forEach(ta => {
    ta.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
});

// Fermeture modale en cliquant dehors
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

// Annuler les soumissions multiples de formulaires
document.querySelectorAll('form').forEach(f => {
    f.addEventListener('submit', function () {
        const btn = this.querySelector('[type=submit]');
        if (btn) {
            setTimeout(() => {
                btn.disabled = true;
                btn.style.opacity = '.6';
            }, 100);
        }
    });
});

// Formatage prix en temps réel
const prixInput = document.querySelector('input[name=prix]');
if (prixInput) {
    prixInput.addEventListener('blur', function () {
        const val = parseFloat(this.value);
        if (!isNaN(val)) this.value = Math.round(val / 50) * 50;
    });
}
