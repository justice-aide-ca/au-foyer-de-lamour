// ============================================================
// Fonction Netlify « discern » — Au Foyer de l'Amour
// Reçoit : POST { situation, role, lang, mode, versets?, lectures? }
// Renvoie : { response } ou { error }
// Nécessite la variable d'environnement OPENAI_API_KEY
// (Netlify → Site settings → Environment variables)
// ============================================================

const MODE_INSTRUCTIONS = {
    discernement: "Aide la personne à discerner : accueille ce qu'elle vit, aide-la à distinguer ce qui apporte une paix profonde (consolation) de ce qui trouble durablement (désolation), propose une piste concrète et, si pertinent, une référence biblique.",
    consolation: "Apporte une consolation : accueille la souffrance avec tendresse, sans jugement ni leçon, et fais jaillir une espérance réaliste, comme une petite lumière dans la nuit.",
    lecture: "Propose un texte biblique en lien avec la situation (livre, chapitre, versets), cites-en un court extrait et offre une brève méditation.",
    priere: "Écris une prière simple et personnalisée, à la première personne, que la personne puisse faire sienne.",
    homelie: "Rédige une proposition d'homélie dominicale, structurée, pastorale et priante, en lien avec les lectures fournies."
};

const LANG_NAMES = {
    fr: 'français', en: 'English', es: 'español',
    zh: '中文（简体）', hi: 'हिन्दी', ar: 'العربية'
};

function buildMessages({ situation, role, lang, mode, versets, lectures }) {
    const langName = LANG_NAMES[lang] || LANG_NAMES.fr;
    const modeInstruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.discernement;

    // -------- Mode HOMÉLIE : prompt dédié --------
    if (mode === 'homelie') {
        const L = lectures || {};
        const system = `Tu es un prêtre catholique qui prépare une homélie dominicale pour sa communauté.
Tu écris en ${langName}, avec chaleur, simplicité et profondeur pastorale.

Structure imposée (MAXIMUM 500 MOTS au total) :
1. Une histoire courte ou une image concrète (3 à 4 phrases) qui rejoint la vie des fidèles.
2. Le cœur de l'Évangile du jour : ce que Jésus dit, ce qu'il fait, ce qu'il révèle de Dieu.
3. Un lien bref avec la première lecture et la deuxième lecture (une phrase chacune).
4. Un message d'espérance et une ou deux questions qui invitent à la conversion intérieure.
5. Une courte prière finale.

Règles :
- Réponds UNIQUEMENT en ${langName}.
- TEXTE UNIQUE ET FLUIDE : pas de titre, pas de numérotation, pas de listes à puces, pas de gras.
- Style : chaleureux, pastoral, simple. Comme une homélie prononcée, pas un article.
- Ne prêche pas la morale : annonce l'Évangile.
- Reste dans le cadre de la foi catholique.`;

        let user = `Lectures du dimanche :\n`;
        if (L.lecture1) user += `- Première lecture : ${L.lecture1}\n`;
        if (L.psaume)   user += `- Psaume : ${L.psaume}\n`;
        if (L.lecture2) user += `- Deuxième lecture : ${L.lecture2}\n`;
        user += `- Évangile : ${L.evangile || 'Non fourni'}\n`;
        if (L.theme) user += `\nThème suggéré : ${L.theme}\n`;
        user += `\nRédige maintenant l'homélie en ${langName}, 500 mots maximum.`;

        return [
            { role: 'system', content: system },
            { role: 'user', content: user }
        ];
    }

    // -------- Modes normaux : discernement, consolation, lecture, prière --------
    const system = `Tu es le compagnon d'écoute du site « Au Foyer de l'Amour », un espace d'aide au discernement enraciné dans la foi chrétienne et la spiritualité ignatienne (consolation, désolation, la petite lumière dans la nuit).

Règles :
- Réponds en ${langName}, avec chaleur, simplicité et respect, en 150 à 250 mots.
- Ne prétends jamais être humain : tu es une intelligence artificielle.
- Ne donne jamais d'avis médical, psychologique ou juridique.
- Si la situation semble grave (danger, idées noires, violence), prends-la très au sérieux et encourage avec douceur à contacter immédiatement une aide humaine (services d'urgence ou d'écoute du pays de la personne).
- Reste humble : propose, n'impose pas.

Tâche demandée : ${modeInstruction}`;

    let user = situation;

    // Injection des versets + exégèses (contexte biblique)
    if (Array.isArray(versets) && versets.length > 0) {
        const versesText = versets.slice(0, 2).map(v => {
            let line = `- « ${v.texte} » (${v.ref})`;
            if (v.exegese) line += `\n  Exégèse : ${v.exegese}`;
            if (v.source)  line += `\n  Source : ${v.source}`;
            return line;
        }).join('\n');

        user = `Contexte biblique (à utiliser librement, sans le citer mot pour mot) :
${versesText}

Situation de la personne :
${situation}`;
    }

    if (role) user = `Contexte sur la personne : ${role}\n\n${user}`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user }
    ];
}

exports.handler = async (event) => {
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service en cours de configuration. Réessayez plus tard.' }) };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Requête invalide' }) };
    }

    const situation = (payload.situation || '').toString().trim();
    const role      = (payload.role || '').toString().trim().slice(0, 200);
    const lang      = (payload.lang || 'fr').toString().slice(0, 5);
    const mode      = (payload.mode || 'discernement').toString();
    const versets   = Array.isArray(payload.versets) ? payload.versets.slice(0, 2) : null;
    const lectures  = payload.lectures && typeof payload.lectures === 'object' ? payload.lectures : null;

    if (!situation) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Veuillez décrire votre situation.' }) };
    }
    if (situation.length > 4000) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Le texte est trop long (4000 caractères maximum).' }) };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: buildMessages({ situation, role, lang, mode, versets, lectures }),
                max_tokens: mode === 'homelie' ? 900 : 700,
                temperature: 0.7
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        const data = await res.json();

        if (!res.ok) {
            console.error('OpenAI error', res.status, JSON.stringify(data).slice(0, 500));
            return { statusCode: 502, headers, body: JSON.stringify({ error: 'Le service de réponse est momentanément indisponible. Réessayez dans un instant.' }) };
        }

        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) {
            return { statusCode: 502, headers, body: JSON.stringify({ error: 'Réponse vide. Réessayez.' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ response: text }) };
    } catch (err) {
        console.error('discern error', err.message);
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Une erreur est survenue. Réessayez dans un instant.' }) };
    }
};
