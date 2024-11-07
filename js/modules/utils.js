export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function loadTranslations(language, translationCache) {
    if (translationCache[language]) {
        return translationCache[language];
    }
    try {
        const response = await fetch(`assets/translations/${language}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const translations = await response.json();
        translationCache[language] = translations;
        return translations;
    } catch (error) {
        console.error("Error loading translations:", error);
        return {};
    }
}