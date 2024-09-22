let flags = [];
let remainingFlags = [];
let currentFlag;
let correctOption;
let correctCount = 0; // Track the number of correct answers
let totalCount = 0; // Track the total number of questions
const flagImg = document.getElementById('flag');
const options = document.querySelectorAll('.option');
const languageSelect = document.getElementById('language-select');
const scoreLabel = document.getElementById('score'); // Get the score label element
const modeButton = document.getElementById('mode-button');
const modeOverlay = document.getElementById('mode-overlay');
const closeModeButton = document.getElementById('close-mode');
let translations = {};

// Load translations for the selected language
async function loadTranslations(language) {
    try {
        const response = await fetch(`translations/${language}.json`);
        translations = await response.json();
    } catch (error) {
        console.error("Error loading translations:", error);
    }
}

// Fetch flags data
async function fetchFlags() {
    try {
        const response = await fetch('flags.json');
        flags = await response.json();
        remainingFlags = [...flags]; // Initialize remaining flags
        nextFlag();
    } catch (error) {
        console.error("Error fetching flags:", error);
    }
}

// Update the flag and options
function nextFlag() {
    if (remainingFlags.length === 0) {
        remainingFlags = [...flags]; // Refill the remaining flags
    }

    // Shuffle the remaining flags array
    const shuffledFlags = remainingFlags.sort(() => 0.5 - Math.random());

    // Pick a random flag from remaining flags
    currentFlag = shuffledFlags[0];
    flagImg.src = currentFlag.url;
    flagImg.onload = () => console.log(`Loaded: ${currentFlag.url}`);
    flagImg.onerror = () => console.error(`Error loading flag: ${currentFlag.url}`);

    updateOptions();
}

// Update the options based on the current translations and current flag
function updateOptions() {
    // Pick three random incorrect options from the full list excluding the current flag
    const incorrectOptions = flags.filter(f => f !== currentFlag).sort(() => 0.5 - Math.random()).slice(0, 3);

    // Place the correct option randomly
    correctOption = Math.floor(Math.random() * 4);
    options.forEach((button, index) => {
        if (index === correctOption) {
            button.textContent = translations[currentFlag.country] || currentFlag.country;
        } else {
            const incorrectOption = incorrectOptions.pop();
            button.textContent = translations[incorrectOption.country] || incorrectOption.country;
        }
        button.classList.remove('correct', 'incorrect'); // Reset classes
        button.disabled = false; // Enable buttons
    });
}

// Update the score display
function updateScore() {
    const percentage = Math.round((correctCount / totalCount) * 100);
    scoreLabel.textContent = `Score: ${percentage}%`;
}

// Check the answer and update the UI
function checkAnswer(selectedOption) {
    totalCount++;
    // Highlight correct and incorrect options
    options.forEach((button, index) => {
        if (index === correctOption) {
            button.classList.add('correct');
        } else {
            if (index === selectedOption) {
                button.classList.add('incorrect');
            }
        }
        button.disabled = true; // Disable buttons after answer
        button.blur(); // Remove focus from button
    });

    // Remove the flag from the remaining flags if the answer is correct
    if (selectedOption === correctOption) {
        correctCount++;
        remainingFlags = remainingFlags.filter(f => f !== currentFlag);
    }

    updateScore(); // Update the score after checking the answer

    // Automatically move to the next flag after 1 second
    setTimeout(nextFlag, 1000);
}

// Event listener for each option
options.forEach((button, index) => {
    button.addEventListener('click', () => checkAnswer(index));
});

// Event listener for language selection
languageSelect.addEventListener('change', async (event) => {
    const language = event.target.value;
    await loadTranslations(language);
    updateOptions(); // Refresh the current options with the new language
    const flag = languageSelect.options[languageSelect.selectedIndex].getAttribute('data-flag');
    languageSelect.style.backgroundImage = `url('https://flagcdn.com/${flag.toLowerCase()}.svg')`;
});

// Event listener for mode button
modeButton.addEventListener('click', () => {
    modeOverlay.classList.remove('hidden');
});

// Event listener for close mode button
closeModeButton.addEventListener('click', () => {
    modeOverlay.classList.add('hidden');
});

// Event listener for background click
modeOverlay.addEventListener('click', (event) => {
    if (event.target === modeOverlay) {
        modeOverlay.classList.add('hidden');
    }
});

// Load the initial language and flags data
(async () => {
    await loadTranslations('en'); // Default to English
    fetchFlags();
})();
