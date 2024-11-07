import { shuffle } from './utils.js';

export class Game {
    constructor() {
        this.flags = [];
        this.remainingFlags = [];
        this.currentFlag = null;
        this.correctCount = 0;
        this.totalCount = 0;
        this.translations = {};
        this.selectedPlaysets = ['africa', 'asia', 'europe', 'north_america', 'south_america', 'oceania'];
        this.gameMode = 'quiz';
        this.nextFlagImage = new Image();
        this.nextFlag = null;
    }

    async fetchFlags() {
        try {
            let allFlags = [];
            if (this.selectedPlaysets.length === 0) {
                throw new Error('Please select at least one playset.');
            }

            for (const playset of this.selectedPlaysets) {
                const response = await fetch(`data/playsets/${playset}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch playset ${playset}: ${response.status}`);
                }
                const playsetFlags = await response.json();
                allFlags = allFlags.concat(playsetFlags);
            }

            this.flags = allFlags;
            this.remainingFlags = [...this.flags];
            return true;
        } catch (error) {
            console.error("Error fetching flags:", error);
            return false;
        }
    }

    getNextFlag() {
        if (this.remainingFlags.length === 0) {
            this.remainingFlags = [...this.flags];
            this.correctCount = 0;
            this.totalCount = 0;
        }
        
        const index = Math.floor(Math.random() * this.remainingFlags.length);
        return this.remainingFlags[index];
    }

    preloadNextFlag() {
        this.nextFlag = this.getNextFlag();
        this.nextFlagImage.src = this.nextFlag.url;

        this.nextFlagImage.onerror = () => {
            console.error(`Error preloading flag: ${this.nextFlag.url}`);
            this.nextFlagImage.src = 'images/flags/placeholder.png';
        };
    }

    getIncorrectOptions() {
        const incorrectOptions = this.flags.filter(f => f !== this.currentFlag);
        shuffle(incorrectOptions);
        return incorrectOptions.slice(0, 3);
    }
}
