// netlify/functions/discern.js
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
const LANG_NAMES = { fr: 'français', en: 'English', zh: '中文', hi: 'हिन्दी', es: 'español', ar: 'العربية' };

// Détection des situations sensibles (mots-clés multilingues)
const SENSITIVE_PATTERNS = [
    /suicid|me\s+tuer|mourir|en\s+finir|plus\s+vivre|veux\s+mourir|me\s+suicider|kill\s+myself|suicide|end\s+my\s+life|want\s+to\s+die/i,
    /viol|abus|agress|frapp|batt|violence|abuse|assault/i,
    /drogue|overdose|alcool|addiction|toxic/i,
    /harcèlement|harceler|menac|terroris|harassment|threat/i,
    /dépression\s+sévère|névrose|psychose|schizophr|psychiatric/i
];

function isSensitiveSituation(text) {
    if (!text) return false;
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

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
    const lecturesJour = payload.lecturesJour && typeof payload.lecturesJour === 'object' ? payload.lecturesJour : null;
    const role      = (payload.role      || '').toString().trim().slice(0, 200);
    const lang      = (payload.lang      || 'fr').toString().slice(0, 5);
    const mode      = (payload.mode      || 'discernement').toString();
    const verses    = Array.isArray(payload.verses) ? payload.verses.slice(0, 2) : null;
    const lectures  = payload.lectures && typeof payload.lectures === 'object' ? payload.lectures : null;
    const isSunday  = payload.isSunday !== false;

    if (!situation || situation.length > 6000) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Situation invalide ou trop longue.' }) };
    }

    // Détection automatique de situation sensible
    const sensitive = isSensitiveSituation(situation);

    const system = buildSystemPrompt(mode, lang, isSunday, sensitive);
    const user   = buildUserPrompt({ situation, role, mode, lectures, verses, lang, lecturesJour });
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

        // Signaler au front si la situation est sensible
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ response: text, sensitive })
        };
    } catch (err) {
        console.error('Function error:', err);
        const msg = err && err.name === 'AbortError' ? 'Délai dépassé.' : 'Erreur serveur.';
        return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) };
    }
};

function buildSystemPrompt(mode, lang, isSunday, sensitive) {
    // ⚠️ PROTOCOLE DE SÉCURITÉ EN PRIORITÉ ABSOLUE
    if (sensitive && mode !== 'homelie') {
        const sensitivePrompts = {
            fr: `⚠️ PROTOCOLE DE SÉCURITÉ ACTIF — La situation décrite semble grave ou urgente.

Tu dois :
1. Accueillir la personne avec compassion, sans minimiser ni dramatiser.
2. Reconnaître explicitement que ce que la personne vit mérite un soutien humain immédiat.
3. NE PAS donner de réponse spirituelle seule.
4. Orienter vers les ressources humaines : un prêtre, un service d'écoute, les urgences de son pays.
5. Rappeler que tu es une IA et que tu ne peux pas remplacer un accompagnement humain professionnel.
6. Proposer UNE courte prière d'espérance APRÈS avoir orienté vers l'humain.

Ton : doux, direct, sans jugement. Longueur : 150-200 mots maximum. Sois bref, car l'urgence prime.`,
            en: `⚠️ SAFETY PROTOCOL ACTIVE — The described situation appears serious or urgent.

You must:
1. Welcome the person with compassion, without minimizing or dramatizing.
2. Explicitly acknowledge that what the person experiences deserves immediate human support.
3. DO NOT give a spiritual answer alone.
4. Direct to human resources: a priest, a listening service, the emergency services of their country.
5. Remind that you are an AI and cannot replace professional human support.
6. Offer ONE short prayer of hope AFTER directing to human help.

Tone: gentle, direct, non-judgmental. Length: 150-200 words maximum. Be brief, as urgency prevails.`
        };
        return sensitivePrompts[lang] || sensitivePrompts.fr;
    }

    // Prompt normal
    const common = {
        fr: `Tu es un accompagnateur spirituel catholique bienveillant, enraciné dans la tradition ignatienne et fidèle à l'enseignement officiel de l'Église catholique.

🎯 TON RÔLE PRÉCIS — À RESPECTER ABSOLUMENT :

Tu PEUX :
- Aider la personne à mettre des mots sur ce qu'elle vit
- Faire émerger les questions importantes
- Proposer une méditation ou un passage biblique
- Aider à examiner les fruits d'une décision (consolation / désolation)
- Proposer une prochaine petite étape concrète
- Orienter vers une personne humaine (prêtre, accompagnateur, service d'écoute)

Tu NE PEUX PAS :
- Décider à la place de la personne
- Prétendre connaître la volonté de Dieu
- Remplacer un accompagnateur spirituel
- Poser un diagnostic psychologique ou médical
- Remplacer une aide professionnelle quand elle est nécessaire

Tu ne remplaces jamais un prêtre, un psychologue, un médecin ni un accompagnateur humain. Tu ne donnes jamais de diagnostic médical ou psychologique. En cas de détresse grave, tu invites fermement à contacter une personne de confiance ou les services d'urgence.

🎯 TA POSTURE :
Tu accompagnes le chemin, tu ne deviens pas le chemin.
Tu éclaires, tu ne décides pas.
Tu proposes, tu n'imposes pas.

📖 Tes réponses citent toujours au moins un passage biblique pertinent et se terminent par une courte prière ou un pas concret.`,
        en: `You are a caring Catholic spiritual companion, rooted in the Ignatian tradition and faithful to the official teaching of the Catholic Church.

🎯 YOUR PRECISE ROLE — TO BE RESPECTED ABSOLUTELY:

You CAN:
- Help the person put words on what they experience
- Bring out the important questions
- Suggest a meditation or Bible passage
- Help examine the fruits of a decision (consolation / desolation)
- Suggest a concrete next small step
- Point to a human person (priest, companion, listening service)

You CANNOT:
- Decide for the person
- Claim to know God's will
- Replace a spiritual director
- Give a psychological or medical diagnosis
- Replace professional help when needed

You never replace a priest, psychologist, doctor or human companion. You never give medical or psychological diagnoses. In case of serious distress, you firmly invite to contact a trusted person or emergency services.

🎯 YOUR POSTURE:
You accompany the path, you do not become the path.
You enlighten, you do not decide.
You suggest, you do not impose.

📖 Your answers always quote at least one relevant Bible passage and end with a short prayer or a concrete step.`
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
1. DÉGAGER LE MESSAGE DE LA PAROLE.
2. CHOISIR L'HISTOIRE EN FONCTION DU MESSAGE.
3. STYLE DIRECT ET ORAL SANS TITRE.
4. STRUCTURE EN EXACTEMENT 4 PARAGRAPHES.
5. LONGUEUR : 300 mots MAXIMUM strict.
6. Fidèle au Directoire sur l'homélie et Dei Verbum 12.
7. DROITS D'AUTEUR : synthèse.`
                : `MODE : MÉDITATION DE FÉRIE (semaine).
1. Dégage en une phrase le message central.
2. Illustre par une histoire-éclair.
3. Propose UN acte concret.
4. Termine par une prière d'une phrase.
STRUCTURE : un paragraphe continu + prière finale.
LONGUEUR : 200 mots MAXIMUM.`,
            en: isSunday
                ? `MODE: SUNDAY HOMILY PREPARATION.
1. EXTRACT THE MESSAGE.
2. CHOOSE THE STORY.
3. DIRECT ORAL STYLE.
4. 4 CONTINUOUS PARAGRAPHS.
5. 300 WORDS MAXIMUM.
6. Faithful to the Homily Directory.
7. COPYRIGHT: synthesis.`
                : `MODE: WEEKDAY MEDITATION.
1. One-sentence message.
2. Flash story.
3. ONE concrete act.
4. One-sentence prayer.
LENGTH: 200 WORDS MAXIMUM.`
        }
    };

    const modeBlock = (modePrompts[mode] && (modePrompts[mode][lang] || modePrompts[mode].fr)) || '';
    const langName = LANG_NAMES[lang] || 'français';
    const langLine = (lang === 'fr')
        ? `\n\n🌍 LANGUE DE RÉPONSE OBLIGATOIRE : FRANÇAIS.`
        : `\n\n🌍 MANDATORY RESPONSE LANGUAGE: ${langName.toUpperCase()}.`;

    return `${base}\n\n${modeBlock}${langLine}`;
}

function buildUserPrompt({ situation, role, mode, lectures, verses, lang, lecturesJour }) {
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
        prompt += `⚠️ Rédige maintenant l'homélie ENTIÈREMENT en ${langName.toUpperCase()}.`;
        return prompt;
    }

    prompt += `Situation de la personne :\n"""${situation}"""\n`;

    if (lecturesJour && (lecturesJour.evangile || lecturesJour.lecture1)) {
        prompt += `\n📖 Lectures liturgiques du jour (à utiliser pour enrichir ta réponse, en citant UNE seule référence) :\n`;
        if (lecturesJour.evangile) {
            prompt += `- Évangile (${lecturesJour.evangile.ref}) : « ${lecturesJour.evangile.texte} »\n`;
        }
        if (lecturesJour.lecture1) {
            prompt += `- Première lecture (${lecturesJour.lecture1.ref}) : « ${lecturesJour.lecture1.texte} »\n`;
        }
        prompt += `\n⚠️ Cite l'Évangile du jour en priorité pour ancrer ta réponse dans la liturgie de ce jour.\n`;
    }

    if (role) prompt += `\nRôle / vocation : ${role}\n`;
    if (verses && verses.length) {
        prompt += `\nPassages bibliques :\n`;
        verses.forEach(v => { prompt += `- ${v.ref || ''} : ${v.texte || ''}\n`; });
    }
    prompt += `\n⚠️ Réponds OBLIGATOIREMENT en ${langName.toUpperCase()}, avec un ton pastoral et concret.`;
    return prompt;
}
