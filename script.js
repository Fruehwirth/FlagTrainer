(function() {
    const flagImg = document.getElementById('flag');
    const options = document.querySelectorAll('.option');
    const languageSelect = document.getElementById('language-select');
    const scoreLabel = document.getElementById('score');
    const settingsButton = document.getElementById('settings-button');
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeSettingsButton = document.getElementById('close-settings');
    const answerInput = document.getElementById('answer-input');
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

    let countries; // Typeahead dataset

    // Function to update the language flag in the language select
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
                    if (!response.ok) {
                        throw new Error(`Failed to fetch playset ${playset}: ${response.status}`);
                    }
                    const playsetFlags = await response.json();
                    allFlags = allFlags.concat(playsetFlags);
                }
            }

            flags = allFlags;
            remainingFlags = [...flags];
            nextFlag();
        } catch (error) {
            console.error("Error fetching flags:", error);
        }
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
        flagImg.onerror = () => {
            console.error(`Error loading flag: ${currentFlag.url}`);
            // Optionally, set a placeholder image
            flagImg.src = 'images/flags/placeholder.png';
        };

        if (gameMode === 'quiz') {
            updateOptions();
            quizOptionsContainer.classList.remove('hidden');
            typeInputContainer.classList.add('hidden');
        } else if (gameMode === 'type') {
            answerInput.value = '';
            $('#answer-input').typeahead('val', '');
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
            options[index].setAttribute('data-country', country);
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
    function showFeedback(isCorrect, correctCountryName = '') {
        const feedbackOverlay = document.getElementById('feedback-overlay');
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackText = document.getElementById('feedback-text');
        const flagImage = document.getElementById('flag');

        // Get current displayed width and height of the flag image
        const flagRect = flagImage.getBoundingClientRect();
        const flagWidth = flagRect.width;
        const flagHeight = flagRect.height;

        // Set the overlay size to match the flag image
        feedbackOverlay.style.width = `${flagWidth}px`;
        feedbackOverlay.style.height = `${flagHeight}px`;
        feedbackOverlay.style.top = '50%';
        feedbackOverlay.style.left = '50%';
        feedbackOverlay.style.transform = 'translate(-50%, -50%)';

        feedbackOverlay.classList.remove('correct', 'incorrect');
        feedbackOverlay.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            feedbackIcon.textContent = 'check_circle'; // Material symbol for checkmark
            feedbackText.textContent = '';
            feedbackText.classList.add('hidden');
        } else {
            feedbackIcon.textContent = 'cancel'; // Material symbol for cross
            if (correctCountryName) {
                feedbackText.textContent = correctCountryName;
                feedbackText.classList.remove('hidden');
            } else {
                feedbackText.textContent = '';
                feedbackText.classList.add('hidden');
            }
        }

        // Show the overlay
        feedbackOverlay.classList.remove('hidden');

        // Optionally, set a timeout to hide the overlay after a delay
        setTimeout(() => {
            feedbackOverlay.classList.add('hidden');
            // Proceed to the next flag or reset as needed
            nextFlag();
        }, 1500); // 1.5 seconds delay
    }

    // Check the answer and update the UI
    function checkAnswer(selectedOption = null) {
        totalCount++;

        if (gameMode === 'quiz') {
            options.forEach((button, index) => {
                const buttonCountry = button.getAttribute('data-country');
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

            // Automatically move to the next flag after feedback
            // (Handled inside showFeedback)
        } else if (gameMode === 'type') {
            const answer = answerInput.value.trim().toLowerCase();
            const correctAnswer = (translations[currentFlag.country] || currentFlag.country).toLowerCase();

            const isCorrect = (answer === correctAnswer);

            if (isCorrect) {
                correctCount++;
                remainingFlags = remainingFlags.filter(f => f !== currentFlag);
                showFeedback(true);
            } else {
                const correctCountryName = translations[currentFlag.country] || currentFlag.country;
                showFeedback(false, correctCountryName);
            }

            updateScore();
            $('#answer-input').typeahead('close'); // Close the suggestion menu
            // Automatically move to the next flag after feedback
            // (Handled inside showFeedback)
        }
    }

    // Initialize typeahead
    function initializeTypeahead() {
        const countryNames = Object.values(translations);

        if (countries) {
            countries.clear();
            countries.local = countryNames;
            countries.initialize(true);
        } else {
            countries = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: countryNames
            });

            $('#answer-input').typeahead(
                {
                    hint: false, // Hide the hint input field
                    highlight: true,
                    minLength: 1
                },
                {
                    name: 'countries',
                    source: countries
                }
            );

            // Handle selection from suggestions
            $('#answer-input').bind('typeahead:select', function(ev, suggestion) {
                answerInput.value = suggestion;
                $('#answer-input').typeahead('close'); // Close the suggestion menu
                checkAnswer();
            });

            // Handle pressing Enter
            $('#answer-input').keydown(function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    $('#answer-input').typeahead('close'); // Close the suggestion menu
                    checkAnswer();
                }
            });
        }
    }

    // Update Quiz Options Translations
    function updateQuizOptionsTranslations() {
        options.forEach((button) => {
            const country = button.getAttribute('data-country');
            button.textContent = translations[country] || country;
        });
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

    // Event listener for language selection
    languageSelect.addEventListener('change', async (event) => {
        const language = event.target.value;
        await loadTranslations(language);
        updateLanguageFlag();
        if (gameMode === 'quiz') {
            updateQuizOptionsTranslations();
        }
        initializeTypeahead(); // Reinitialize typeahead with new translations
    });

    // Event listener for settings button
    settingsButton.addEventListener('click', () => {
        settingsOverlay.classList.remove('hidden');
        closeSettingsButton.focus(); // Set focus to close button for accessibility
    });

    // Event listener for close settings button (Icon)
    closeSettingsButton.addEventListener('click', () => {
        settingsOverlay.classList.add('hidden');
    });

    // Event listener for background click to close overlay
    settingsOverlay.addEventListener('click', (event) => {
        if (event.target === settingsOverlay) {
            settingsOverlay.classList.add('hidden');
        }
    });

    // Event listener for Escape key to close overlay
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !settingsOverlay.classList.contains('hidden')) {
            settingsOverlay.classList.add('hidden');
        }
    });

    // Event listeners for game mode changes
    function handleGameModeChange() {
        if (gameMode === 'quiz') {
            quizOptionsContainer.classList.remove('hidden');
            typeInputContainer.classList.add('hidden');
            updateOptions();
        } else if (gameMode === 'type') {
            quizOptionsContainer.classList.add('hidden');
            typeInputContainer.classList.remove('hidden');
            answerInput.value = '';
            $('#answer-input').typeahead('val', '');
            answerInput.focus();
        }
    }

    // Event listeners for playset checkboxes
    const playsetCheckboxes = document.querySelectorAll('input[name="playset"]');
    playsetCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Update selected playsets
            selectedPlaysets = Array.from(playsetCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            if (selectedPlaysets.length === 0) {
                alert('Please select at least one playset.');
                // Re-check the checkbox that was just unchecked
                checkbox.checked = true;
                selectedPlaysets.push(checkbox.value);
                return;
            }

            // Reset score
            correctCount = 0;
            totalCount = 0;
            updateScore();

            // Fetch new flags based on updated playsets
            fetchFlags();
        });
    });

    // Event listeners for game mode radio buttons
    const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
    gameModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                gameMode = radio.value;
                handleGameModeChange();
            }
        });
    });

    // Load the initial language and flags data
    (async () => {
        await loadTranslations('en'); // Default to English
        initializeTypeahead();
        fetchFlags();
        updateLanguageFlag();
    })();

})();
