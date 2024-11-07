import { shuffle } from './utils.js';

export class UI {
    constructor(game) {
        this.game = game;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.flagImg = document.getElementById('flag');
        this.options = document.querySelectorAll('.option');
        this.scoreLabel = document.getElementById('score');
        this.feedbackOverlay = document.getElementById('feedback-overlay');
        this.quizOptionsContainer = document.getElementById('quiz-options');
        this.typeInputContainer = document.getElementById('type-input-container');
        this.answerInput = document.getElementById('answer-input');
        this.progressBar = document.getElementById('progress-bar');
    }

    initializeEventListeners() {
        // Quiz mode event listener
        document.getElementById('options').addEventListener('click', (event) => {
            if (this.game.gameMode === 'quiz' && event.target.classList.contains('option')) {
                const index = Array.from(this.options).indexOf(event.target);
                if (index !== -1) {
                    this.checkAnswer(index);
                }
            }
        });

        // Type mode event listener
        this.answerInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const value = this.answerInput.value.trim();
                if (value) {
                    this.checkTypedAnswer(value);
                }
            }
        });
    }

    updateScore() {
        const percentage = this.game.totalCount > 0 ? 
            Math.round((this.game.correctCount / this.game.totalCount) * 100) : 0;
        this.scoreLabel.textContent = `Score: ${percentage}%`;
    }

    showFeedback(isCorrect, correctCountryName = '') {
        const feedbackOverlay = document.getElementById('feedback-overlay');
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackText = document.getElementById('feedback-text');
        const flagImage = document.getElementById('flag');

        const flagRect = flagImage.getBoundingClientRect();
        const flagWidth = flagRect.width;
        const flagHeight = flagRect.height;

        feedbackOverlay.style.width = `${flagWidth}px`;
        feedbackOverlay.style.height = `${flagHeight}px`;
        feedbackOverlay.style.top = '50%';
        feedbackOverlay.style.left = '50%';
        feedbackOverlay.style.transform = 'translate(-50%, -50%)';

        feedbackOverlay.classList.remove('correct', 'incorrect');
        feedbackOverlay.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            feedbackIcon.textContent = 'check_circle';
            feedbackText.textContent = '';
            feedbackText.classList.add('hidden');
        } else {
            feedbackIcon.textContent = 'cancel';
            if (correctCountryName) {
                feedbackText.textContent = correctCountryName;
                feedbackText.classList.remove('hidden');
            } else {
                feedbackText.textContent = '';
                feedbackText.classList.add('hidden');
            }
        }

        feedbackOverlay.classList.remove('hidden');

        setTimeout(() => {
            feedbackOverlay.classList.add('hidden');
            this.showNextFlag();
        }, 1500);
    }

    updateOptions() {
        const incorrectOptions = this.game.flags.filter(f => f !== this.game.currentFlag);
        shuffle(incorrectOptions);
        const optionsPool = incorrectOptions.slice(0, 3);
        optionsPool.push(this.game.currentFlag);
        shuffle(optionsPool);

        optionsPool.forEach((optionFlag, index) => {
            const country = optionFlag.country;
            this.options[index].textContent = this.game.translations[country] || country;
            this.options[index].setAttribute('data-country', country);
            this.options[index].classList.remove('correct', 'incorrect');
            this.options[index].disabled = false;
        });

        this.correctOption = optionsPool.indexOf(this.game.currentFlag);
    }

    showNextFlag() {
        const feedbackOverlay = document.getElementById('feedback-overlay');
        feedbackOverlay.classList.add('hidden');

        if (this.game.nextFlag) {
            this.game.currentFlag = this.game.nextFlag;
            this.flagImg.src = this.game.nextFlagImage.src;
        } else {
            this.game.currentFlag = this.game.getNextFlag();
            this.flagImg.src = this.game.currentFlag.url;
        }
        this.updateProgressBar();

        this.game.preloadNextFlag();

        if (this.game.gameMode === 'quiz') {
            this.updateOptions();
            this.quizOptionsContainer.classList.remove('hidden');
            this.typeInputContainer.classList.add('hidden');
        } else if (this.game.gameMode === 'type') {
            this.answerInput.value = '';
            $('#answer-input').typeahead('val', '');
            this.quizOptionsContainer.classList.add('hidden');
            this.typeInputContainer.classList.remove('hidden');
            this.answerInput.focus();
        }
    }

    checkAnswer(index) {
        const selectedOption = this.options[index];
        const selectedCountry = selectedOption.getAttribute('data-country');
        const isCorrect = selectedCountry === this.game.currentFlag.country;

        // Disable all options to prevent multiple answers
        this.options.forEach(option => option.disabled = true);

        // Update the score
        this.game.totalCount++;
        if (isCorrect) {
            this.game.correctCount++;
            // Remove the correctly guessed flag from remaining flags
            const flagIndex = this.game.remainingFlags.indexOf(this.game.currentFlag);
            if (flagIndex > -1) {
                this.game.remainingFlags.splice(flagIndex, 1);
            }
        }

        // Update the score display
        this.updateScore();
        this.updateProgressBar();

        // Show visual feedback
        selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) {
            // If incorrect, show which one was correct
            const correctOption = Array.from(this.options).find(
                option => option.getAttribute('data-country') === this.game.currentFlag.country
            );
            correctOption.classList.add('correct');
            // Show feedback with correct country name
            this.showFeedback(false, this.game.translations[this.game.currentFlag.country] || this.game.currentFlag.country);
        } else {
            this.showFeedback(true);
        }
    }

    checkTypedAnswer(answer) {
        this.game.totalCount++;
        const currentCountry = this.game.currentFlag.country;
        const translatedCountry = this.game.translations[currentCountry] || currentCountry;
        
        const isCorrect = answer.toLowerCase() === translatedCountry.toLowerCase() || 
                         answer.toLowerCase() === currentCountry.toLowerCase();

        if (isCorrect) {
            this.game.correctCount++;
            const flagIndex = this.game.remainingFlags.indexOf(this.game.currentFlag);
            if (flagIndex > -1) {
                this.game.remainingFlags.splice(flagIndex, 1);
            }
            this.showFeedback(true);
        } else {
            const correctCountryName = this.game.translations[currentCountry] || currentCountry;
            this.showFeedback(false, correctCountryName);
        }

        this.updateScore();
        this.updateProgressBar();
        this.answerInput.value = '';
    }

    updateProgressBar() {
        const totalFlags = this.game.flags.length;
        const remainingFlagsCount = this.game.remainingFlags.length;
        const progress = ((totalFlags - remainingFlagsCount) / totalFlags) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
}
