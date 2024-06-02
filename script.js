let flags = [];
let remainingFlags = [];
let currentFlag;
let correctOption;
const flagImg = document.getElementById('flag');
const options = document.querySelectorAll('.option');

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

function nextFlag() {
    if (remainingFlags.length === 0) {
        remainingFlags = [...flags]; // Refill the remaining flags
    }

    // Shuffle the remaining flags array
    const shuffledFlags = remainingFlags.sort(() => 0.5 - Math.random());

    // Pick a random flag from remaining flags
    currentFlag = shuffledFlags[0];
    flagImg.src = currentFlag.url;

    // Pick three random incorrect options from the full list excluding the current flag
    const incorrectOptions = flags.filter(f => f !== currentFlag).sort(() => 0.5 - Math.random()).slice(0, 3);

    // Place the correct option randomly
    correctOption = Math.floor(Math.random() * 4);
    options.forEach((button, index) => {
        if (index === correctOption) {
            button.textContent = currentFlag.country;
        } else {
            button.textContent = incorrectOptions.pop().country;
        }
        button.classList.remove('correct', 'incorrect'); // Reset classes
        button.disabled = false; // Enable buttons
    });
}

function checkAnswer(selectedOption) {
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
        remainingFlags = remainingFlags.filter(f => f !== currentFlag);
    }

    // Automatically move to the next flag after 1 second
    setTimeout(nextFlag, 1000);
}

// Event listener for each option
options.forEach((button, index) => {
    button.addEventListener('click', () => checkAnswer(index));
});

// Load the flags data and the first flag
fetchFlags();
