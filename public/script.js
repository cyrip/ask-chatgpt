const recordButton = document.getElementById('recordButton');
const questionParagraph = document.getElementById('question');
const responseParagraph = document.getElementById('response');
const audioElement = document.getElementById('audio');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recordButton.addEventListener('click', () => {
    console.log('Recognition start');
    recognition.start();
});

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log(transcript);
    questionParagraph.textContent = transcript;
    fetchResponseFromChatGPT(transcript);
};

async function fetchResponseFromChatGPT(transcript) {
    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: transcript })
    });
    const data = await response.json();
    console.log(data.url);
    const chatGPTResponse = data.response;
    responseParagraph.textContent = chatGPTResponse;
    playResponseAudio(data.url);
    //speakResponse(chatGPTResponse);
}

function speakResponse(responseText) {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(responseText);
    speechSynthesis.speak(utterance);
}

function playResponseAudio(src) {
    const uniqueParam = new Date().getTime();
    audioElement.src = `${src}?param=${uniqueParam}`;
    audioElement.play();
}