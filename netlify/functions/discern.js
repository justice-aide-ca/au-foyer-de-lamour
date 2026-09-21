// ============================================================
// Fonction Netlify « discern » — Au Foyer de l'Amour
// Reçoit : POST { situation, role, lang, mode }
// Renvoie : { response } ou { error }
// Nécessite la variable d'environnement OPENAI_API_KEY
// (Netlify → Site settings → Environment variables)
// ============================================================

const MODE_INSTRUCTIONS = {
    fr: {
        discernement: "Aide la personne à discerner : accueille ce qu'elle vit, aide-la à distinguer ce qui apporte une paix profonde (consolation) de ce qui trouble durablement (désolation), propose une piste concrète et, si pertinent, une référence biblique.",
        consolation: "Apporte une consolation : accueille la souffrance avec tendresse, sans jugement ni leçon, et fais jaillir une espérance réaliste, comme une petite lumière dans la nuit.",
        lecture: "Propose un texte biblique en lien avec la situation (livre, chapitre, versets), cites-en un court extrait et offre une brève méditation.",
        priere: "Écris une prière simple et personnalisée, à la première personne, que la personne puisse faire sienne."
    },
    en: {
        discernement: "Help the person discern: welcome what they are living, help them distinguish what brings deep peace (consolation) from what brings lasting trouble (desolation), suggest a concrete step and, if relevant, a Bible reference.",
        consolation: "Bring consolation: welcome the suffering with tenderness, without judgment or lecture, and let a realistic hope shine through, like a small light in the night.",
        lecture: "Suggest a Bible passage related to the situation (book, chapter, verses), quote a short excerpt and offer a brief meditation.",
        priere: "Write a simple, personalized prayer, in the first person, that the person can make their own."
    }
};

const LANG_NAMES = {
    fr: 'français', en: 'English', zh: '中文（简体）',
    hi: 'हिन्दी', es: 'español', ar: 'العربية'
};

function buildMessages({ situation, role, lang, mode }) {
    const langName = LANG_NAMES[lang] || LANG_NAMES.fr;
    const modeSet = MODE_INSTRUCTIONS[lang] || MODE_INSTRUCTIONS[lang?.slice(0, 2)] || MODE_INSTRUCTIONS.fr;
    const modeInstruction = modeSet[mode] || modeSet.discernement;

    const system = `Tu es le compagnon d'écoute du site « Au Foyer de l'Amour », un espace d'aide au discernement enraciné dans la foi chrétienne et la spiritualité ignatienne (consolation, désolation, la petite lumière dans la nuit).

Règles :
- Réponds en ${langName}, avec chaleur, simplicité et respect, en 150 à 250 mots.
- Ne prétends jamais être humain : tu es une intelligence artificielle.
- Ne donne jamais d'avis médical, psychologique ou juridique.
- Si la situation semble grave (danger, idées noires, violence), prends-la très au sérieux et encourage avec douceur à contacter immédiatement une aide humaine (services d'urgence ou d'écoute du pays de la personne).
- Reste humble : propose, n'impose pas.

Tâche demandée : ${modeInstruction}`;

    let user = situation;
    if (role) user = `Contexte sur la personne : ${role}\n\nSituation : ${situation}`;

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
    const role = (payload.role || '').toString().trim().slice(0, 200);
    const lang = (payload.lang || 'fr').toString().slice(0, 5);
    const mode = (payload.mode || 'discernement').toString();

    if (!situation) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Veuillez décrire votre situation.' }) };
    }
    if (situation.length > 4000) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Le texte est trop long (4000 caractères maximum).' }) };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000); // garde-fou
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: buildMessages({ situation, role, lang, mode }),
                max_tokens: 700,
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
