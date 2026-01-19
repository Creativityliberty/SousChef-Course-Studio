
# 🏗️ SousChef Studio Architecture

Cette application est conçue pour être "IA-Ready", facilitant la lecture et la modification par des agents autonomes.

## 📁 Structure des Fichiers
- `/constants/theme.ts` : **Source de Vérité Design**. Toute modification de style doit commencer ici.
- `/services/geminiService.ts` : Couche d'intelligence. Gère les prompts et le parsing JSON de Gemini 3.
- `/pages/Dashboard.tsx` : Galerie des projets. Gère la création via IA.
- `/pages/BuilderPage.tsx` : **L'Atelier**. Outil d'édition structurelle.
- `/pages/CourseView.tsx` : **L'Expérience Apprenant**. La vue "Aperçu" fidèle à ce que voient les clients.

## 🛠️ Principes de Design (UI/UX)
1. **Formes Arrondies** : Utiliser exclusivement les variables `THEME.radius`. Éviter les angles droits.
2. **Espacement Aéré** : Prioriser le `white-space` pour une sensation de luxe et de clarté.
3. **Hiérarchie Visuelle** : Titres en `font-black`, sous-titres en `font-medium` colorés.

## 🤖 Instructions pour l'IA
- Pour changer une couleur, modifie `THEME.colors`.
- Pour ajouter un outil, ajoute une fonction dans `geminiService` et un bouton dans le menu flottant de `BuilderPage`.
- Le mode "Aperçu" doit toujours pointer vers `/view/:id`.
