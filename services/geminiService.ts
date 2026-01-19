
import { GoogleGenAI, Type } from "@google/genai";

// Initialisation de l'API avec la clé d'environnement
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const extractErrorMessage = (error: any): string => {
  // Parfois l'erreur est une chaîne JSON
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      if (parsed.error?.message) return parsed.error.message;
    } catch (e) {}
    return error;
  }

  // Erreur venant du SDK
  const msg = error?.message || "";
  if (msg.includes("leaked")) {
    return "Sécurité : Votre clé API a été signalée comme compromise (leaked) et a été désactivée par Google. Veuillez utiliser une clé valide dans vos variables d'environnement.";
  }
  
  if (error?.error?.message) return error.error.message;
  if (error?.status) return `Erreur ${error.status}: ${msg}`;
  
  return msg || "Une erreur inattendue est survenue lors de la communication avec l'IA.";
};

const safeParseJson = (text: any) => {
  if (!text || text === "undefined") return null;
  try {
    const cleaned = typeof text === 'string' 
      ? text.replace(/```json\n?|```/g, '').trim() 
      : JSON.stringify(text);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error. Raw content:", text);
    return null;
  }
};

export const generateCourseOutline = async (topic: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es un ingénieur pédagogique de classe mondiale. 
      Crée un programme de cours magistral pour le sujet suivant : "${topic}".
      Le programme doit être d'un niveau expert, visionnaire et très structuré.
      Inclus un titre puissant, un sous-titre inspirant et 3 à 4 modules d'impact. 
      Chaque module DOIT comporter 2 à 3 leçons spécifiques avec des descriptions claires.
      Réponds exclusivement en JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  lessons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                      }
                    }
                  }
                },
                required: ["title", "lessons"]
              }
            }
          },
          required: ["title", "subtitle", "modules"]
        }
      }
    });

    const data = safeParseJson(response.text);
    if (!data) throw new Error("Le format du programme reçu est invalide.");
    return { data };
  } catch (error: any) {
    return { error: extractErrorMessage(error) };
  }
};

export const generateLessonContent = async (lessonTitle: string, courseTitle: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rédige une leçon complète et professionnelle intitulée "${lessonTitle}" pour le cours "${courseTitle}".
      
      Utilise le format Markdown :
      1. Commence par un titre #.
      2. Ajoute une introduction captivante.
      3. Développe 3 points clés avec des sous-titres ###.
      4. Inclus une citation d'expert ou une "Règle d'or" avec une citation bloc (>).
      5. Liste des étapes exploitables.
      6. Termine par un résumé.
      
      Le ton doit être sophistiqué et pédagogique.`,
      config: { 
        temperature: 0.8,
        topP: 0.95
      }
    });
    return { data: response.text || "Échec de la génération du contenu." };
  } catch (error: any) {
    return { error: extractErrorMessage(error) };
  }
};

export const generateQuiz = async (lessonTitle: string, content: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse ce contenu de leçon et crée un quiz de maîtrise de 3 questions.
      Leçon : "${lessonTitle}"
      Contenu : "${content.substring(0, 3000)}"
      
      Les questions doivent tester la compréhension profonde.
      Chaque question doit avoir 4 options et exactement 1 bonne réponse.
      Réponds en JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER, description: "Index (0-3) de la réponse correcte." }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });
    const data = safeParseJson(response.text);
    return { data: data || [] };
  } catch (error: any) {
    return { error: extractErrorMessage(error) };
  }
};
