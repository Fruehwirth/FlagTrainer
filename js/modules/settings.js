export class Settings {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
        this.translationCache = {};
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeSettings();
    }

    initializeElements() {
        this.settingsButton = document.getElementById('settings-button');
        this.settingsOverlay = document.getElementById('settings-overlay');
        this.closeSettingsButton = document.getElementById('close-settings');
        this.languageSelect = document.getElementById('language-select');
        this.playsetCheckboxes = document.querySelectorAll('input[name="playset"]');
        this.gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
    }

    async initializeSettings() {
        await this.loadTranslations('en'); // Default to English
        this.updateLanguageFlag();
    }

    initializeEventListeners() {
        // Settings button
        this.settingsButton.addEventListener('click', () => {
            this.settingsOverlay.classList.remove('hidden');
            this.closeSettingsButton.focus();
        });

        // Close settings button
        this.closeSettingsButton.addEventListener('click', () => {
            this.settingsOverlay.classList.add('hidden');
        });

        // Background click to close
        this.settingsOverlay.addEventListener('click', (event) => {
            if (event.target === this.settingsOverlay) {
                this.settingsOverlay.classList.add('hidden');
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.settingsOverlay.classList.contains('hidden')) {
                this.settingsOverlay.classList.add('hidden');
            }
        });

        // Language selection
        this.languageSelect.addEventListener('change', async (event) => {
            const language = event.target.value;
            await this.loadTranslations(language);
            this.updateLanguageFlag();
            if (this.game.gameMode === 'quiz') {
                this.updateQuizOptionsTranslations();
            }
        });

        // Playset checkboxes
        this.playsetCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handlePlaysetChange(checkbox);
            });
        });

        // Game mode radios
        this.gameModeRadios.forEach(radio => {
            radio.addEventListener('change', async () => {
                if (radio.checked) {
                    await this.handleGameModeChange(radio.value);
                }
            });
        });
    }

    updateLanguageFlag() {
        const flag = this.languageSelect.options[this.languageSelect.selectedIndex].getAttribute('data-flag');
        const flagUrl = `https://flagcdn.com/${flag.toLowerCase()}.svg`;
        this.languageSelect.style.backgroundImage = `url('${flagUrl}')`;
        this.languageSelect.style.backgroundRepeat = 'no-repeat';
        this.languageSelect.style.backgroundPosition = 'right 10px center';
        this.languageSelect.style.backgroundSize = '24px';
    }

    async loadTranslations(language) {
        if (this.translationCache[language]) {
            this.game.translations = this.translationCache[language];
            return;
        }
        try {
            const response = await fetch(`assets/translations/${language}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.game.translations = await response.json();
            this.translationCache[language] = this.game.translations;
        } catch (error) {
            console.error("Error loading translations:", error);
        }
    }

    async handlePlaysetChange(checkbox) {
        this.game.selectedPlaysets = Array.from(this.playsetCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (this.game.selectedPlaysets.length === 0) {
            alert('Please select at least one playset.');
            checkbox.checked = true;
            this.game.selectedPlaysets.push(checkbox.value);
            return;
        }

        this.game.correctCount = 0;
        this.game.totalCount = 0;
        this.ui.updateScore();
        
        // Fetch new flags before showing next flag
        if (await this.game.fetchFlags()) {
            this.game.currentFlag = null; // Reset current flag
            this.game.nextFlag = null; // Reset next flag
            this.ui.updateProgressBar();
            this.ui.showNextFlag();
        }
    }

    async handleGameModeChange(newMode) {
        this.game.gameMode = newMode;
        this.game.correctCount = 0;
        this.game.totalCount = 0;
        this.ui.updateScore();
        
        // Fetch new flags before showing next flag
        if (await this.game.fetchFlags()) {
            this.game.currentFlag = null; // Reset current flag
            this.game.nextFlag = null; // Reset next flag
        }
        
        if (this.game.gameMode === 'quiz') {
            this.ui.quizOptionsContainer.classList.remove('hidden');
            this.ui.typeInputContainer.classList.add('hidden');
            this.ui.updateOptions();
        } else if (this.game.gameMode === 'type') {
            this.ui.quizOptionsContainer.classList.add('hidden');
            this.ui.typeInputContainer.classList.remove('hidden');
            this.ui.answerInput.value = '';
            this.ui.answerInput.focus();
        }
    }

    updateQuizOptionsTranslations() {
        this.ui.options.forEach((button) => {
            const country = button.getAttribute('data-country');
            button.textContent = this.game.translations[country] || country;
        });
    }
}
