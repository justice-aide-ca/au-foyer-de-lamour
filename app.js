(function() {
'use strict';

const STORAGE_KEYS = { LANG: 'foyer_lang', CARNET_ID: 'foyer_carnet_id', CARNET_PREFIX: 'foyer_carnet_', TEMOIGNAGES: 'foyer_temoignages' };
const SITUATION_KEYS = ["SOUFFRANCE","SENS_VIE","COUPLE","DEUIL","SOLITUDE","COLERE_DIEU","DOUTE_FOI","DECISION","MALADIE","PEUR_AVENIR","EPUISEMENT","CONFLIT_FAMILIAL","ACCOMPAGNEMENT","RECHERCHE_SENS","AUTRE"];
const LANGS = ['fr', 'en', 'zh', 'hi', 'es', 'ar'];
const TOAST_ICONS = { info: "✅", warn: "⚠️", error: "🚫" };
const ROUTES = { '': 'accueil', '/': 'accueil', '/sagesse': 'sagesse', '/a-propos': 'apropos', '/examen': 'examen', '/sources': 'sources', '/contact': 'contact', '/confidentialite': 'confidentialite' };
const WORD_LIMITS = { sunday: 300, weekday: 200 };

let currentLang = 'fr';
let currentMode = 'discernement';
let currentSituationKey = null;
let examenIdx = 0;
let aelfLectures = [];

/* ---------- TRADUCTIONS ---------- */
const FR = {
    title: "🕯️ Au Foyer de l'Amour", subtitle: "Discernement et la petite lumière",
    placeholder: "Décrivez votre situation...", role: "Qui êtes-vous ? (optionnel)",
    submit: "Recevoir une aide au discernement →", loading: "Discernement en cours...",
    alertSituation: "Veuillez décrire votre situation ou choisir une option.",
    situationsTitle: "Ou choisissez ce qui correspond le mieux à ce que vous vivez :",
    precisionPlaceholder: "Tu peux préciser ce que tu vis, si tu le souhaites...",
    btnContinuer: "🌿 Continuer le discernement", ressourcesTitle: "Pour continuer...",
    textesTitle: "📖 Textes à méditer", prieresTitle: "🙏 Prières", contactsTitle: "👤 Contacts humains",
    ecouteTitle: "🆘 Services d'écoute", exercicesTitle: "✨ Exercices spirituels",
    revenirTitle: "🔄 Revenir", revenirRecommencer: "Recommencer", saveLink: "Sauvegarder mon lien",
    priereJourTitle: "📖 Prière du jour",
    temoignagesTitle: "💬 Vous avez utilisé Au Foyer de l'Amour ?",
    temoignagesIntro: "Partagez votre expérience (anonyme) :",
    temoignagesPlaceholder: "Votre témoignage...", envoyer: "Envoyer",
    merci: "🙏 Merci ! Votre témoignage reste sur votre appareil.",
    temoignagesRecus: "💬 Vos témoignages (sur cet appareil)",
    projetsPsaume: "🌱 « La justice et la paix s'embrassent. » — Psaume 85,11",
    projetsCredit: "Des outils pour la justice, la paix et le discernement.",
    footerNothing: "🔒 Rien n'est enregistré · 🕊️ Un compagnon silencieux",
    footerHome: "🏠 Accueil", footerSagesse: "📖 Sagesse", footerAbout: "📖 À propos",
    footerSources: "📚 Sources", footerPrivacy: "🔒 Confidentialité", footerContact: "✉️ Contact",
    navHome: "🏠 Accueil", navSagesse: "📖 Sagesse", navAbout: "📖 À propos",
    navExamen: "🕯️ Examen", navSources: "📚 Sources", navContact: "✉️ Contact", navPrivacy: "🔒 Confidentialité",
    aiWarning: "Je suis une intelligence artificielle. Je ne remplace pas un accompagnement humain, un prêtre, un psychologue ou un médecin.",
    toggleUrgence: "Voir les numéros d'urgence",
    clauseText: "🙏 <strong>À propos d'Au Foyer de l'Amour</strong><br>Cet outil offre une <strong>première écoute</strong> et une <strong>aide au discernement</strong>.",
    retour: "← Retour à l'accueil",
    situations: ["Je traverse une grande souffrance","Je ne vois plus de sens à ma vie","Mon couple va mal","J'ai perdu un être cher","Je me sens seul(e)","Je suis en colère contre Dieu","Je ne sais plus quoi croire","Je dois prendre une décision difficile","Je vis une maladie ou un handicap","J'ai peur de l'avenir","Je suis épuisé(e)","Je vis un conflit familial","J'accompagne une personne en souffrance","Je cherche un sens à ma vie","Autre chose"],
    prieres: ["Seigneur, apprends-moi à écouter le silence.","Donne-moi la force d'accueillir ce que je ne comprends pas.","Que Ta paix habite mon cœur."],
    defaultTestimonials: ["« Une paix profonde. »","« Un espace de silence précieux. »"],
    carnetPrompt: "✨<br><br>« Et toi, quelle petite lumière pourrais-tu noter aujourd'hui ? »",
    carnetPlaceholder: "Ma petite lumière...", saveBtn: "💾 Sauvegarder", copyBtn: "🔗 Copier mon lien", shareBtn: "📤 Partager",
    carnetInfo: "Tu pourras revenir plus tard avec ton lien.",
    modes: { discernement: "🤲 Discernement", consolation: "🙏 Consolation", lecture: "📖 Lecture biblique", priere: "❤️ Prière" },
    homelieTitle: "Préparation d'homélie",
    homelieDescription: "Entrez les lectures ou chargez-les depuis l'AELF.",
    labelLecture1: "Première lecture :", labelPsaume: "Psaume :",
    labelLecture2: "Deuxième lecture :", labelEvangile: "Évangile :",
    labelTheme: "Message retenu (optionnel) :", homelieButton: "Générer une proposition d'homélie",
    homelieLoading: "Préparation de l'homélie...",
    ecouteList: ["Urgence : numéro d'urgence de votre pays","Centres d'écoute : befrienders.org","En détresse : parlez-en à une personne de confiance"],
    contactPretreText: "Trouver un prêtre ou un accompagnant", contactPretreUrl: "https://www.cccb.ca/fr/dioceses/",
    contactCommunauteText: "Communauté près de chez vous", contactCommunauteUrl: "https://www.cccb.ca/fr/paroisses/",
    textesParSituation: {
        SOUFFRANCE: [{ ref: "Psaume 22", texte: "Mon Dieu, mon Dieu, pourquoi m'as-tu abandonné ?", lien: "https://www.aelf.org/bible/Ps/22" },{ ref: "Isaïe 53", texte: "C'étaient nos souffrances qu'il portait", lien: "https://www.aelf.org/bible/Is/53" },{ ref: "Matthieu 5,4", texte: "Heureux ceux qui pleurent", lien: "https://www.aelf.org/bible/Mt/5" }],
        AUTRE: [{ ref: "Psaume 62", texte: "En Dieu seul mon repos", lien: "https://www.aelf.org/bible/Ps/62" },{ ref: "Isaïe 41,10", texte: "Ne crains rien, je suis avec toi", lien: "https://www.aelf.org/bible/Is/41" },{ ref: "Matthieu 11,28", texte: "Venez à moi, vous qui peinez", lien: "https://www.aelf.org/bible/Mt/11" }]
    },
    prieresParSituation: { defaut: [{ titre: "Prière du matin", texte: "Seigneur, en ce matin, je te confie ma journée. Amen." },{ titre: "Prière pour les jours difficiles", texte: "Seigneur, je te confie mes peurs. Tiens-moi par la main. Amen." },{ titre: "Prière du soir", texte: "Seigneur, je te remercie pour ce jour. Accorde-moi le repos. Amen." }] },
    exercicesIgnatiens: [{ titre: "L'examen de conscience", texte: "Passe en revue ta journée. Où as-tu ressenti de la paix ? Du trouble ?" },{ titre: "La relecture de vie", texte: "Choisis un événement. Relis-le à la lumière de Dieu." },{ titre: "Le discernement des esprits", texte: "Ce qui apporte une paix profonde vient de Dieu." },{ titre: "L'oraison silencieuse", texte: "Choisis un mot et répète-le doucement dans ton cœur." }],
    pageExamen: { title: "🕯️ Examen de conscience guidé", intro: "Cinq étapes, à votre rythme, dans le silence.",
        steps: [{ t: "Gratitude", d: "Remerciez. Repassez votre journée." },{ t: "Lumière", d: "Demandez la grâce de regarder avec les yeux de Dieu." },{ t: "Relecture", d: "Où avez-vous ressenti la paix ? Où le trouble ?" },{ t: "Confier", d: "Confiez ce qui pèse. Demandez pardon." },{ t: "Demain", d: "Quel petit pas voulez-vous vivre ?" }],
        end: "🙏 Terminez par une prière simple.", prev: "← Précédent", next: "Suivant →" }
};

const EN = JSON.parse(JSON.stringify(FR));
EN.title = "🕯️ Home of Love"; EN.subtitle = "Discernment and the little light";
EN.placeholder = "Describe your situation..."; EN.role = "Who are you? (optional)";
EN.submit = "Receive discernment help →"; EN.loading = "Discernment in progress...";
EN.alertSituation = "Please describe your situation or choose an option.";
EN.situationsTitle = "Or choose what best matches what you are experiencing:";
EN.precisionPlaceholder = "You can specify what you are experiencing...";
EN.btnContinuer = "🌿 Continue discernment"; EN.ressourcesTitle = "To continue...";
EN.textesTitle = "📖 Texts to meditate on"; EN.prieresTitle = "🙏 Prayers"; EN.contactsTitle = "👤 Human contacts";
EN.ecouteTitle = "🆘 Listening services"; EN.exercicesTitle = "✨ Spiritual exercises";
EN.revenirTitle = "🔄 Return"; EN.revenirRecommencer = "Start over"; EN.saveLink = "Save my link";
EN.priereJourTitle = "📖 Prayer of the day"; EN.temoignagesTitle = "💬 Have you used Home of Love?";
EN.temoignagesIntro = "Share your experience (anonymous):"; EN.temoignagesPlaceholder = "Your testimony...";
EN.envoyer = "Send"; EN.merci = "🙏 Thank you! Your testimony stays on your device.";
EN.temoignagesRecus = "💬 Your testimonials (on this device)";
EN.projetsPsaume = "🌱 « Justice and peace embrace. » — Psalm 85:11";
EN.projetsCredit = "Tools for justice, peace and discernment.";
EN.footerNothing = "🔒 Nothing is recorded · 🕊️ A silent companion";
EN.footerHome = "🏠 Home"; EN.footerSagesse = "📖 Wisdom"; EN.footerAbout = "📖 About";
EN.footerSources = "📚 Sources"; EN.footerPrivacy = "🔒 Privacy"; EN.footerContact = "✉️ Contact";
EN.navHome = "🏠 Home"; EN.navSagesse = "📖 Wisdom"; EN.navAbout = "📖 About";
EN.navExamen = "🕯️ Examination"; EN.navSources = "📚 Sources"; EN.navContact = "✉️ Contact"; EN.navPrivacy = "🔒 Privacy";
EN.aiWarning = "I am an artificial intelligence. I do not replace human support.";
EN.toggleUrgence = "See emergency numbers";
EN.clauseText = "🙏 <strong>About Home of Love</strong><br>This tool offers <strong>initial listening</strong> and <strong>discernment help</strong>.";
EN.retour = "← Back to home";
EN.situations = ["I am going through great suffering","I no longer see meaning in my life","My relationship is in trouble","I have lost a loved one","I feel alone","I am angry with God","I don't know what to believe anymore","I have a difficult decision to make","I am living with illness or disability","I am afraid of the future","I am exhausted","I am experiencing family conflict","I am accompanying someone in suffering","I am searching for meaning in my life","Something else"];
EN.prieres = ["Lord, teach me to listen to silence.","Give me strength to embrace what I do not understand.","Let Your peace dwell in my heart."];
EN.defaultTestimonials = ["« A deep peace. »","« A precious space of silence. »"];
EN.carnetPrompt = "✨<br><br>« And you, what little light could you note today? »";
EN.carnetPlaceholder = "My little light..."; EN.saveBtn = "💾 Save"; EN.copyBtn = "🔗 Copy my link"; EN.shareBtn = "📤 Share";
EN.carnetInfo = "You can come back later with your link.";
EN.modes = { discernement: "🤲 Discernment", consolation: "🙏 Consolation", lecture: "📖 Bible Reading", priere: "❤️ Prayer" };
EN.homelieTitle = "Homily Preparation"; EN.homelieDescription = "Enter readings or load them from AELF.";
EN.labelLecture1 = "First Reading:"; EN.labelPsaume = "Psalm:";
EN.labelLecture2 = "Second Reading:"; EN.labelEvangile = "Gospel:";
EN.labelTheme = "Theme (optional):"; EN.homelieButton = "Generate a homily";
EN.homelieLoading = "Preparing the homily...";
EN.ecouteList = ["Emergency: dial your country's emergency number","Listening centres: befrienders.org","In distress: reach out to someone you trust"];
EN.contactPretreText = "Find a priest"; EN.contactPretreUrl = "https://www.usccb.org/parish-finder";
EN.contactCommunauteText = "Community near you"; EN.contactCommunauteUrl = "https://www.catholic.org/parishes/";

const translations = { fr: FR, en: EN };
['zh','hi','es','ar'].forEach(l => { translations[l] = EN; });

/* ---------- PAGES INTERNES ---------- */
const CARLO_FR = `<div class="bloc" style="background:#fff8f0;border:1px solid #e8d5b7;border-left:4px solid #c49a6c;"><h3 style="color:#8b5e3c;">🔥 Saint Carlo Acutis (1991–2006) — Le saint des développeurs</h3><p style="font-style:italic;color:#6b4c2a;font-size:1.05rem;">« Tous naissent comme des originaux, mais beaucoup meurent comme des photocopies. »<br><span style="font-size:0.8rem;color:#8b7355;">— Phrase que Carlo aimait à répéter</span></p><p>Canonisé en 2025, Carlo Acutis est le premier saint de l'ère numérique. Passionné d'informatique, il a utilisé le web pour créer une <a href="https://www.miracolieucaristici.org/" target="_blank" rel="noopener">exposition internationale sur les miracles eucharistiques</a>. Il disait : <em>« L'Eucharistie est mon autoroute vers le Ciel. »</em></p><blockquote style="border-left:3px solid #c49a6c;margin:1rem 0;padding-left:1rem;color:#5a4f42;line-height:1.7;"><p>« Notre objectif doit être l'infini, non pas le fini. L'Infini est notre patrie. »</p><p>« Être toujours uni à Jésus, tel est le but de ma vie. »</p><p>« Quand on s'expose au soleil, on bronze ; quand on se met devant Jésus Eucharistie, on devient saint ! »</p><p>« Le bonheur, c'est d'avoir le regard tourné vers Dieu. La tristesse, c'est de l'avoir tourné vers soi-même. »</p><p>« Ne perds pas ton temps à ne rien faire. Consacre-le à Dieu. »</p></blockquote><p style="font-size:0.85rem;color:#8b7355;margin-top:1rem;padding-top:0.8rem;border-top:1px dashed #d4c5b3;">📖 Pour aller plus loin : <em>Carlo Acutis, une âme de feu</em> — Marie et Jean-Baptiste Maillard, éd. Artège, 2025.</p><p style="font-size:0.8rem;color:#8b7355;font-style:italic;">🕯️ Prière : Saint Carlo Acutis, toi qui as fait de ton ordinateur un instrument d'évangélisation, apprends-nous à mettre nos talents numériques au service du Bien et de la Vérité. Amen.</p></div>`;

const CARLO_EN = `<div class="bloc" style="background:#fff8f0;border:1px solid #e8d5b7;border-left:4px solid #c49a6c;"><h3 style="color:#8b5e3c;">🔥 Saint Carlo Acutis (1991–2006) — The developer saint</h3><p style="font-style:italic;">« Everyone is born as an original, but many die as photocopies. »</p><p>Canonized in 2025, Carlo Acutis is the first saint of the digital age. He used the web to create an <a href="https://www.miracolieucaristici.org/" target="_blank" rel="noopener">international exhibition on Eucharistic miracles</a>. He said: <em>« The Eucharist is my highway to Heaven. »</em></p><blockquote style="border-left:3px solid #c49a6c;padding-left:1rem;color:#5a4f42;line-height:1.7;"><p>« Our goal must be the infinite, not the finite. »</p><p>« To always be united with Jesus — that is the goal of my life. »</p><p>« Sadness is looking at yourself; happiness is looking at God. »</p></blockquote><p style="font-size:0.85rem;color:#8b7355;">📖 To go further: <em>Carlo Acutis, une âme de feu</em> — Marie & Jean-Baptiste Maillard, Artège, 2025.</p></div>`;

const pageContent = {
    fr: {
        sagesse: `<h2>📖 Sagesse</h2><p class="page-intro">Quelques textes pour nourrir la méditation et la prière.</p><div class="bloc"><h3>Paroles de Jésus</h3><p>« Venez à moi, vous tous qui peinez. » — Mt 11,28</p><p>« Je vous laisse la paix, je vous donne ma paix. » — Jn 14,27</p></div><div class="bloc"><h3>Psaumes</h3><p>« Le Seigneur est mon berger : je ne manque de rien. » — Ps 23,1</p></div>${CARLO_FR}<div class="bloc"><h3>Aller plus loin</h3><p>Pour une écoute personnalisée, revenez à <a href="#/">l'accueil</a> ou faites l'<a href="#/examen">examen guidé</a>.</p></div>`,
        apropos: `<h2>📖 À propos</h2><div class="bloc"><h3>Qu'est-ce qu'Au Foyer de l'Amour ?</h3><p>Un espace de paix, d'écoute et de prière. Une première écoute et une aide au discernement, enracinée dans la tradition chrétienne et la spiritualité ignatienne.</p></div><div class="bloc"><h3>Ce que ce site n'est pas</h3><p>Il ne remplace ni un accompagnement humain, ni un prêtre, ni un psychologue, ni un médecin.</p></div>`,
        sources: `<h2>📚 Sources</h2><div class="bloc"><h3>Un projet porté par un prêtre catholique</h3><p>Le discernement proposé demeure toujours aligné sur l'enseignement officiel de l'Église catholique.</p></div><div class="bloc"><h3>Textes bibliques</h3><p><a href="https://www.aelf.org" target="_blank" rel="noopener">AELF</a> et <a href="https://www.biblegateway.com" target="_blank" rel="noopener">BibleGateway</a>.</p></div><div class="bloc"><h3>Saint Carlo Acutis</h3><p>Ouvrage de référence : <em>Carlo Acutis, une âme de feu</em> de Marie et Jean-Baptiste Maillard (Artège, 2025).</p></div>`,
        contact: `<h2>✉️ Contact</h2><div class="bloc"><h3>Partager votre expérience</h3><p>Laissez un témoignage anonyme depuis <a href="#/">la page d'accueil</a>.</p></div>`,
        confidentialite: `<h2>🔒 Confidentialité</h2><div class="bloc"><h3>En bref</h3><p>Pas de compte. Pas de cookies de suivi. Pas de publicité. Le carnet et les témoignages restent sur votre appareil.</p></div>`
    },
    en: {
        sagesse: `<h2>📖 Wisdom</h2><p class="page-intro">Texts to nourish meditation and prayer.</p><div class="bloc"><h3>Words of Jesus</h3><p>« Come to me, all you who are weary. » — Mt 11:28</p></div>${CARLO_EN}<div class="bloc"><h3>Go further</h3><p>Return to the <a href="#/">home page</a> or take the <a href="#/examen">guided examen</a>.</p></div>`,
        apropos: `<h2>📖 About</h2><div class="bloc"><h3>What is Home of Love?</h3><p>A space of peace, listening and prayer, rooted in the Christian tradition and Ignatian spirituality.</p></div>`,
        sources: `<h2>📚 Sources</h2><div class="bloc"><h3>A project led by a Catholic priest</h3></div>`,
        contact: `<h2>✉️ Contact</h2><div class="bloc"><h3>Share your experience</h3><p>Leave an anonymous testimony from the <a href="#/">home page</a>.</p></div>`,
        confidentialite: `<h2>🔒 Privacy</h2><div class="bloc"><h3>In short</h3><p>No account. No tracking cookies. No advertising.</p></div>`
    }
};
['zh','hi','es','ar'].forEach(l => { pageContent[l] = pageContent.fr; });

/* ---------- HELPERS ---------- */
function escapeHtml(t) {
    if (t === null || t === undefined) return '';
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
function setHtml(id, v) { const e = document.getElementById(id); if (e) e.innerHTML = v; }
function setPlaceholder(id, v) { const e = document.getElementById(id); if (e) e.placeholder = v; }
function fetchWithTimeout(url, opts = {}, ms = 20000) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
    return fetch(url, { ...opts, signal: c.signal }).finally(() => clearTimeout(t));
}
async function callDiscernAPI(payload) {
    try {
        const res = await fetchWithTimeout('/.netlify/functions/discern', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        }, 30000);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return { ok: false, error: 'Réponse non JSON' };
        const data = await res.json();
        if (res.ok && data && data.response) return { ok: true, data };
        return { ok: false, error: (data && data.error) || 'Erreur API' };
    } catch (err) { return { ok: false, error: (err && err.message) || 'Erreur réseau' }; }
}

function showToast(msg, type = 'info', ms = 4000) {
    const c = document.getElementById('toast-container'); if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = ((TOAST_ICONS[type] || '') + ' ' + msg).trim();
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}

function confirmAction(message, label) {
    return new Promise(resolve => {
        const m = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        if (!m) { resolve(window.confirm(message)); return; }
        msgEl.textContent = message;
        if (label) okBtn.textContent = label;
        m.hidden = false;
        cancelBtn.focus();
        const cleanup = () => { m.hidden = true; okBtn.removeEventListener('click', onOk); cancelBtn.removeEventListener('click', onCancel); m.removeEventListener('click', onBack); document.removeEventListener('keydown', onKey); };
        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        const onBack = (e) => { if (e.target === m) onCancel(); };
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        okBtn.addEventListener('click', onOk); cancelBtn.addEventListener('click', onCancel);
        m.addEventListener('click', onBack); document.addEventListener('keydown', onKey);
    });
}

const FoyerUI = {
    timers: {},
    start(id, textId, text) {
        const c = document.getElementById(id); const t = document.getElementById(textId);
        if (!c) return; c.style.display = 'block'; if (t && text) t.textContent = text;
        this.clear(id);
        this.timers[id] = [
            setTimeout(() => { if (c.style.display !== 'none' && t) t.textContent = text + ' (connexion...)'; }, 5000),
            setTimeout(() => { if (c.style.display !== 'none' && t) t.textContent = 'La méditation demande parfois du temps...'; }, 10000)
        ];
    },
    stop(id) { const c = document.getElementById(id); if (c) c.style.display = 'none'; this.clear(id); },
    clear(id) { if (this.timers[id]) { this.timers[id].forEach(clearTimeout); this.timers[id] = null; } },
    scrollTop() { const prm = matchMedia('(prefers-reduced-motion: reduce)').matches; window.scrollTo({ top: 0, behavior: prm ? 'auto' : 'smooth' }); }
};

/* ---------- CARNET ---------- */
function getCarnetId() {
    let id = null; try { id = localStorage.getItem(STORAGE_KEYS.CARNET_ID); } catch (e) {}
    if (!id) { id = 'carnet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11); try { localStorage.setItem(STORAGE_KEYS.CARNET_ID, id); } catch (e) {} }
    return id;
}
function carnetKey() { return STORAGE_KEYS.CARNET_PREFIX + getCarnetId(); }

function loadCarnet() { const e = document.getElementById('carnet-entry'); if (!e) return; try { const d = localStorage.getItem(carnetKey()); if (d) e.value = d; } catch (err) {} }
function saveCarnet() {
    const e = document.getElementById('carnet-entry'); if (!e) return;
    const f = document.getElementById('carnet-feedback');
    try { localStorage.setItem(carnetKey(), e.value.trim()); if (f) f.textContent = '✨ Sauvegardé.'; showToast('Carnet sauvegardé.', 'info'); } catch (err) { showToast('Impossible de sauvegarder.', 'warn'); }
    setTimeout(() => { if (f) f.textContent = ''; }, 3000);
}
function clearCarnet() {
    return confirmAction("Effacer toutes les notes du carnet ?", "Effacer").then(ok => {
        if (!ok) return;
        try { localStorage.removeItem(carnetKey()); } catch (e) {}
        const e = document.getElementById('carnet-entry'); if (e) e.value = '';
        showToast('Carnet réinitialisé.', 'info');
    });
}

/* ---------- TÉMOIGNAGES ---------- */
const LABEL_MOI = { fr: '— Vous (cet appareil)', en: '— You (this device)' };
function getTemoignages() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMOIGNAGES) || '[]'); } catch (e) { return []; } }
function renderTemoignages() {
    const l = document.getElementById('temoignagesListe'); if (!l) return;
    l.innerHTML = '';
    const t = translations[currentLang] || FR;
    if (t.defaultTestimonials) t.defaultTestimonials.forEach(m => appendTemo(l, m.replace(/^«\s*|\s*»$/g, '')));
    getTemoignages().forEach(m => appendTemo(l, m));
}
function appendTemo(parent, msg) {
    const d = document.createElement('div'); d.className = 'temoignage-affiche';
    d.textContent = '« ' + msg + ' »';
    const s = document.createElement('div'); s.className = 'source';
    s.textContent = LABEL_MOI[currentLang] || LABEL_MOI.fr;
    d.appendChild(s); parent.appendChild(d);
}
function clearTemoignages() {
    return confirmAction("Effacer l'historique des témoignages ?", "Effacer").then(ok => {
        if (!ok) return;
        try { localStorage.removeItem(STORAGE_KEYS.TEMOIGNAGES); } catch (e) {}
        renderTemoignages(); showToast('Témoignages effacés.', 'info');
    });
}

/* ---------- ROUTEUR ---------- */
function routeFromHash() { const h = window.location.hash.replace(/^#/, ''); return ROUTES[h] || 'accueil'; }
function retourLink() { const t = translations[currentLang] || FR; return '<a class="retour" href="#/">' + escapeHtml(t.retour || '← Retour') + '</a>'; }
function renderExamen(ex) {
    const el = document.getElementById('page-examen'); if (!el || !ex) return;
    const total = ex.steps.length; if (examenIdx > total) examenIdx = total;
    let html = retourLink() + '<h2>' + escapeHtml(ex.title) + '</h2><p class="page-intro">' + escapeHtml(ex.intro) + '</p><div class="bloc">';
    ex.steps.forEach((s, i) => { html += '<div class="examen-step' + (i === examenIdx ? ' active' : '') + '"><h3>' + (i + 1) + ' / ' + total + ' — ' + escapeHtml(s.t) + '</h3><p>' + escapeHtml(s.d) + '</p></div>'; });
    html += '<div class="examen-step' + (examenIdx === total ? ' active' : '') + '"><p style="text-align:center;">' + escapeHtml(ex.end) + '</p></div>';
    html += '<div class="examen-nav"><button type="button" class="btn-examen" id="examen-prev"' + (examenIdx === 0 ? ' disabled' : '') + '>' + escapeHtml(ex.prev) + '</button><button type="button" class="btn-examen" id="examen-next"' + (examenIdx === total ? ' disabled' : '') + '>' + escapeHtml(ex.next) + '</button></div></div>';
    el.innerHTML = html;
}
function renderPages() {
    const pc = pageContent[currentLang] || pageContent.fr;
    ['sagesse','apropos','sources','contact','confidentialite'].forEach(id => {
        const el = document.getElementById('page-' + id);
        if (el && pc[id]) el.innerHTML = retourLink() + pc[id];
    });
    const t = translations[currentLang] || FR;
    renderExamen(t.pageExamen || FR.pageExamen);
}
function showPage() {
    const page = routeFromHash();
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
    if (page === 'examen') { examenIdx = 0; renderPages(); }
    FoyerUI.scrollTop();
}

/* ---------- RESSOURCES ---------- */
function updateRessources(key) {
    const langData = translations[currentLang] || FR;
    const fallback = FR.textesParSituation || {};
    const texts = (langData.textesParSituation && langData.textesParSituation[key]) || (langData.textesParSituation && langData.textesParSituation.AUTRE) || fallback.AUTRE || [];
    const tl = document.getElementById('ressources-textes-list');
    if (tl) { tl.innerHTML = ''; texts.forEach(it => { const li = document.createElement('li'); li.innerHTML = '<strong>' + escapeHtml(it.ref) + '</strong> – « ' + escapeHtml(it.texte) + ' » <a href="' + escapeHtml(it.lien) + '" target="_blank" rel="noopener" style="font-size:0.85rem;">(lire)</a>'; tl.appendChild(li); }); }
    const pr = (langData.prieresParSituation && (langData.prieresParSituation[key] || langData.prieresParSituation.defaut)) || [];
    const pl = document.getElementById('ressources-prieres-list');
    if (pl) { pl.innerHTML = ''; pr.forEach(p => { const li = document.createElement('li'); li.innerHTML = '<strong>' + escapeHtml(p.titre) + '</strong><br><span style="font-size:0.9rem;">' + escapeHtml(p.texte) + '</span>'; pl.appendChild(li); }); }
    const il = document.getElementById('ressources-ignaciens-list');
    if (il) { il.innerHTML = ''; (langData.exercicesIgnatiens || []).forEach(it => { const li = document.createElement('li'); li.innerHTML = '<strong>' + escapeHtml(it.titre) + '</strong><br><span style="font-size:0.9rem;">' + escapeHtml(it.texte) + '</span>'; il.appendChild(li); }); }
    const ex = { fr: ["Noter une petite lumière demain", "5 minutes de silence le soir", "3 respirations : « Je suis aimé(e) »"], en: ["Note a little light tomorrow", "5 minutes of silence in the evening", "3 deep breaths: « I am loved »"] }[currentLang] || [];
    const el = document.getElementById('ressources-exercices-list');
    if (el) { el.innerHTML = ''; ex.forEach(e => { const li = document.createElement('li'); li.textContent = e; el.appendChild(li); }); }
}

/* ---------- RÉPONSE ---------- */
function showResponse(text) {
    document.getElementById('response-container').style.display = 'block';
    document.getElementById('response-lecture').style.display = 'block';
    document.getElementById('carnet-container').style.display = 'block';
    document.getElementById('ressources-container').style.display = 'none';
    document.getElementById('reponse').textContent = text;
    FoyerUI.stop('loading');
}
function buildFallback(situation, t) {
    const pr = (t.prieres && t.prieres[Math.floor(Math.random() * t.prieres.length)]) || "Seigneur, éclaire notre route.";
    const tx = "« Venez à moi, vous tous qui peinez, et je vous donnerai le repos. » (Mt 11,28)";
    if (currentMode === 'consolation') return "Dans l'épreuve (« " + situation + " »), vous n'êtes pas seul(e).\n\n" + tx + "\n\n" + pr;
    if (currentMode === 'priere') return "Seigneur, nous te confions : « " + situation + " ».\n\n" + pr + "\n\n" + tx;
    if (currentMode === 'lecture') return "Voici une parole :\n\n" + tx;
    return "Pour discerner (« " + situation + " »), saint Ignace nous invite au calme intérieur.\n\n" + tx + "\n\n" + pr;
}

/* ---------- SOUMISSION ---------- */
async function handleSubmit() {
    const radio = document.querySelector('input[name="situation-choisie"]:checked');
    const rk = radio ? radio.value : null;
    currentSituationKey = rk || "AUTRE";
    const sVal = document.getElementById('situation').value.trim();
    const pVal = document.getElementById('precision-situation').value.trim();
    const role = document.getElementById('role').value.trim();
    const rText = radio ? (radio.parentElement ? radio.parentElement.textContent.trim() : rk) : '';
    let situation = '';
    if (radio && !sVal) situation = rText;
    else if (radio && sVal) situation = 'Situation : ' + rText + '. ' + sVal;
    else situation = sVal;
    if (pVal) situation = situation ? situation + '. ' + pVal : pVal;

    if (!situation) { const t = translations[currentLang] || FR; showToast(t.alertSituation || 'Décrivez votre situation.', 'warn'); return; }

    const btn = document.getElementById('submitBtn');
    document.getElementById('response-container').style.display = 'none';
    if (btn) btn.disabled = true;
    const t = translations[currentLang] || FR;
    FoyerUI.start('loading', 'loading-text', t.loading);

    let reponse = '';
    const r = await callDiscernAPI({ situation, role, lang: currentLang, mode: currentMode });
    if (r.ok && r.data && r.data.response) reponse = r.data.response;
    else if (r.error) { console.log('Fallback:', r.error); showToast('Mode autonome activé.', 'info', 3500); }
    if (!reponse) reponse = buildFallback(situation, t);

    showResponse(reponse);
    updateRessources(currentSituationKey);
    FoyerUI.stop('loading');
    if (btn) btn.disabled = false;
}

/* ---------- AELF ---------- */
function initAelfDate() {
    const i = document.getElementById('date-aelf'); if (!i) return;
    const now = new Date();
    const diff = (7 - now.getDay()) % 7;
    const ns = new Date(now); ns.setDate(now.getDate() + diff);
    i.value = ns.getFullYear() + '-' + String(ns.getMonth() + 1).padStart(2, '0') + '-' + String(ns.getDate()).padStart(2, '0');
}
function parseAelfLectures(arr) {
    const ls = Array.isArray(arr) ? arr : [];
    const find = (kinds) => { for (const k of kinds) { const f = ls.find(l => (l.type || '').toLowerCase().includes(k)); if (f) return f; } return null; };
    return { lect1: find(['lecture_1','premiere']), psaume: find(['psaume','cantique']), lect2: find(['lecture_2','deuxieme']), evangile: find(['evangile']) };
}
function stripHtml(h) { const d = document.createElement('div'); d.innerHTML = h || ''; return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim(); }
function countWordsInHtml(html) { if (!html) return 0; const t = html.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' '); return t.trim().split(/\s+/).filter(w => w.length > 0).length; }
function truncateHtml(html, max) {
    if (!html) return { html: '', count: 0 };
    const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plain.split(' ').filter(w => w.length > 0);
    if (words.length <= max) return { html, count: words.length };
    const tr = words.slice(0, max).join(' ') + '…';
    return { html: '<p>' + tr + '</p><p style="font-size:0.82rem;color:#8c6b32;font-style:italic;">⚠️ Texte calibré à ' + max + ' mots.</p>', count: max };
}

const LEGAL_NOTICE = "<div style='margin-top:1.5rem;padding:1rem;background:#f5f3ef;border:1px solid #dcd5c9;border-left:4px solid #4a6f5e;border-radius:6px;font-size:0.84rem;color:#443b34;line-height:1.55;'><div style='font-weight:700;color:#2d463b;margin-bottom:0.4rem;'>⚖️ Distinction légale : Inspiration vs Reproduction</div>Cette homélie est une <strong>création originale inspirée</strong> de la démarche de <strong>Mgr Joseph A. Pellegrino</strong> (<a href='https://frjoeshomilies.net/' target='_blank' rel='noopener noreferrer' style='color:#2a503e;'>frjoeshomilies.net</a>) et du <strong>Père Tony Kadavil</strong> (<a href='https://frtonyshomilies.com/' target='_blank' rel='noopener noreferrer' style='color:#2a503e;'>frtonyshomilies.com</a>). Elle ne constitue en aucun cas une reproduction intégrale de leurs écrits protégés, mais une appropriation spirituelle autonome dans le respect du droit d'auteur, du <em>Directoire sur l'homélie</em> et des textes de l'AELF.</div>";

function detectAuthorContext(refStr, textStr) {
    const f = ((refStr || '') + ' ' + (textStr || '')).toLowerCase();
    if (/matthieu|matthew|mt\b/.test(f)) return { lienAelf: 'https://www.aelf.org/bible/Mt' };
    if (/marc|mark|mc\b/.test(f)) return { lienAelf: 'https://www.aelf.org/bible/Mc' };
    if (/luc|luke|lc\b/.test(f)) return { lienAelf: 'https://www.aelf.org/bible/Lc' };
    if (/jean|john|jn\b/.test(f)) return { lienAelf: 'https://www.aelf.org/bible/Jn' };
    return { lienAelf: 'https://www.aelf.org/bible' };
}
function buildSourcesBlock(ctx) {
    return "<div style='margin-top:2rem;background:#f4f1eb;border:1px solid #d9d2c5;border-left:4px solid #7c6f5d;border-radius:8px;padding:1.2rem;font-size:0.88rem;color:#4a4036;line-height:1.6;'><strong style='color:#2c221e;font-size:0.95rem;'>📚 Sources officielles & respect de la propriété intellectuelle</strong><ul style='margin:0.5rem 0 0;padding-left:1.3rem;list-style-type:square;font-size:0.85rem;'><li><strong>Textes liturgiques :</strong> <a href='" + escapeHtml(ctx.lienAelf) + "' target='_blank' rel='noopener noreferrer' style='color:#325c48;'>AELF</a>.</li><li><strong>Prédication dominicale :</strong> Inspirée de Mgr Pellegrino et du P. Tony Kadavil.</li><li><strong>Méditation de semaine :</strong> Inspirée du P. Tony Kadavil.</li><li><strong>Herméneutique :</strong> Concile Vatican II, <a href='https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_fr.html' target='_blank' rel='noopener noreferrer' style='color:#325c48;'>Dei Verbum, n. 12</a>.</li><li><strong>Normes :</strong> <a href='https://www.vatican.va/roman_curia/congregations/ccdds/documents/rc_con_ccdds_doc_20140629_direttorio-omiletico_fr.html' target='_blank' rel='noopener noreferrer' style='color:#325c48;'>Directoire sur l'homélie (2014)</a>.</li></ul></div>";
}

function buildHomelieSunday(data) {
    const { evRef, l1Ref, l2Ref, evQuote, psalmRefrain } = data;
    let h = "";
    h += "<p>Un homme avait planté un petit potager derrière sa maison. Il avait préparé la terre, semé avec soin, arrosé chaque jour et attendu patiemment. Un jour, son voisin lui demanda : <em>« Comment va ton potager ? »</em> L'homme répondit : <em>« Les feuilles poussent à merveille. Il n'y a qu'un problème : je ne vois encore aucun légume ! »</em> Le voisin sourit : <em>« Mais un jardin est fait pour produire quelque chose ! »</em></p>";
    h += "<p>C'est exactement le message de nos lectures d'aujourd'hui : Dieu a planté pour nous une vigne et attend qu'elle produise de bons fruits.";
    if (l1Ref) h += " La première lecture (<strong>" + escapeHtml(l1Ref) + "</strong>)";
    h += ".";
    if (evRef) h += " L'Évangile (<strong>" + escapeHtml(evRef) + "</strong>)";
    if (evQuote) h += " prolonge : « <em>" + escapeHtml(evQuote) + "</em> »";
    h += " Quels fruits portons-nous ?</p>";
    h += "<p>";
    if (l2Ref) h += "Saint Paul, dans la deuxième lecture (<strong>" + escapeHtml(l2Ref) + "</strong>), ";
    else h += "L'Écriture ";
    h += "nous invite à tourner nos cœurs vers ce qui est vrai, juste et digne d'éloge.";
    if (psalmRefrain) h += " Comme le chante le psaume : « <em>" + escapeHtml(psalmRefrain) + "</em> »";
    h += ".</p>";
    h += "<p>Dieu nous a confié une vigne : notre vie, nos familles, notre communauté. Il attend de vrais fruits : un appel à un isolé, un pardon accordé, une parole encourageante.<br><br><em>Amen.</em></p>";
    return h;
}
function buildHomelieWeekday(data) {
    const { evRef, evQuote, theme } = data;
    const title = theme || "Fidélité au cœur du quotidien";
    let h = "<h3 style='color:#3a584a;margin-top:0;font-family:Georgia,serif;font-size:1.15rem;'>" + escapeHtml(title) + "</h3>";
    h += "<p>Dans le travail ordinaire de notre journée";
    if (evRef) h += " (<strong>" + escapeHtml(evRef) + "</strong>)";
    h += ", le Christ nous attend. ";
    if (evQuote) h += "Il nous redit : « <em>" + escapeHtml(evQuote) + "</em> » ";
    h += "Vivons nos devoirs d'aujourd'hui comme une prière silencieuse et posons un geste concret de patience ou d'écoute fraternelle.</p>";
    h += "<p><em>Prière : Seigneur, conduis nos pas dans ta paix aujourd'hui. Amen.</em></p>";
    return h;
}
function genererHomelieLocale(lecture1, psaume, lecture2, evangile, theme) {
    const p = parseAelfLectures(aelfLectures);
    const aEv = p.evangile, aL1 = p.lect1, aL2 = p.lect2, aPs = p.psaume;
    const evRef = (aEv && aEv.ref) || evangile || '';
    const l1Ref = (aL1 && aL1.ref) || lecture1 || '';
    const l2Ref = (aL2 && aL2.ref) || lecture2 || '';
    const evText = aEv && aEv.contenu ? stripHtml(aEv.contenu) : '';
    const ctx = detectAuthorContext(evRef, evText);
    let evQuote = '';
    if (evText) {
        const ss = evText.split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(s => s.length > 25);
        if (ss.length) { const so = ss.slice().sort((a, b) => Math.abs(a.length - 110) - Math.abs(b.length - 110)); evQuote = so[0].length > 140 ? so[0].slice(0, 140) + '…' : so[0]; }
    }
    let psalmRefrain = '';
    if (aPs && aPs.contenu) {
        const lines = stripHtml(aPs.contenu).split(/\n|\r/).map(l => l.trim()).filter(l => l.length > 5);
        if (lines.length) psalmRefrain = lines[0];
    }
    let isSunday = true;
    const di = document.getElementById('date-aelf');
    if (di && di.value) { const parts = di.value.split('-'); if (parts.length === 3) { const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)); isSunday = (d.getDay() === 0); } }
    const data = { evRef, l1Ref, l2Ref, evQuote, psalmRefrain, theme };
    let html = isSunday ? buildHomelieSunday(data) : buildHomelieWeekday(data);
    const max = isSunday ? WORD_LIMITS.sunday : WORD_LIMITS.weekday;
    let wc = countWordsInHtml(html);
    if (wc > max) { const tr = truncateHtml(html, max); html = tr.html; wc = tr.count; }
    html += buildSourcesBlock(ctx);
    return { html, wordCount: wc, maxLimit: max, isSunday };
}

/* ---------- LANGUAGE ---------- */
function updateLanguage(lang) {
    if (!translations[lang]) lang = 'fr';
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    const t = translations[lang];

    setHtml('mainTitle', escapeHtml(t.title));
    setText('mainSubtitle', t.subtitle);
    setPlaceholder('situation', t.placeholder);
    setPlaceholder('role', t.role);
    setPlaceholder('precision-situation', t.precisionPlaceholder);
    setText('submitBtn', t.submit);

    const grid = document.querySelector('.situations-grid');
    if (grid) {
        grid.innerHTML = '';
        SITUATION_KEYS.forEach((key, idx) => {
            const txt = (t.situations && t.situations[idx]) || key;
            const lab = document.createElement('label');
            lab.dataset.key = key;
            const inp = document.createElement('input');
            inp.type = 'radio'; inp.name = 'situation-choisie'; inp.value = key;
            lab.appendChild(inp);
            lab.appendChild(document.createTextNode(' ' + txt));
            grid.appendChild(lab);
        });
    }
    setText('situations-title', t.situationsTitle);

    setHtml('carnet-prompt', t.carnetPrompt);
    setPlaceholder('carnet-entry', t.carnetPlaceholder);
    setText('save-carnet', t.saveBtn);
    setText('copy-carnet-link', t.copyBtn);
    setText('share-carnet', t.shareBtn);
    setText('carnet-info-text', t.carnetInfo);
    setText('btn-continuer-discernement', t.btnContinuer);
    setText('ressources-title', t.ressourcesTitle);
    setText('ressources-textes-title', t.textesTitle);
    setText('ressources-prieres-title', t.prieresTitle);
    setText('ressources-contacts-title', t.contactsTitle);
    setText('ressources-ecoute-title', t.ecouteTitle);
    setText('ressources-exercices-title', t.exercicesTitle);
    setText('ressources-revenir-title', t.revenirTitle);
    setText('ressources-revenir-recommencer', t.revenirRecommencer);
    setText('save-link-ressources', t.saveLink);
    setText('ressources-contact-pretre-text', t.contactPretreText || '');
    const plink = document.getElementById('ressources-contact-pretre-link'); if (plink) plink.href = t.contactPretreUrl || '#';
    setText('ressources-contact-communaute-text', t.contactCommunauteText || '');
    const clink = document.getElementById('ressources-contact-communaute-link'); if (clink) clink.href = t.contactCommunauteUrl || '#';

    const el = document.getElementById('ressources-ecoute-list');
    if (el && t.ecouteList) { el.innerHTML = ''; t.ecouteList.forEach(s => { const li = document.createElement('li'); li.textContent = s; el.appendChild(li); }); }

    setText('priere-title', t.priereJourTitle);
    if (t.prieres && t.prieres.length) { const rp = t.prieres[Math.floor(Math.random() * t.prieres.length)]; setText('priereDuJour', '« ' + rp + ' »'); }

    setText('temoignages-title', t.temoignagesTitle);
    setText('temoignages-intro', t.temoignagesIntro);
    setPlaceholder('temoignage', t.temoignagesPlaceholder);
    setText('envoyerTemoignage', t.envoyer);
    setText('merciTemoignage', t.merci);
    setText('temoignages-recus-title', t.temoignagesRecus);
    renderTemoignages();

    setText('projets-psaume', t.projetsPsaume);
    setText('projets-credit', t.projetsCredit);
    setText('footer-nothing', t.footerNothing);
    setText('footer-home', t.footerHome);
    setText('footer-sagesse', t.footerSagesse);
    setText('footer-about', t.footerAbout);
    setText('footer-contact', t.footerContact);
    setText('ai-warning-text', t.aiWarning);
    setText('toggle-urgence', t.toggleUrgence);
    setHtml('clause-text', t.clauseText);
    setText('navHome', t.navHome);
    setText('navSagesse', t.navSagesse);
    setText('navAbout', t.navAbout);
    setText('navExamen', t.navExamen);
    setText('navContact', t.navContact);
    setText('navSources', t.navSources);
    setText('navPrivacy', t.navPrivacy);
    setText('footer-sources', t.footerSources);
    setText('footer-privacy', t.footerPrivacy);

    const uEl = document.getElementById('urgence-list');
    if (uEl && t.ecouteList) { uEl.innerHTML = ''; t.ecouteList.forEach(item => { const p = document.createElement('p'); p.textContent = item; uEl.appendChild(p); }); }

    if (t.modes) {
        setText('mode-discernement', t.modes.discernement);
        setText('mode-consolation', t.modes.consolation);
        setText('mode-lecture', t.modes.lecture);
        setText('mode-priere', t.modes.priere);
    }
    setText('homelie-title', t.homelieTitle);
    setText('homelie-description', t.homelieDescription);
    setText('label-lecture1', t.labelLecture1);
    setText('label-psaume', t.labelPsaume);
    setText('label-lecture2', t.labelLecture2);
    setText('label-evangile-text', t.labelEvangile);
    setText('label-theme', t.labelTheme);
    setText('homelie-button-text', t.homelieButton);
    setText('homelie-loading-text', t.homelieLoading);

    examenIdx = 0;
    renderPages();
    if (currentSituationKey) updateRessources(currentSituationKey);
}

/* ---------- EVENTS ---------- */
function bindEvents() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.lang-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            this.classList.add('active'); this.setAttribute('aria-pressed', 'true');
            try { localStorage.setItem(STORAGE_KEYS.LANG, this.dataset.lang); } catch (e) {}
            updateLanguage(this.dataset.lang);
            const names = { fr: 'Français', en: 'English', zh: '中文', hi: 'हिन्दी', es: 'Español', ar: 'العربية' };
            showToast('Langue : ' + (names[this.dataset.lang] || this.dataset.lang), 'info', 2500);
        });
    });
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            this.classList.add('active'); this.setAttribute('aria-pressed', 'true');
            currentMode = this.dataset.mode;
        });
    });
    const sb = document.getElementById('submitBtn'); if (sb) sb.addEventListener('click', handleSubmit);
    const scb = document.getElementById('save-carnet'); if (scb) scb.addEventListener('click', saveCarnet);
    const ccb = document.getElementById('clear-carnet'); if (ccb) ccb.addEventListener('click', clearCarnet);
    const cpl = document.getElementById('copy-carnet-link');
    if (cpl) cpl.addEventListener('click', () => {
        const link = window.location.origin + window.location.pathname + '?carnet=' + getCarnetId();
        navigator.clipboard.writeText(link).then(() => { const fb = document.getElementById('carnet-feedback'); if (fb) fb.textContent = '🔗 Lien copié !'; showToast('Lien copié !', 'info'); }).catch(() => showToast('Impossible de copier.', 'warn'));
    });
    const shb = document.getElementById('share-carnet');
    if (shb) shb.addEventListener('click', () => {
        const link = window.location.origin + window.location.pathname + '?carnet=' + getCarnetId();
        if (navigator.share) navigator.share({ title: 'Ma petite lumière', url: link }).catch(() => {});
        else window.location.href = 'mailto:?subject=Ma petite lumière&body=' + encodeURIComponent(link);
    });
    const cb = document.getElementById('btn-continuer-discernement');
    if (cb) cb.addEventListener('click', () => {
        updateRessources(currentSituationKey);
        const c = document.getElementById('ressources-container');
        if (c) { c.style.display = 'block'; c.scrollIntoView({ behavior: 'smooth' }); }
    });
    const slb = document.getElementById('save-link-ressources');
    if (slb) slb.addEventListener('click', (e) => {
        e.preventDefault();
        const link = window.location.origin + window.location.pathname + '?carnet=' + getCarnetId();
        navigator.clipboard.writeText(link).then(() => showToast('Lien copié !', 'info')).catch(() => showToast('Impossible.', 'warn'));
    });
    const tu = document.getElementById('toggle-urgence');
    if (tu) tu.addEventListener('click', (e) => {
        e.preventDefault();
        const l = document.getElementById('urgence-list');
        if (l) { const v = l.classList.toggle('visible'); tu.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    });
    const et = document.getElementById('envoyerTemoignage');
    if (et) et.addEventListener('click', () => {
        const inp = document.getElementById('temoignage');
        const msg = inp ? inp.value.trim() : '';
        if (!msg) return;
        const a = getTemoignages(); a.push(msg.slice(0, 500));
        try { localStorage.setItem(STORAGE_KEYS.TEMOIGNAGES, JSON.stringify(a.slice(-20))); } catch (e) {}
        const m = document.getElementById('merciTemoignage'); if (m) m.style.display = 'block';
        if (inp) inp.value = '';
        renderTemoignages(); showToast('Témoignage enregistré.', 'info');
    });
    const ct = document.getElementById('clear-temoignages'); if (ct) ct.addEventListener('click', clearTemoignages);

    document.addEventListener('click', (e) => {
        if (!e.target) return;
        if (e.target.id === 'examen-prev') { examenIdx = Math.max(0, examenIdx - 1); renderPages(); }
        if (e.target.id === 'examen-next') { examenIdx = examenIdx + 1; renderPages(); }
    });
    const btt = document.getElementById('back-to-top');
    if (btt) {
        window.addEventListener('scroll', () => { btt.style.display = window.scrollY > 600 ? 'flex' : 'none'; }, { passive: true });
        btt.addEventListener('click', FoyerUI.scrollTop);
    }
    window.addEventListener('hashchange', showPage);
    const pf = document.getElementById('btn-prefill-example');
    if (pf) pf.addEventListener('click', () => {
        document.getElementById('lecture1').value = "Ézéchiel 18, 25-28";
        document.getElementById('psaume').value = "Psaume 24 (25)";
        document.getElementById('lecture2').value = "Philippiens 2, 1-11";
        document.getElementById('evangile').value = "Matthieu 21, 28-32";
        document.getElementById('theme').value = "La cohérence entre nos paroles et nos actes";
    });
    const fb = document.getElementById('btn-fermer-lectures');
    if (fb) fb.addEventListener('click', () => { const el = document.getElementById('aelf-lectures-display'); if (el) el.style.display = 'none'; });
    const ab = document.getElementById('btn-charger-aelf'); if (ab) ab.addEventListener('click', handleChargeAelf);
    const hjb = document.getElementById('btn-homelie-du-jour'); if (hjb) hjb.addEventListener('click', genererHomelieDuJour);
    const gb = document.getElementById('genererHomelie'); if (gb) gb.addEventListener('click', handleGenererHomelie);
    ['lecture1','psaume','lecture2','evangile','theme'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') { const b = document.getElementById('genererHomelie'); if (b) b.click(); } });
    });
}

async function handleChargeAelf() {
    const di = document.getElementById('date-aelf');
    const st = document.getElementById('aelf-status');
    const jn = document.getElementById('aelf-jour-nom');
    const dd = document.getElementById('aelf-lectures-display');
    const bd = document.getElementById('aelf-lectures-body');
    const btn = document.getElementById('btn-charger-aelf');
    if (!di || !di.value) { showToast('Veuillez choisir une date.', 'warn'); return; }
    if (st) st.textContent = '⏳ Chargement AELF...';
    if (btn) btn.disabled = true;
    aelfLectures = [];
    try {
        const res = await fetchWithTimeout('https://api.aelf.org/v1/messes/' + di.value + '/france', {}, 20000);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const messes = data.messes || [];
        if (!messes.length || !messes[0].lectures) throw new Error('Aucune lecture.');
        const m = messes[0];
        if (jn) jn.textContent = '🕊️ Liturgie : ' + (m.nom || (data.informations && data.informations.jour) || 'Office du jour');
        let l1 = '', ps = '', l2 = '', ev = '', bh = '';
        m.lectures.forEach(l => {
            const ty = (l.type || '').toLowerCase();
            const ti = l.titre || l.type || '';
            const rf = l.ref || '';
            const co = l.contenu || '';
            bh += '<div style="margin-bottom:1.2rem;padding-bottom:1rem;border-bottom:1px solid #eee;"><div style="font-weight:bold;color:#4a6f5e;">' + escapeHtml(ti) + (rf ? ' (' + escapeHtml(rf) + ')' : '') + '</div><div style="margin-top:0.3rem;">' + co + '</div></div>';
            aelfLectures.push({ type: ty, titre: ti, ref: rf, contenu: co });
            if (ty.includes('lecture_1') || ty.includes('premiere') || ty === 'lecture') { if (!l1) l1 = (ti + ' ' + rf).trim(); }
            else if (ty.includes('psaume') || ty.includes('cantique')) { if (!ps) ps = (ti + ' ' + rf).trim(); }
            else if (ty.includes('lecture_2') || ty.includes('deuxieme')) { if (!l2) l2 = (ti + ' ' + rf).trim(); }
            else if (ty.includes('evangile')) { if (!ev) ev = (ti + ' ' + rf).trim(); }
        });
        if (l1) document.getElementById('lecture1').value = l1;
        if (ps) document.getElementById('psaume').value = ps;
        if (l2) document.getElementById('lecture2').value = l2;
        if (ev) document.getElementById('evangile').value = ev;
        if (bd) bd.innerHTML = bh;
        if (dd) dd.style.display = 'block';
        if (st) st.textContent = '✅ Lectures chargées !';
    } catch (err) {
        if (st) st.textContent = '⚠️ Erreur AELF (' + err.message + ').';
        showToast('Erreur AELF : ' + err.message, 'error', 4000);
    } finally { if (btn) btn.disabled = false; }
}

async function genererHomelieDuJour() {
    const di = document.getElementById('date-aelf');
    if (!di || !di.value) { showToast("Veuillez choisir une date.", 'warn'); return; }
    const btn = document.getElementById('btn-homelie-du-jour');
    const ot = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Chargement AELF...'; }
    try {
        await handleChargeAelf();
        const ev = document.getElementById('evangile');
        if (!ev || !ev.value.trim()) { showToast("Aucune lecture trouvée.", 'warn'); return; }
        if (btn) btn.textContent = '🕊️ Génération en cours...';
        document.getElementById('genererHomelie').click();
    } catch (err) { console.error(err); showToast("Impossible de générer l'homélie.", 'error'); }
    finally { setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = ot || '🕊️ Générer l\'homélie du jour'; } }, 1500); }
}

async function handleGenererHomelie() {
    const lecture1 = document.getElementById('lecture1').value.trim();
    const psaume = document.getElementById('psaume').value.trim();
    const lecture2 = document.getElementById('lecture2').value.trim();
    const evangile = document.getElementById('evangile').value.trim();
    const theme = document.getElementById('theme').value.trim();
    if (!evangile && !lecture1) { showToast("Veuillez entrer au moins l'Évangile.", 'warn'); return; }

    const hd = document.getElementById('homelieResponse');
    const gb = document.getElementById('genererHomelie');
    FoyerUI.start('homelieLoading', 'homelie-loading-text', "Préparation de l'homélie...");
    hd.style.display = 'none';
    if (gb) gb.disabled = true;

    const lang = currentLang || 'fr';
    console.log('🌍 Langue envoyée à l\'IA :', lang);

    let isSunday = true;
    const dv = document.getElementById('date-aelf') && document.getElementById('date-aelf').value;
    if (dv) { const dp = dv.split('-'); if (dp.length === 3) { const dt = new Date(parseInt(dp[0], 10), parseInt(dp[1], 10) - 1, parseInt(dp[2], 10)); isSunday = (dt.getDay() === 0); } }

    let evTexte = '';
    try { const p = parseAelfLectures(aelfLectures); if (p.evangile && p.evangile.contenu) evTexte = stripHtml(p.evangile.contenu); } catch (e) {}

    let homelieHtml = '', modeGen = '';
    const r = await callDiscernAPI({
        situation: 'Préparation d\'homélie demandée',
        role: 'prêtre', lang, mode: 'homelie', isSunday,
        lectures: { lecture1, psaume, lecture2, evangile, theme, evangileTexte: evTexte }
    });

    if (r.ok && r.data && r.data.response) {
        const safe = escapeHtml(r.data.response);
        homelieHtml = safe.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        homelieHtml = '<p>' + homelieHtml + '</p>';
        modeGen = 'IA en ligne';
    } else if (r.error) { console.log('Fallback local:', r.error); showToast('IA indisponible : génération locale activée', 'info', 3500); }

    let wc = 0;
    let lim = isSunday ? WORD_LIMITS.sunday : WORD_LIMITS.weekday;

    if (homelieHtml) {
        const aw = countWordsInHtml(homelieHtml);
        if (aw > lim) { const t = truncateHtml(homelieHtml, lim); homelieHtml = t.html; wc = t.count; }
        else wc = aw;
        homelieHtml += LEGAL_NOTICE;
    } else {
        const lr = genererHomelieLocale(lecture1, psaume, lecture2, evangile, theme);
        homelieHtml = lr.html; wc = lr.wordCount; lim = lr.maxLimit;
        modeGen = 'Génération locale autonome';
    }

    const bc = wc <= lim ? '#2e6b47' : '#c0392b';
    const bg = wc <= lim ? '#e8efe9' : '#fbeae8';

    hd.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dfd7ca;padding-bottom:0.75rem;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">' +
        '<div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">' +
        '<strong style="color:#4a6f5e;font-size:1.1rem;">🕊️ Proposition d\'homélie</strong>' +
        '<span style="font-size:0.75rem;background:#eae5dc;color:#6b5d52;padding:2px 8px;border-radius:10px;">' + escapeHtml(modeGen) + '</span>' +
        '<span style="font-size:0.8rem;background:' + bg + ';color:' + bc + ';border:1px solid ' + bc + '33;padding:2px 10px;border-radius:12px;font-weight:bold;">📊 ' + wc + ' / ' + lim + ' mots max</span>' +
        '</div>' +
        '<button type="button" id="btn-copier-homelie" style="background:#4a6f5e;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;">📋 Copier</button>' +
        '</div>' +
        '<div id="homelie-texte-contenu" style="font-size:1rem;line-height:1.85;">' + homelieHtml + '</div>';

    hd.style.display = 'block';
    FoyerUI.stop('homelieLoading');
    if (gb) gb.disabled = false;

    const cp = document.getElementById('btn-copier-homelie');
    if (cp) cp.addEventListener('click', () => {
        const txt = document.getElementById('homelie-texte-contenu').innerText;
        navigator.clipboard.writeText(txt).then(() => {
            cp.textContent = '✅ Copiée !';
            showToast('Homélie copiée !', 'info');
            setTimeout(() => { cp.textContent = '📋 Copier'; }, 2500);
        }).catch(() => showToast('Sélectionnez et copiez manuellement.', 'warn'));
    });
    hd.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------- INIT ---------- */
function init() {
    const up = new URLSearchParams(window.location.search);
    if (up.get('carnet')) { try { localStorage.setItem(STORAGE_KEYS.CARNET_ID, up.get('carnet')); } catch (e) {} }
    loadCarnet();
    initAelfDate();
    bindEvents();
    let lang = '';
    try { lang = localStorage.getItem(STORAGE_KEYS.LANG) || ''; } catch (e) {}
    if (LANGS.indexOf(lang) === -1) { const n = (navigator.language || '').slice(0, 2).toLowerCase(); lang = LANGS.indexOf(n) !== -1 ? n : 'fr'; }
    document.querySelectorAll('.lang-btn').forEach(b => { const a = b.dataset.lang === lang; b.classList.toggle('active', a); b.setAttribute('aria-pressed', a ? 'true' : 'false'); });
    updateLanguage(lang);
    showPage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
