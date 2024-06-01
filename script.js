let flags = [];
let correctOption;
const flagImg = document.getElementById('flag');
const options = document.querySelectorAll('.option');

async function fetchFlags() {
    try {
        const response = await fetch('flags.json');
        flags = await response.json();
        nextFlag();
    } catch (error) {
        console.error("Error fetching flags:", error);
    }
}

function nextFlag() {
    // Shuffle the flags array
    const shuffledFlags = [...flags].sort(() => 0.5 - Math.random());

    // Pick a random flag
    const flag = shuffledFlags[0];
    flagImg.src = flag.url;

    // Pick three random incorrect options
    const incorrectOptions = shuffledFlags.slice(1, 4);

    // Place the correct option randomly
    correctOption = Math.floor(Math.random() * 4);
    options.forEach((button, index) => {
        if (index === correctOption) {
            button.textContent = flag.country;
        } else {
            button.textContent = incorrectOptions.pop().country;
        }
        button.style.backgroundColor = '#007BFF'; // Reset button color
        button.disabled = false; // Enable buttons
    });
}

function checkAnswer(selectedOption) {
    // Highlight correct and incorrect options
    options.forEach((button, index) => {
        if (index === correctOption) {
            button.style.backgroundColor = 'green';
        } else {
            if (index === selectedOption) {
                button.style.backgroundColor = 'red';
            }
        }
        button.disabled = true; // Disable buttons after answer
    });

    // Automatically move to the next flag after 1 second
    setTimeout(nextFlag, 1000);
}

// Event listener for each option
options.forEach((button, index) => {
    button.addEventListener('click', () => checkAnswer(index));
});

// Load the flags data and the first flag
fetchFlags();
