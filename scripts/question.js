 // Assume questions are stored in sessionStorage as a JSON array under "questions"
        const questions = JSON.parse(sessionStorage.getItem('questions')) || [];
        let currentIndex = 0;

        function showQuestion(index) {
            const header = document.getElementById('question-header');

            if (questions.length > 0 && questions[index]) {
                // If questions are objects, use questions[index].text; if strings, use questions[index]
                header.textContent = typeof questions[index] === 'object' && questions[index] !== null
                    ? questions[index].text || "Question text missing."
                    : questions[index];
            } else {
                header.textContent = "No more questions.";
                document.getElementById('next-btn').disabled = true;
            }
        }

        document.getElementById('next-btn').addEventListener('click', () => {
            currentIndex++;
            showQuestion(currentIndex);
        });

        showQuestion(currentIndex);