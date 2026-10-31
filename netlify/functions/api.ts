import { GoogleGenAI } from '@google/genai';

// Initialize Gemini if GEMINI_API_KEY or process.env is set
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function jsonResponse(body: any, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event: any) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const path = event.path || '';
  let body: any = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  // 1. AI Summarize Route
  if (path.includes('/summarize')) {
    const courseName = body.courseName || 'Module universitaire';
    const topic = body.topic || body.chapterTitle || 'Notions Fondamentales';
    const rawText = body.rawText || '';
    const language = body.language || 'fr';

    if (ai) {
      try {
        const prompt = `Tu es STUDIA AI, professeur universitaire d'élite.
Génère un résumé académique structuré pour le cours : ${courseName}, sujet : ${topic}, langue : ${language}.
Contenu de référence :
"""
${(rawText || `Cours sur ${courseName} - ${topic}`).slice(0, 15000)}
"""

Format JSON attendu :
{
  "title": "TITLE: ${courseName} - ${topic}",
  "academicSummaryText": "TITLE: ${courseName} - ${topic}\\n\\nSECTION 1: Définition et Cadre Général\\nExplication...\\n\\nSECTION 2: Concepts Clés\\nExplication...\\n\\nSECTION 3: Importance et Applications\\nExplication...",
  "summary": "Résumé textuel",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Définition et Cadre Général",
      "content": "Explication claire...",
      "keyPoints": ["Point 1", "Point 2"]
    }
  ],
  "definitions": [{ "term": "${topic}", "definition": "Définition précise issue du cours" }],
  "keyTakeaways": ["Point essentiel 1", "Point essentiel 2"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse(response.text || '{}');
        return jsonResponse({ result: parsed });
      } catch (err: any) {
        console.error('Gemini error in netlify function:', err);
      }
    }

    // Deterministic academic fallback if no API key or error
    const academicSummaryText = `TITLE: ${courseName} - ${topic}

SECTION 1: Définition et Principes Fondamentaux de ${topic}
${topic} est une notion centrale au sein de ${courseName}. Elle regroupe l'ensemble des définitions formelles et règles méthodologiques nécessaires à la compréhension globale du domaine.

SECTION 2: Concepts et Propriétés Essentielles
L'analyse approfondie permet d'identifier les mécanismes distinctifs, les critères d'application et les points d'attention cruciaux pour les examens.

SECTION 3: Importance et Applications Pratiques
La maîtrise rigoureuse de ces notions garantit une résolution méthodique des problèmes d'examen et une application directe dans les cas réels.`;

    return jsonResponse({
      result: {
        title: `TITLE: ${courseName} - ${topic}`,
        courseName,
        topic,
        academicSummaryText,
        summary: academicSummaryText,
        sections: [
          { sectionNumber: 1, title: `Définition et Principes de ${topic}`, content: `${topic} est un concept clé de ${courseName}.` },
          { sectionNumber: 2, title: `Concepts et Propriétés Essentielles`, content: `Différenciation méthodique des notions.` },
          { sectionNumber: 3, title: `Importance et Applications`, content: `Applications pratiques et points d'examen.` },
        ],
        definitions: [
          { term: topic, definition: `Concept central de ${courseName} indispensable pour les évaluations.` },
        ],
        keyTakeaways: [
          `Maîtriser la définition exacte de ${topic}.`,
          `Pratiquer l'auto-évaluation avec flashcards et quiz.`,
        ],
      },
    });
  }

  // 2. AI Flashcards Route
  if (path.includes('/flashcards-generate')) {
    const courseName = body.courseName || 'Notions Fondamentales';
    const topic = body.topic || 'Concepts Clés';
    const rawText = body.rawText || '';
    const count = body.count || 5;

    if (ai) {
      try {
        const prompt = `Génère ${count} flashcards d'apprentissage pour ${courseName} (${topic}).
Chaque carte doit comporter FRONT (question/concept/terme) et BACK (réponse exacte + explication claire).
Contenu :
"""
${(rawText || `Concepts de ${courseName} - ${topic}`).slice(0, 10000)}
"""
Format JSON :
{
  "flashcards": [
    {
      "front": "Question ou concept",
      "back": "Réponse exacte. Explication : explication claire",
      "topic": "${topic}"
    }
  ]
}`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse(response.text || '{}');
        const cards = (parsed.flashcards || []).map((c: any, i: number) => ({
          id: `fc-net-${Date.now()}-${i}`,
          courseId: 'general',
          courseTitle: courseName,
          topic: c.topic || topic,
          front: c.front || c.question,
          back: c.back || c.answer,
          question: c.front || c.question,
          answer: c.back || c.answer,
          box: 1,
          nextReviewDate: new Date().toISOString(),
          timesReviewed: 0,
          timesCorrect: 0,
        }));
        return jsonResponse({ flashcards: cards });
      } catch (err: any) {
        console.error('Gemini error in netlify flashcards:', err);
      }
    }

    // Deterministic fallback flashcards
    const fallbackCards = [
      {
        id: `fc-net-${Date.now()}-1`,
        courseId: 'general',
        courseTitle: courseName,
        topic,
        front: `Définition fondamentale : Qu'est-ce que ${topic} dans le cadre de ${courseName} ?`,
        back: `${topic} est le concept central du cours. Explication : Sa compréhension précise est requise pour répondre aux questions d'examen sans confusion.`,
        question: `Qu'est-ce que ${topic} ?`,
        answer: `${topic} est le concept central du cours.`,
        box: 1,
        nextReviewDate: new Date().toISOString(),
        timesReviewed: 0,
        timesCorrect: 0,
      },
      {
        id: `fc-net-${Date.now()}-2`,
        courseId: 'general',
        courseTitle: courseName,
        topic,
        front: `Méthode de mémorisation : Comment réviser efficacement ${courseName} ?`,
        back: `Pratiquer le rappel actif quotidien et l'auto-évaluation espacée par cartes mémoire. Explication : La méthode Leitner ancre les connaissances durablement.`,
        question: `Comment réviser efficacement ${courseName} ?`,
        answer: `Pratiquer le rappel actif et la méthode Leitner.`,
        box: 1,
        nextReviewDate: new Date().toISOString(),
        timesReviewed: 0,
        timesCorrect: 0,
      },
    ];

    return jsonResponse({ flashcards: fallbackCards });
  }

  return jsonResponse({ ok: true, message: 'STUDIA AI Netlify Function active.' });
};
