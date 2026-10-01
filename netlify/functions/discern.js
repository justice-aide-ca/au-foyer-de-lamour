const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
const LANG_NAMES = { fr: 'français', en: 'English', zh: '中文', hi: 'हिन्दी', es: 'español', ar: 'العربية' };

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service en cours de configuration.' }) };

    let payload;
    try { payload = JSON.parse(event.body || '{}'); }
    catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Requête invalide' }) }; }

    const situation = (payload.situation || '').toString().trim();
    const role      = (payload.role      || '').toString().trim().slice(0, 200);
    const lang      = (payload.lang      || 'fr').toString().slice(0, 5);
    const mode      = (payload.mode      || 'discernement').toString();
    const verses    = Array.isArray(payload.verses) ? payload.verses.slice(0, 2) : null;
    const lectures  = payload.lectures && typeof payload.lectures === 'object' ? payload.lectures : null;
    const isSunday  = payload.isSunday !== false;

    if (!situation || situation.length > 6000) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Situation invalide ou trop longue.' }) };
    }

    const system = buildSystemPrompt(mode, lang, isSunday);
    const user   = buildUserPrompt({ situation, role, mode, lectures, verses, lang });
    const messages = [
        { role: 'system', content: system },
        { role: 'user',   content: user   }
    ];

    const temperature = mode === 'homelie' ? 0.4 : 0.7;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 28000);
        const res = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: MODEL, messages, temperature,
                max_tokens: mode === 'homelie' ? 900 : 800,
                presence_penalty: 0.2, frequency_penalty: 0.3
            }),
            signal: controller.signal
        }).finally(() => clearTimeout(timer));

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error('OpenAI error:', res.status, errText);
            let userMsg = 'Erreur du service IA.';
            if (res.status === 401) userMsg = 'Clé API invalide.';
            if (res.status === 429) userMsg = 'Quota IA dépassé.';
            if (res.status === 500) userMsg = 'Service IA temporairement indisponible.';
            return { statusCode: 502, headers, body: JSON.stringify({ error: userMsg }) };
        }

        const data = await res.json();
        const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
        if (!text) return { statusCode: 502, headers, body: JSON.stringify({ error: 'Réponse vide.' }) };
        return { statusCode: 200, headers, body: JSON.stringify({ response: text }) };
    } catch (err) {
        console.error('Function error:', err);
        const msg = err && err.name === 'AbortError' ? 'Délai dépassé.' : 'Erreur serveur.';
        return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) };
    }
};

function buildSystemPrompt(mode, lang, isSunday) {
    const common = {
        fr: `Tu es un accompagnateur spirituel catholique bienveillant, enraciné dans la tradition ignatienne et fidèle à l'enseignement officiel de l'Église catholique.

Tu ne remplaces jamais un prêtre, un psychologue, un médecin ni un accompagnateur humain. Tes réponses sont douces, respectueuses et jamais moralisatrices. En cas de détresse grave, tu invites fermement à contacter une personne de confiance ou les services d'urgence.

Tu cites toujours au moins un passage biblique pertinent et tu termines par une courte prière ou un pas concret.`,
        en: `You are a caring Catholic spiritual companion, rooted in the Ignatian tradition and faithful to the official teaching of the Catholic Church.

You never replace a priest, psychologist, doctor or human companion. Your answers are gentle, respectful and never moralizing. In case of serious distress, you firmly invite to contact a trusted person or emergency services.

Always quote at least one relevant Bible passage and end with a short prayer or a concrete step.`
    };
    const base = common[lang] || common.fr;

    const modePrompts = {
        discernement: {
            fr: `MODE : DISCERNEMENT. Aide à reconnaître les mouvements intérieurs : paix profonde (consolation), trouble persistant (désolation). Propose 1-2 pistes concrètes. Longueur : 250-350 mots.`,
            en: `MODE: DISCERNMENT. Help recognize interior movements: deep peace (consolation), persistent agitation (desolation). Suggest 1-2 concrete steps. Length: 250-350 words.`
        },
        consolation: {
            fr: `MODE : CONSOLATION. Accueille la souffrance sans jugement. Redonne de l'espérance. Ton doux. Longueur : 200-300 mots.`,
            en: `MODE: CONSOLATION. Welcome suffering without judgment. Restore hope. Gentle tone. Length: 200-300 words.`
        },
        lecture: {
            fr: `MODE : LECTURE BIBLIQUE. Propose un passage adapté, une méditation courte, une question finale. Longueur : 200-300 mots.`,
            en: `MODE: BIBLE READING. Suggest an adapted passage, a short meditation, a final question. Length: 200-300 words.`
        },
        priere: {
            fr: `MODE : PRIÈRE. Compose une prière personnalisée. Introduction brève, prière, Amen. Longueur : 150-250 mots.`,
            en: `MODE: PRAYER. Compose a personalized prayer. Brief intro, prayer, Amen. Length: 150-250 words.`
        },
        homelie: {
            fr: isSunday
                ? `MODE : PRÉPARATION D'HOMÉLIE DOMINICALE. Méthode (inspirée de Mgr Pellegrino et du P. Kadavil) :
1. DÉGAGER LE MESSAGE DE LA PAROLE : cœur théologique unifié des lectures.
2. CHOISIR L'HISTOIRE EN FONCTION DU MESSAGE : histoire du quotidien incarnant le message.
3. STYLE DIRECT ET ORAL SANS TITRE. Pas d'intertitre, pas de puces.
4. STRUCTURE EN EXACTEMENT 4 PARAGRAPHES continus (P1 histoire / P2 1ère lecture + Évangile / P3 2ème lecture + Psaume / P4 actualisation + Amen).
5. LONGUEUR : 300 mots MAXIMUM strict.
6. Fidèle au Directoire sur l'homélie et Dei Verbum 12.
7. DROITS D'AUTEUR : synthèse, jamais de reproduction intégrale.`
                : `MODE : MÉDITATION DE FÉRIE (semaine). Méthode (inspirée du P. Kadavil) :
1. Dégage en une phrase le message central de l'Évangile du jour.
2. Illustre-le par une image ou histoire-éclair du quotidien.
3. Propose UN acte concret à poser aujourd'hui.
4. Termine par une prière d'une phrase.
STRUCTURE : un seul paragraphe continu + une prière finale. Pas de titre, pas de puces, pas de numéros.
LONGUEUR : 200 mots MAXIMUM strict.`,
            en: isSunday
                ? `MODE: SUNDAY HOMILY PREPARATION. Method (inspired by Msgr Pellegrino and Fr Kadavil):
1. EXTRACT THE MESSAGE of the Word.
2. CHOOSE THE STORY ACCORDING TO THE MESSAGE.
3. DIRECT ORAL STYLE, NO TITLE.
4. STRUCTURE IN EXACTLY 4 CONTINUOUS PARAGRAPHS.
5. LENGTH: 300 WORDS MAXIMUM.
6. Faithful to the Homily Directory and Dei Verbum 12.
7. COPYRIGHT: synthesis only.`
                : `MODE: WEEKDAY MEDITATION. Method (inspired by Fr Kadavil):
1. One-sentence message of the Gospel.
2. Flash story from daily life.
3. ONE concrete act for today.
4. One-sentence closing prayer.
STRUCTURE: one continuous paragraph + final prayer. No title, no bullets.
LENGTH: 200 WORDS MAXIMUM.`
        }
    };

    const modeBlock = (modePrompts[mode] && (modePrompts[mode][lang] || modePrompts[mode].fr)) || '';
    const langName = LANG_NAMES[lang] || 'français';
    const langLine = (lang === 'fr')
        ? `\n\n🌍 LANGUE DE RÉPONSE OBLIGATOIRE : FRANÇAIS. Rédige TOUT ton texte en français, sans exception.`
        : `\n\n🌍 MANDATORY RESPONSE LANGUAGE: ${langName.toUpperCase()}. You MUST write your ENTIRE answer in ${langName}. NEVER use French, even if instructions above are in French.`;

    return `${base}\n\n${modeBlock}${langLine}`;
}

function buildUserPrompt({ situation, role, mode, lectures, verses, lang }) {
    const langName = LANG_NAMES[lang] || 'français';
    let prompt = '';

    if (mode === 'homelie' && lectures) {
        prompt += `Lectures liturgiques du jour :\n`;
        if (lectures.lecture1) prompt += `- Première lecture : ${lectures.lecture1}\n`;
        if (lectures.psaume)   prompt += `- Psaume : ${lectures.psaume}\n`;
        if (lectures.lecture2) prompt += `- Deuxième lecture : ${lectures.lecture2}\n`;
        if (lectures.evangile) prompt += `- Évangile : ${lectures.evangile}\n`;
        if (lectures.theme)    prompt += `- Thème : ${lectures.theme}\n`;
        prompt += `\n`;
        if (lectures.evangileTexte) {
            prompt += `Extrait de l'Évangile :\n"""${lectures.evangileTexte.slice(0, 1500)}"""\n\n`;
        }
        prompt += `⚠️ Rédige maintenant l'homélie ENTIÈREMENT en ${langName.toUpperCase()}. Chaque phrase, chaque mot doit être en ${langName}, y compris les noms des livres bibliques. Ne réponds pas en français sauf si la langue demandée est le français.`;
        return prompt;
    }

    prompt += `Situation de la personne :\n"""${situation}"""\n`;
    if (role) prompt += `\nRôle / vocation : ${role}\n`;
    if (verses && verses.length) {
        prompt += `\nPassages bibliques :\n`;
        verses.forEach(v => { prompt += `- ${v.ref || ''} : ${v.texte || ''}\n`; });
    }
    prompt += `\n⚠️ Réponds OBLIGATOIREMENT en ${langName.toUpperCase()}, avec un ton pastoral et concret.`;
    return prompt;
}
