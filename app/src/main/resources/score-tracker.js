// Global Variables Initialization
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

// Function to create a reusable xAPI statement object
function createXAPIStatement(verb, object, result = null, actor = xapiConfig.actor) {
    const xapi = {
        actor: actor,
        verb: {
            id: `http://adlnet.gov/expapi/verbs/${verb}`,
            display: { "en-US": verb }
        },
        object
    };
    if (result !== null) {
        xapi.result = result;
    }

    console.log(xapi)
    return xapi;
}

// Function to determine if the exercise is complete
function isExerciseComplete(questionIndex, maxQuestionIndex, exerciseComplete) {
    // Khan Academy does not mark the exercise as complete until the user navigates to the next question
    return (questionIndex + 1) >= maxQuestionIndex && !exerciseComplete;
}

async function sendCompletionXAPIStatement(object, correctAnswers, maxQuestionIndex) {
    const completionXAPIData = createXAPIStatement("completed", object, {
        score: {
            raw: correctAnswers,
            min: 0,
            max: maxQuestionIndex
        },
        completion: true,
        success: correctAnswers === maxQuestionIndex
    });
    await sendXAPIStatement(completionXAPIData);
}

async function sendQuestionXAPIStatement(questionObject, success, response) {
    const questionXAPIData = createXAPIStatement("answered", questionObject, {
        response: response,
        success: success
    });

    await sendXAPIStatement(questionXAPIData);
}

async function sendXAPIStatement(xAPIData) {
    /*
    try {
        console.log("sending xapi data")
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
    } catch (error) {
        console.error("Error sending xAPI statement:", error);
    } */
};

parseXAPILaunchParameters()
    .then(() => xapiEnabled && waitForVueApp())
    .then((vueApp) => {

        if (!xapiEnabled) return

        console.log("Vue app is available. Running score tracker...");

        vueApp.sendStartXAPIStatement = () => {
            const startXAPIData = createXAPIStatement("attempted", xapiConfig.object);
            sendXAPIStatement(startXAPIData);
        };
        vueApp.sendStartXAPIStatement();

        // for displaying the current item
        vueApp.$watch('item', function (newVal, oldVal) {
            if (!newVal.question) {
                return
            }

            console.log('Item Question: ', newVal.question.content)

            let widgets = newVal.question.widgets;
            Object.values(widgets).forEach(widget => {
                console.log(`Item Type: ${widget.type}`);
                console.log(`Item Value: ${widget.options.value}`);
            });
        }, { deep: true, immediate: true });

        // Watch 'messageType' for changes when an answer is checked
        vueApp.$watch('messageType', (newVal) => {

            if (newVal === 'blank') {
                // question reset. do not take any action
                return;
            }

            const widgetsArray = Object.values(vueApp.item.question.widgets || {});
            const questionObject = {
                id: `http://example.com/activities/question-${vueApp.questionIndex + 1}`,
                objectType: "Activity",
                definition: {
                    name: { "en-US": `Question ${vueApp.questionIndex + 1}` },
                    description: { "en-US": vueApp.item.question.content },
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    interactionType: widgetsArray[0]?.type || "unknown"
                }
            };
            let response = widgetsArray[0]?.options?.value || "";

            // If the answer is correct
            if (newVal === 'truth') {
                if (!attemptedQuestions.has(vueApp.questionIndex)) {

                    attemptedQuestions.add(vueApp.questionIndex);  // Mark question as attempted
                    correctAnswers += 1;
                    console.log("Correct answer! Incrementing correctAnswers");

                    // Send xAPI statement for a correct answer
                    sendQuestionXAPIStatement(
                        questionObject,
                        true,
                        response
                    );
                } else {
                    console.log("Answer correct, but question was previously attempted.");
                }
            } else if (newVal === 'error' && vueApp.message !== vueApp.message_strings.incompleteAns) {
                incorrectAnswers += 1;
                attemptedQuestions.add(vueApp.questionIndex);
                console.log("Incorrect answer! Incrementing incorrectAnswers.");

                // Send xAPI statement for an incorrect answer
                sendQuestionXAPIStatement(
                    questionObject,
                    false,
                    ""
                );
            } else {
                // incomplete
                console.log("Answer incomplete");
            }

            if (isExerciseComplete(vueApp.questionIndex, vueApp.maxQuestionIndex, vueApp.exerciseComplete)) {
                sendCompletionXAPIStatement(
                    xapiConfig.object,
                    correctAnswers,
                    vueApp.maxQuestionIndex
                );
            }

        });
    });
