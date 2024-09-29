let xapiEnabled = false;
let xapiConfig = {};
let correctAnswers = 0;
let incorrectAnswers = 0;
let attemptedQuestions = new Set();

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

function parseXAPILaunchParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const endpoint = urlParams.get('endpoint');
    const auth = urlParams.get('auth');
    const actor = urlParams.get('actor');

    if (endpoint && auth && actor) {
        xapiEnabled = true;

        return fetch('xapiobject.json')
           .then(response => {
               if (!response.ok) {
                  throw new Error('Network response was not ok for xapiobject' + response.statusText);
            }
                return response.json();
         }).then(objectData => {
                 xapiConfig = {
                    endpoint: decodeURIComponent(endpoint),
                    auth: decodeURIComponent(auth),
                    actor: JSON.parse(decodeURIComponent(actor)),
                    registration: urlParams.get('registration'),
                    activity_id: urlParams.get('activity_id'),
                    activity_platform: urlParams.get('activity_platform'),
                    language: urlParams.get('Accept-Language'),
                    grouping: urlParams.get('grouping'),
                    object: objectData
                };
                console.log('xAPI enabled with config:', xapiConfig);
                return;
        }).catch(error => {
             console.error('Failed to load xAPI object JSON:', error);
        });
    } else {
        console.log('xAPI not enabled: missing required launch parameters');
        return Promise.resolve();
    }
}

parseXAPILaunchParameters()
    .then(() => {
        if (xapiEnabled) {
            return waitForVueApp();
        }
    }).then((vueApp) => {

        if(!xapiEnabled){
            return
        }

        console.log("Vue app is available. Running score tracker...");


        // Send xAPI statement to record the start of the exercise
        vueApp.sendStartXAPIStatement = async function() {
            const startXAPIData = {
                actor: xapiConfig.actor,
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/attempted",
                    display: { "en-US": "attempted" }
                },
                object: xapiConfig.object,
            };

            console.log("xAPI Start Statement Data: ", startXAPIData);
            console.log("Start xAPI statement has been sent!");
        };

        // Trigger start xAPI statement when the app initializes
        vueApp.sendStartXAPIStatement();

        // for displaying the current item
        vueApp.$watch('item', function(newVal, oldVal) {
               if(!newVal.question){
                    return
               }

               console.log('Item Question: ', newVal.question.content)

               let widgets = newVal.question.widgets;
               Object.values(widgets).forEach(widget => {
                      console.log(`Item Answer Type: ${widget.options.answerType}`);
                       console.log(`Item Value: ${widget.options.value}`);
               });
            },{ deep: true, immediate: true });

        vueApp.$watch("exerciseComplete", function(newVal, oldVal) {
            console.log(`messageType changed from ${oldVal} to ${newVal}`);

            if(newVal){
                 console.log("Exercise complete! Sending completion xAPI statement...");
                 vueApp.sendCompletionXAPIStatement();
            }
        });

        // Watch 'messageType' for changes when an answer is checked
        vueApp.$watch('messageType', function(newVal, oldVal) {
            console.log(`messageType changed from ${oldVal} to ${newVal}`);

            if(newVal === 'blank'){
                // question reset. don't do anything
                return;
            }

            // Per-question xAPI statement (progress and individual question tracking)
            const sendQuestionXAPIStatement = async function(success) {

                const widgetsArray = Object.values(vueApp.item.question.widgets);
                let response = success ? widgetsArray[0].options.value : "";
                const questionXAPIData = {
                    actor: xapiConfig.actor,
                    verb: {
                        id: "http://adlnet.gov/expapi/verbs/answered",
                        display: { "en-US": "answered" }
                    },
                    object: {
                        id: `http://example.com/activities/question-${vueApp.questionIndex}`,
                        objectType: "Activity",
                        definition: {
                            name: { "en-US": `Question ${vueApp.questionIndex}` },
                            description: { "en-US": `Question of type ${widgetsArray[0].options.answerType}` }
                        }
                    },
                    result: {
                        response: response,
                        success: success
                    }
                };

                console.log("xAPI Question Statement Data: ", questionXAPIData);
                console.log("Question xAPI statement has been sent!");
            };

            // If the answer is correct
            if (newVal === 'truth') {
                if (!attemptedQuestions.has(vueApp.questionIndex)) {

                    attemptedQuestions.add(vueApp.questionIndex);  // Mark question as attempted
                    correctAnswers += 1;
                    console.log("Correct answer! Incrementing correctAnswers");

                    // Send xAPI statement for a correct answer
                    sendQuestionXAPIStatement(true);
                } else {
                    console.log("Answer correct, but question was previously attempted.");
                }
            } else if (newVal === 'error' && vueApp.message !== vueApp.message_strings.incompleteAns) {
                incorrectAnswers += 1;
                attemptedQuestions.add(vueApp.questionIndex);
                console.log("Incorrect answer! Incrementing incorrectAnswers.");

                // Send xAPI statement for an incorrect answer
                sendQuestionXAPIStatement(false);
            } else {
               // incomplete
                console.log("Answer incomplete");
            }

        });

        // Completion xAPI statement
        vueApp.sendCompletionXAPIStatement = async function() {
            const completionXAPIData = {
                actor: xapiConfig.actor,
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/completed",
                    display: { "en-US": "completed" }
                },
                object: xapiConfig.object,
                result: {
                    score: {
                        raw: correctAnswers,  // Send the total score accumulated
                        min: 0,
                        max: vueApp.maxQuestionIndex  // Maximum possible score is total number of questions
                    },
                    completion: true,
                    success: correctAnswers === vueApp.maxQuestionIndex  // Was the exercise fully correct?
                }
            };

            // Reusable function to send xAPI statements
            vueApp.sendXAPI = async function(xAPIData) {
                // Log the xAPI data for debugging
               try {

                console.log("Sending xAPI Statement Data: ", xAPIData);

                const response = await fetch("https://lrs.example.com/xapi/statements", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Basic " + btoa("username:password")  // Replace with your actual credentials
                            },
                            body: JSON.stringify(xAPIData)
                        });

                        if (response.ok) {
                            console.log("xAPI statement successfully sent!");
                        } else {
                            console.error("Failed to send xAPI statement:", response.statusText);
                        }
                }catch (error) {
                   console.error("Error sending xAPI statement:", error);
                }
            };

            console.log("xAPI Completion Statement Data: ", completionXAPIData);
            console.log("Completion xAPI statement has been sent!");
        };
});
