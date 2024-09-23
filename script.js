(function() {
    const flagImg = document.getElementById('flag');
    const options = document.querySelectorAll('.option');
    const languageSelect = document.getElementById('language-select');
    const scoreLabel = document.getElementById('score');
    const settingsButton = document.getElementById('settings-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeSettingsButton = document.getElementById('close-settings');
    const applySettingsButton = document.getElementById('apply-settings');
    const answerInput = document.getElementById('answer-input');
    const suggestionsContainer = document.getElementById('suggestions');
    const quizOptionsContainer = document.getElementById('quiz-options');
    const typeInputContainer = document.getElementById('type-input-container');

    let flags = [];
    let remainingFlags = [];
    let currentFlag;
    let correctOption;
    let correctCount = 0;
    let totalCount = 0;
    let translations = {};
    const translationCache = {};
    let selectedPlaysets = ['africa', 'asia', 'europe', 'north_america', 'south_america', 'oceania']; // Default to all playsets
    let gameMode = 'quiz'; // Default mode

    // Function to update the language flag
    function updateLanguageFlag() {
        const flag = languageSelect.options[languageSelect.selectedIndex].getAttribute('data-flag');
        const flagUrl = `https://flagcdn.com/${flag.toLowerCase()}.svg`;
        languageSelect.style.backgroundImage = `url('${flagUrl}')`;
        languageSelect.style.backgroundRepeat = 'no-repeat';
        languageSelect.style.backgroundPosition = 'right 10px center';
        languageSelect.style.backgroundSize = '24px';
    }

    // Load translations for the selected language
    async function loadTranslations(language) {
        if (translationCache[language]) {
            translations = translationCache[language];
            return;
        }
        try {
            const response = await fetch(`translations/${language}.json`);
            translations = await response.json();
            translationCache[language] = translations;
        } catch (error) {
            console.error("Error loading translations:", error);
        }
    }

    // Fetch flags data based on selected playsets
    async function fetchFlags() {
        try {
            let allFlags = [];

            if (selectedPlaysets.length === 0) {
                alert('Please select at least one playset.');
                return;
            } else {
                // Fetch flags for selected playsets
                for (const playset of selectedPlaysets) {
                    const response = await fetch(`playsets/${playset}.json`);
                    const playsetFlags = await response.json();
                    allFlags = allFlags.concat(playsetFlags);
                }
            }

            flags = allFlags;
            remainingFlags = [...flags];
            preloadFlags();
            nextFlag();
        } catch (error) {
            console.error("Error fetching flags:", error);
        }
    }

    // Preload flag images
    function preloadFlags() {
        flags.forEach(flag => {
            const img = new Image();
            img.src = flag.url;
        });
    }

    // Shuffle function
    function shuffle(array) {
        for (let i = array.length -1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Update the flag and options
    function nextFlag() {
        const feedbackOverlay = document.getElementById('feedback-overlay');
        feedbackOverlay.classList.add('hidden');

        if (remainingFlags.length === 0) {
            alert('No more flags in the selected playsets. Restarting...');
            remainingFlags = [...flags]; // Reset the flags
            correctCount = 0;
            totalCount = 0;
            updateScore();
        }
        shuffle(remainingFlags);
        currentFlag = remainingFlags[0];
        flagImg.src = currentFlag.url;
        flagImg.onload = () => console.log(`Loaded: ${currentFlag.url}`);
        flagImg.onerror = () => console.error(`Error loading flag: ${currentFlag.url}`);
        
        if (gameMode === 'quiz') {
            updateOptions();
            quizOptionsContainer.classList.remove('hidden');
            typeInputContainer.classList.add('hidden');
        } else if (gameMode === 'type') {
            answerInput.value = '';
            suggestionsContainer.innerHTML = '';
            quizOptionsContainer.classList.add('hidden');
            typeInputContainer.classList.remove('hidden');
            answerInput.focus();
        }
    }

    // Update the options for Quiz mode
    function updateOptions() {
        const incorrectOptions = flags.filter(f => f !== currentFlag);
        shuffle(incorrectOptions);
        const optionsPool = incorrectOptions.slice(0, 3);
        optionsPool.push(currentFlag);
        shuffle(optionsPool);

        optionsPool.forEach((optionFlag, index) => {
            const country = optionFlag.country;
            options[index].textContent = translations[country] || country;
            options[index].classList.remove('correct', 'incorrect');
            options[index].disabled = false;
        });

        correctOption = optionsPool.indexOf(currentFlag);
    }

    // Update the score display
    function updateScore() {
        const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
        scoreLabel.textContent = `Score: ${percentage}%`;
    }

    // Show feedback overlay
    function showFeedback(isCorrect) {
        const feedbackOverlay = document.getElementById('feedback-overlay');
        const feedbackIcon = document.getElementById('feedback-icon');

        feedbackOverlay.classList.remove('correct', 'incorrect');
        feedbackOverlay.classList.add(isCorrect ? 'correct' : 'incorrect');
        feedbackOverlay.classList.remove('hidden');

        if (isCorrect) {
            feedbackIcon.textContent = 'check_circle'; // Material symbol for checkmark
        } else {
            feedbackIcon.textContent = 'cancel'; // Material symbol for cross
        }
    }

    // Check the answer and update the UI
    function checkAnswer(selectedOption) {
        totalCount++;

        if (gameMode === 'quiz') {
            options.forEach((button, index) => {
                if (index === correctOption) {
                    button.classList.add('correct');
                } else if (index === selectedOption) {
                    button.classList.add('incorrect');
                }
                button.disabled = true;
                button.blur();
            });

            const isCorrect = (selectedOption === correctOption);
            if (isCorrect) {
                correctCount++;
                remainingFlags = remainingFlags.filter(f => f !== currentFlag);
            }

            showFeedback(isCorrect);
            updateScore();

            setTimeout(nextFlag, 1500);

        } else if (gameMode === 'type') {
            const answer = answerInput.value.trim().toLowerCase();
            const correctAnswer = (translations[currentFlag.country] || currentFlag.country).toLowerCase();

            const isCorrect = (answer === correctAnswer);

            if (isCorrect) {
                correctCount++;
                remainingFlags = remainingFlags.filter(f => f !== currentFlag);
            }

            showFeedback(isCorrect);
            updateScore();

            setTimeout(nextFlag, 1500);
        }
    }

    // Event listener for options using event delegation
    document.getElementById('options').addEventListener('click', (event) => {
        if (gameMode === 'quiz' && event.target.classList.contains('option')) {
            const index = Array.from(options).indexOf(event.target);
            if (index !== -1) {
                checkAnswer(index);
            }
        }
    });

    // Event listener for answer input in Type mode
    answerInput.addEventListener('input', () => {
        const query = answerInput.value.trim().toLowerCase();
        suggestionsContainer.innerHTML = '';

        if (query.length === 0) {
            return;
        }

        const suggestions = Object.values(translations).filter(countryName => countryName.toLowerCase().includes(query));

        suggestions.slice(0, 5).forEach(suggestion => {
            const div = document.createElement('div');
            div.textContent = suggestion;
            suggestionsContainer.appendChild(div);
        });
    });

    // Event listener for clicking on suggestions
    suggestionsContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'DIV') {
            answerInput.value = event.target.textContent;
            suggestionsContainer.innerHTML = '';
            checkAnswer();
        }
    });

    // Event listener for pressing Enter in the answer input
    answerInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            suggestionsContainer.innerHTML = '';
            checkAnswer();
        }
    });

    // Event listener for language selection
    languageSelect.addEventListener('change', async (event) => {
        const language = event.target.value;
        await loadTranslations(language);
        if (gameMode === 'quiz') {
            updateOptions();
        }
        updateLanguageFlag();
    });

    // Set the initial language flag on page load
    updateLanguageFlag();

    // Event listener for settings button
    settingsButton.addEventListener('click', () => {
        settingsOverlay.classList.remove('hidden');
    });

    // Event listener for apply settings button
    applySettingsButton.addEventListener('click', () => {
        const playsetCheckboxes = document.querySelectorAll('input[name="playset"]:checked');
        selectedPlaysets = Array.from(playsetCheckboxes).map(checkbox => checkbox.value);

        const modeRadio = document.querySelector('input[name="game-mode"]:checked');
        gameMode = modeRadio.value;

        if (selectedPlaysets.length === 0) {
            alert('Please select at least one playset.');
            return;
        }

        settingsOverlay.classList.add('hidden');
        correctCount = 0;
        totalCount = 0;
        updateScore();
        fetchFlags(); // Reload flags based on the selected playsets and mode
    });

    // Event listener for close settings button
    closeSettingsButton.addEventListener('click', () => {
        settingsOverlay.classList.add('hidden');
    });

    // Event listener for background click to close overlay
    settingsOverlay.addEventListener('click', (event) => {
        if (event.target === settingsOverlay) {
            settingsOverlay.classList.add('hidden');
        }
    });

    // Load the initial language and flags data
    (async () => {
        await loadTranslations('en'); // Default to English
        fetchFlags();
    })();

})();
