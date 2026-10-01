// netlify/functions/discern.js
// Fonction serverless : discernement spirituel + génération d'homélies
// Compatible OpenAI (gpt-4o-mini / gpt-4o)

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const LANG_NAMES = {
    fr: 'français',
    en: 'English',
    zh: '中文',
    hi: 'हिन्दी',
    es: 'español',
    ar: 'العربية'
};

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service en cours de configuration.' }) };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Requête invalide' }) };
    }

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

    // Température plus basse pour l'homélie → obéissance au prompt
    const temperature = mode === 'homelie' ? 0.4 : 0.7;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 28000);

        const res = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                temperature,
                max_tokens: mode === 'homelie' ? 900 : 800,
                presence_penalty: 0.2,
                frequency_penalty: 0.3
            }),
            signal: controller.signal
        }).finally(() => clearTimeout(timer));

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error('OpenAI error:', res.status, errText);
            let userMsg = 'Erreur du service IA.';
            if (res.status === 401) userMsg = 'Clé API invalide.';
            if (res.status === 429) userMsg = 'Quota IA dépassé. Réessayez plus tard.';
            if (res.status === 500) userMsg = 'Service IA temporairement indisponible.';
            return { statusCode: 502, headers, body: JSON.stringify({ error: userMsg }) };
        }

        const data = await res.json();
        const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
        if (!text) {
            return { statusCode: 502, headers, body: JSON.stringify({ error: 'Réponse vide de l\'IA.' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ response: text }) };
    } catch (err) {
        console.error('Function error:', err);
        const msg = err && err.name === 'AbortError' ? 'Délai dépassé.' : 'Erreur serveur.';
        return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) };
    }
};

/* ============================================================
   PROMPT SYSTÈME
   ============================================================ */
function buildSystemPrompt(mode, lang, isSunday) {
    const common = {
        fr: `Tu es un accompagnateur spirituel catholique bienveillant, enraciné dans la tradition ignatienne (consolation, désolation, discernement des esprits) et fidèle à l'enseignement officiel de l'Église catholique.

Tu ne remplaces jamais un prêtre, un psychologue, un médecin ni un accompagnateur humain. Tes réponses sont douces, respectueuses et jamais moralisatrices. Tu ne donnes jamais de diagnostic médical ou psychologique. En cas de détresse grave (idées suicidaires, violence, urgence), tu invites fermement à contacter une personne de confiance, un professionnel ou les services d'urgence.

Tu cites toujours au moins un passage biblique pertinent. Tu termines par une courte prière ou un pas concret à poser.`,
        en: `You are a caring Catholic spiritual companion, rooted in the Ignatian tradition (consolation, desolation, discernment of spirits) and faithful to the official teaching of the Catholic Church.

You never replace a priest, a psychologist, a doctor or a human companion. Your answers are gentle, respectful and never moralizing. You never give medical or psychological diagnoses. In case of serious distress (suicidal thoughts, violence, emergency), you firmly invite the person to contact a trusted person, a professional or emergency services.

Always quote at least one relevant Bible passage. End with a short prayer or a concrete step.`
    };

    const base = common[lang] || common.fr;

    const modePrompts = {
        discernement: {
            fr: `MODE : DISCERNEMENT.
- Aide la personne à reconnaître les mouvements intérieurs : paix profonde et durable (consolation, vient de Dieu), trouble persistant et agitation sans issue (désolation, vient d'un autre esprit).
- Propose 1 à 2 pistes concrètes pour avancer dans le discernement.
- Longueur : 250 à 350 mots.`,
            en: `MODE: DISCERNMENT.
- Help the person recognize interior movements: deep lasting peace (consolation, from God), persistent agitation (desolation, from another spirit).
- Suggest 1-2 concrete steps.
- Length: 250-350 words.`
        },
        consolation: {
            fr: `MODE : CONSOLATION.
- Accueille la souffrance sans jugement ni minimisation.
- Redonne de l'espérance, rappelle la présence de Dieu dans l'épreuve.
- Sois doux, lent, maternel/paternel dans le ton.
- Longueur : 200 à 300 mots.`,
            en: `MODE: CONSOLATION.
- Welcome suffering without judgment.
- Restore hope, recall God's presence in trial.
- Gentle, slow tone.
- Length: 200-300 words.`
        },
        lecture: {
            fr: `MODE : LECTURE BIBLIQUE.
- Propose un passage biblique adapté à la situation.
- Offre une méditation courte qui fait le lien entre le texte et la vie concrète.
- Termine par une question à méditer.
- Longueur : 200 à 300 mots.`,
            en: `MODE: BIBLE READING.
- Suggest a Bible passage suited to the situation.
- Offer a short meditation linking text to life.
- End with a question to ponder.
- Length: 200-300 words.`
        },
        priere: {
            fr: `MODE : PRIÈRE.
- Compose une prière personnalisée à partir de la situation décrite.
- Ton simple, direct, adressé à Dieu (Père, Seigneur, Jésus).
- Commence par une brève introduction, puis la prière, puis un Amen.
- Longueur : 150 à 250 mots.`,
            en: `MODE: PRAYER.
- Compose a personalized prayer from the situation.
- Simple, direct tone, addressed to God.
- Brief intro, then prayer, then Amen.
- Length: 150-250 words.`
        },
        homelie: {
            fr: isSunday
                ? `MODE : PRÉPARATION D'HOMÉLIE DOMINICALE.

Tu prépares une homélie pour un prêtre, à partir des lectures liturgiques fournies.

MÉTHODE OBLIGATOIRE (inspirée de Mgr Joseph A. Pellegrino et du Père Tony Kadavil) :
1. DÉGAGER D'ABORD LE MESSAGE DE LA PAROLE : analyse l'Évangile et les lectures pour identifier leur cœur théologique unifié (ce que Dieu dit et demande aujourd'hui).
2. CHOISIR L'HISTOIRE EN FONCTION DU MESSAGE : ne raconte pas une anecdote générique ; forge une histoire du quotidien dont la situation et la leçon incarnent EXACTEMENT le message biblique dégagé.
3. STYLE DIRECT ET ORAL SANS TITRE : entre directement dans le vif du sujet par cette histoire. Pas d'intertitre, pas de mention « Introduction » ou « 1. », pas de puces.
4. STRUCTURE EN EXACTEMENT 4 PARAGRAPHES continus (séparés par un saut de ligne) :
   - P1 : histoire/parabole concrète du quotidien
   - P2 : transition naturelle (« C'est exactement ce que nous dit la Parole de Dieu aujourd'hui… »), 1ère lecture + Évangile
   - P3 : éclairage de la 2ème lecture et du Psaume
   - P4 : actualisation pastorale concrète + courte prière finale (« Amen. »)
5. LONGUEUR : 300 mots MAXIMUM, strict.
6. FIDÉLITÉ : respecte le Directoire sur l'homélie et Dei Verbum 12.
7. DROITS D'AUTEUR : synthétise la méthode sans jamais reproduire de passages entiers des sources.`
                : `MODE : MÉDITATION DE FÉRIE (semaine).

Tu prépares une courte méditation pour un jour de semaine, à partir des lectures liturgiques fournies.

MÉTHODE (inspirée du Père Tony Kadavil) :
1. Dégage en une phrase le message central de l'Évangile du jour.
2. Illustre-le par une image ou une histoire-éclair du quotidien.
3. Propose UN acte concret à poser aujourd'hui.
4. Termine par une prière d'une phrase.

STRUCTURE : un seul paragraphe continu + une prière finale. Pas de titre, pas de puces, pas de numéros.
LONGUEUR : 200 mots MAXIMUM, strict.`,
            en: isSunday
                ? `MODE: SUNDAY HOMILY PREPARATION.

You prepare a homily for a priest, based on the liturgical readings provided.

REQUIRED METHOD (inspired by Msgr Joseph A. Pellegrino and Fr Tony Kadavil):
1. FIRST EXTRACT THE MESSAGE OF THE WORD: analyze the Gospel and readings to identify their unified theological core.
2. CHOOSE THE STORY ACCORDING TO THE MESSAGE: forge a daily-life story whose situation and lesson embody EXACTLY the biblical message.
3. DIRECT ORAL STYLE, NO TITLE: begin directly with the story. No subtitles, no bullets.
4. STRUCTURE IN EXACTLY 4 CONTINUOUS PARAGRAPHS:
   - P1: concrete story/parable from daily life
   - P2: natural transition + first reading + Gospel
   - P3: second reading and Psalm
   - P4: pastoral application + short final prayer ("Amen.")
5. LENGTH: 300 WORDS MAXIMUM, strict.
6. Faithful to the Homily Directory and Dei Verbum 12.
7. COPYRIGHT: synthesize, never reproduce full passages.`
                : `MODE: WEEKDAY MEDITATION.

You prepare a short weekday meditation based on the liturgical readings provided.

METHOD (inspired by Fr Tony Kadavil):
1. State in one sentence the central message of the day's Gospel.
2. Illustrate it with a daily-life image or flash story.
3. Suggest ONE concrete act for today.
4. End with a one-sentence prayer.

STRUCTURE: one continuous paragraph + final prayer. No title, no bullets, no numbers.
LENGTH: 200 WORDS MAXIMUM, strict.`
        }
    };

    const modeBlock = (modePrompts[mode] && (modePrompts[mode][lang] || modePrompts[mode].fr)) || '';

    // ⚡ RENFORCEMENT DE LA LANGUE
    const langName = LANG_NAMES[lang] || 'français';
    let langLine;
    if (lang === 'fr') {
        langLine = `\n\n🌍 LANGUE DE RÉPONSE OBLIGATOIRE : FRANÇAIS. Tu dois rédiger TOUT ton texte en français, sans exception.`;
    } else {
        langLine = `\n\n🌍 MANDATORY RESPONSE LANGUAGE: ${langName.toUpperCase()}. You MUST write your ENTIRE answer in ${langName}. Every sentence, every word, every biblical book name must be in ${langName}. NEVER use French, even if the instructions above are written in French.`;
    }

    return `${base}\n\n${modeBlock}${langLine}`;
}

/* ============================================================
   PROMPT UTILISATEUR
   ============================================================ */
function buildUserPrompt({ situation, role, mode, lectures, verses, lang }) {
    const langName = LANG_NAMES[lang] || 'français';
    let prompt = '';

    if (mode === 'homelie' && lectures) {
        prompt += `Lectures liturgiques du jour :\n`;
        if (lectures.lecture1) prompt += `- Première lecture : ${lectures.lecture1}\n`;
        if (lectures.psaume)   prompt += `- Psaume : ${lectures.psaume}\n`;
        if (lectures.lecture2) prompt += `- Deuxième lecture : ${lectures.lecture2}\n`;
        if (lectures.evangile) prompt += `- Évangile : ${lectures.evangile}\n`;
        if (lectures.theme)    prompt += `- Thème / intention : ${lectures.theme}\n`;
        prompt += `\n`;
        if (lectures.evangileTexte) {
            prompt += `Texte de l'Évangile (extrait) :\n"""${lectures.evangileTexte.slice(0, 1500)}"""\n\n`;
        }
        prompt += `⚠️ Rédige maintenant l'homélie ENTIÈREMENT en ${langName.toUpperCase()}. `;
        prompt += `Chaque phrase, chaque mot doit être en ${langName}. `;
        prompt += `Les noms des livres bibliques doivent aussi être dans cette langue `;
        prompt += `(par exemple, "Matthieu" en français devient "Matthew" en anglais). `;
        prompt += `Ne réponds pas en français sauf si la langue demandée est le français.`;
        return prompt;
    }

    prompt += `Situation de la personne :\n"""${situation}"""\n`;
    if (role) prompt += `\nRôle / vocation : ${role}\n`;
    if (verses && verses.length) {
        prompt += `\nPassages bibliques suggérés :\n`;
        verses.forEach(v => { prompt += `- ${v.ref || ''} : ${v.texte || ''}\n`; });
    }
    prompt += `\n⚠️ Réponds OBLIGATOIREMENT en ${langName.toUpperCase()}, avec un ton pastoral, structuré et concret. `;
    prompt += `Ne réponds pas en français sauf si le français est demandé.`;
    return prompt;
}
