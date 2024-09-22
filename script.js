(function() {
    const flagImg = document.getElementById('flag');
    const options = document.querySelectorAll('.option');
    const languageSelect = document.getElementById('language-select');
    const scoreLabel = document.getElementById('score');
    const modeButton = document.getElementById('mode-button');
    const modeOverlay = document.getElementById('mode-overlay');
    const closeModeButton = document.getElementById('close-mode');
    const applyModeButton = document.getElementById('apply-mode');

    let flags = [];
    let remainingFlags = [];
    let currentFlag;
    let correctOption;
    let correctCount = 0;
    let totalCount = 0;
    let translations = {};
    const translationCache = {};
    let selectedPlaysets = ['africa', 'asia', 'europe', 'north_america', 'south_america', 'oceania']; // Default to all playsets

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
        updateOptions();
    }

    // Update the options
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

    // Check the answer and update the UI
    function checkAnswer(selectedOption) {
        totalCount++;
        options.forEach((button, index) => {
            if (index === correctOption) {
                button.classList.add('correct');
            } else if (index === selectedOption) {
                button.classList.add('incorrect');
            }
            button.disabled = true;
            button.blur();
        });

        if (selectedOption === correctOption) {
            correctCount++;
            remainingFlags = remainingFlags.filter(f => f !== currentFlag);
        }

        updateScore();

        setTimeout(nextFlag, 1000);
    }

    // Event listener for options using event delegation
    document.getElementById('options').addEventListener('click', (event) => {
        if (event.target.classList.contains('option')) {
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
        updateOptions();
        updateLanguageFlag();
    });

    // Set the initial language flag on page load
    updateLanguageFlag();

    // Event listener for mode button
    modeButton.addEventListener('click', () => {
        modeOverlay.classList.remove('hidden');
    });

    // Event listener for apply mode button
    applyModeButton.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('input[name="playset"]:checked');
        selectedPlaysets = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedPlaysets.length === 0) {
            alert('Please select at least one playset.');
            return;
        }

        modeOverlay.classList.add('hidden');
        correctCount = 0;
        totalCount = 0;
        updateScore();
        fetchFlags(); // Reload flags based on the selected playsets
    });

    // Event listener for close mode button
    closeModeButton.addEventListener('click', () => {
        modeOverlay.classList.add('hidden');
    });

    // Event listener for background click to close overlay
    modeOverlay.addEventListener('click', (event) => {
        if (event.target === modeOverlay) {
            modeOverlay.classList.add('hidden');
        }
    });

    // Load the initial language and flags data
    (async () => {
        await loadTranslations('en'); // Default to English
        // selectedPlaysets is already initialized with all playsets
        fetchFlags();
    })();

})();
