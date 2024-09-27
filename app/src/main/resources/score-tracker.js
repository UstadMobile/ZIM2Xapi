// Function to wait for vueApp to be initialized
function waitForVueApp() {
    return new Promise((resolve) => {
        const checkVueApp = () => {
            if (window.vueApp) {
                console.log('Vue app found');
                resolve(window.vueApp);
            } else {
                console.log('Waiting for Vue app...');
                setTimeout(checkVueApp, 100);  // Retry every 100ms
            }
        };
        checkVueApp();
    });
}

// Wait for vueApp and then run the score tracker logic
waitForVueApp().then((vueApp) => {
    console.log("Vue app is available. Running score tracker...");

    // Add properties to track scores if they don't already exist
    if (!vueApp.correctAnswers) {
        vueApp.$set(vueApp, 'correctAnswers', 0);  // Track the number of correct answers
        console.log("Added 'correctAnswers' property to vueApp.");
    }

    if (!vueApp.totalScore) {
        vueApp.$set(vueApp, 'totalScore', 0);  // Track the total score
        console.log("Added 'totalScore' property to vueApp.");
    }

    if (!vueApp.totalQuestions) {
        vueApp.$set(vueApp, 'totalQuestions', 0);  // Track the number of questions answered
        console.log("Added 'totalQuestions' property to vueApp.");
    }

     vueApp.$watch('itemRenderer.questionRenderer', function(newVal, oldVal) {
      console.log(`itemRenderer questionRenderer changed from ${oldVal} to ${newVal}`);

     },{ deep: true });

      vueApp.$watch('answerState', function(newVal, oldVal) {
           console.log(`answerState changed from ${oldVal} to ${newVal}`);

          });

    // Watch the 'messageType' for changes when an answer is checked
    vueApp.$watch('messageType', function(newVal, oldVal) {
        console.log(`messageType changed from ${oldVal} to ${newVal}`);

        if (newVal === 'truth') {
            // Increment correct answers and total score
            vueApp.correctAnswers += 1;
            vueApp.totalScore += vueApp.calculateScore();
            console.log("Correct answer! Incrementing correctAnswers and totalScore.");
            console.log(`correctAnswers: ${vueApp.correctAnswers}`);
            console.log(`totalScore: ${vueApp.totalScore}`);
        }

        // Increment total questions answered
        vueApp.totalQuestions += 1;
        console.log(`Incremented totalQuestions: ${vueApp.totalQuestions}`);

        // If exercise is complete, trigger xAPI statement
        if (vueApp.exerciseComplete) {
            console.log("Exercise complete! Sending xAPI statement...");
            vueApp.sendXAPIStatement();
        }
    });

    // Define the calculateScore method to calculate points per correct answer
    vueApp.calculateScore = function() {
        console.log("Calculating score for the correct answer...");
        return 1;  // Example: 1 point per correct answer
    };

    // Define the method to send the xAPI statement
    vueApp.sendXAPIStatement = function() {
        const xAPIData = {
            actor: {
                name: "Learner Name",
                mbox: "mailto:learner@example.com"
            },
            verb: {
                id: "http://adlnet.gov/expapi/verbs/completed",
                display: { "en-US": "completed" }
            },
            object: {
                id: "http://example.com/activities/perseus-exercise",
                definition: {
                    name: { "en-US": "Perseus Exercise" },
                    description: { "en-US": "A quiz or exercise rendered by Perseus." }
                }
            },
            result: {
                score: {
                    raw: vueApp.totalScore,  // Send the total score accumulated
                    max: vueApp.totalQuestions  // Maximum possible score is total number of questions
                },
                completion: true,
                success: vueApp.correctAnswers === vueApp.totalQuestions  // Was the exercise fully correct?
            }
        };

        console.log("xAPI Statement Data: ", xAPIData);
        console.log("xAPI statement has been sent!");
    };
});
