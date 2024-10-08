import * as Widgets from './khan-widgets.js';
// Global Variables Initialization
let xapiEnabled = false;
export let xapiConfig = {};
let correctAnswers = 0;
let incorrectAnswers = 0;
let attemptedQuestions = new Set();
let startExerciseTime = new Date();
let lastProgressTime = startExerciseTime;

// supported khan academy interaction types
// These types actively capture user responses that can be tracked with xAPI.
// Each widget type corresponds to a unique user interaction that we want to record.
const interactionTypeMapping = {
    "input-number": Widgets.InputNumber,
    "orderer": Widgets.Orderer,
    "radio": Widgets.Radio,
    "dropdown": Widgets.Dropdown,
    "sorter": Widgets.Sorter,
    "expression": Widgets.Expression,
    "matcher": Widgets.Matcher,
    "numeric-input": Widgets.InputNumber,
    "categorizer": Widgets.Categorizer
};

// unsupported interaction types
// These widgets provide content or context but do not have direct user interaction to record.
const unsupportedInteractionTypes = [
    "image", "definition", "explanation", "passage", "passage-ref", "video"
]


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

parseXAPILaunchParameters()
    .then(() => xapiEnabled && waitForVueApp())
    .then((vueApp) => {

        if (!xapiEnabled) return

        console.log("Vue app is available. Running score tracker...");

        sendStartXAPIStatement(vueApp);
        initializeVueAppWatchers(vueApp);
});

/**
 * Converts a duration given in seconds to an ISO 8601 duration string.
 *
 * @param {number} durationInSeconds - The duration in seconds to convert.
 * @returns {string} The ISO 8601 duration string representing the given duration.
 *
 * The returned string follows the ISO 8601 standard, starting with "PT",
 * and includes hours ("H"), minutes ("M"), and seconds ("S") as applicable.
 *
 * Examples:
 * - convertToISO8601Duration(3661) returns "PT1H1M1S"
 * - convertToISO8601Duration(45) returns "PT45S"
 * - convertToISO8601Duration(0) returns "PT0S"
 */
function convertToISO8601Duration(durationInSeconds) {
    let hours = Math.floor(durationInSeconds / 3600);
    let minutes = Math.floor((durationInSeconds % 3600) / 60);
    let seconds = Math.floor(durationInSeconds % 60);

    let durationString = "PT";
    if (hours > 0) {
        durationString += hours + "H";
    }
    if (minutes > 0) {
        durationString += minutes + "M";
    }
    if (seconds > 0 || durationString === "PT") {
        durationString += seconds + "S";
    }

    return durationString;
}

/**
 * Function to record the time taken since the given start point.
 * @param {Date} [startTime=lastProgressTime] - Optional start time to calculate duration from.
 * If not provided, it defaults to `lastProgressTime`.
 * @returns {string} The ISO 8601 duration string for the time taken since the given start point.
 */
function recordProgress(startTime = lastProgressTime) {
    // Record the current time when progress is made
    let currentTime = new Date();

    // Calculate the duration in milliseconds since the last progress
    let durationInMilliseconds = currentTime - startTime;

    // Convert milliseconds to seconds
    let durationInSeconds = durationInMilliseconds / 1000;

    // Convert the duration to ISO 8601 format
    let iso8601Duration = convertToISO8601Duration(durationInSeconds);

    // Reset the last progress time for the next measurement
    lastProgressTime = currentTime;

    // Return the duration for the current progress step
    return iso8601Duration;
}

/**
 * Creates a context object for xAPI statements based on URL parameters.
 *
 * @param {URLSearchParams} urlParams - A URLSearchParams object containing the URL query parameters.
 * @returns {object|null} The context object for xAPI statements, or `null` if no relevant context data is available.
 * Examples:
 * - Given URL `?registration=12345&activity_platform=web`, the function will return:
 *   {
 *     registration: "12345",
 *     platform: "web"
 *   }
 */
function createContextFromUrlParams(urlParams) {
    // Initialize the context object
    let context = {
        contextActivities: {}
    };

    // Check and add 'registration' if available
    const registration = urlParams.get('registration');
    if (registration) {
        context.registration = registration;
    }

    // Check and add 'activity_platform' if available
    const activityPlatform = urlParams.get('activity_platform');
    if (activityPlatform) {
        context.platform = activityPlatform;
    }

    // Check and add 'Accept-Language' if available
    const language = urlParams.get('Accept-Language');
    if (language) {
        context.language = language;
    }

    // Check and add 'grouping' if available, inside 'contextActivities'
    const grouping = urlParams.get('grouping');
    if (grouping) {
        context.contextActivities.grouping = [{ id: grouping }];
    }

    // You can add more context properties based on the URL parameters here

    // If no contextActivities were added, remove the property
    if (Object.keys(context.contextActivities).length === 0) {
        delete context.contextActivities;
    }

    if (Object.keys(context).length === 0) {
        return null;
    }

    return context;
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
                    context: createContextFromUrlParams(urlParams),
                    object: objectData,
                    parent: [objectData]
                };
                xapiConfig.language = (xapiConfig?.context?.language ?? Object.keys(objectData.definition.name)[0]) || "en";
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

function addParentToContext(context) {
    let updatedContext = context ? JSON.parse(JSON.stringify(context)) : {};
    updatedContext.contextActivities = context?.contextActivities || {};
    updatedContext.contextActivities.parent = xapiConfig.parent
    return updatedContext
}

/**
 * Creates an xAPI statement object with the given parameters.
 *
 * @param {string} verb - The action being performed, represented as a verb. This should be a valid xAPI verb.
 * @param {object} object - The activity object that the verb is acting upon, following the xAPI activity structure.
 * @param {object} [result=null] - Optional. The result of the activity, including properties such as score, success, and duration.
 * @param {object} [context=xapiConfig.context] - Optional. The context in which the statement is generated, providing additional information about the activity. Defaults to `xapiConfig.context`.
 * @param {object} [actor=xapiConfig.actor] - Optional. The actor (user) performing the action. Defaults to `xapiConfig.actor`.
 *
 * @returns {object} The constructed xAPI statement object, ready to be sent to an LRS (Learning Record Store).
 */
function createXAPIStatement(
    verb, object, result = null,
    context = xapiConfig.context,
    actor = xapiConfig.actor
) {
    const statement = {
        actor: actor,
        verb: {
            id: `http://adlnet.gov/expapi/verbs/${verb}`,
            display: { [xapiConfig.language] : verb }
        },
        object
    };
    if (result !== null) {
        statement.result = result;
    }
    if (context != null) {
        statement.context = context
    }

    console.log(statement)
    return statement;
}

/**
 * Determines if the exercise is complete.
 *
 * @param {number} questionIndex - The current index of the question being answered.
 * @param {number} maxQuestionIndex - The maximum index of the questions in the exercise.
 * @param {boolean} exerciseComplete - A flag indicating whether the exercise is already marked as complete.
 *
 * @returns {boolean} Returns `true` if the exercise should be marked as complete, otherwise `false`.
 *
 * The function checks whether the user has reached the end of the exercise, based on the current
 * `questionIndex` and the `maxQuestionIndex`. In Khan Academy's context, the exercise is only
 * marked as complete when the user navigates to the next question after answering the last one.
 * Therefore, the function also checks if `exerciseComplete` is false to avoid redundant completions.
 */
function isExerciseComplete(questionIndex, maxQuestionIndex, exerciseComplete) {
    return (questionIndex + 1) >= maxQuestionIndex && !exerciseComplete;
}


/**
 * Sends an xAPI statement indicating the completion of an exercise.
 *
 * @param {object} object - The activity object that represents the exercise being completed.
 * @param {number} correctAnswers - The number of correct answers provided by the user during the exercise.
 * @param {number} maxQuestionIndex - The total number of questions in the exercise.
 *
 * @returns {Promise<void>} A promise that resolves when the xAPI statement has been successfully sent.
 *
 */
async function sendCompletionXAPIStatement(object, correctAnswers, maxQuestionIndex) {
    const duration = recordProgress(startExerciseTime)
    const scaled = correctAnswers / maxQuestionIndex
    const passed = (scaled * 100) >= passingGrade;
    const result = {
        score: {
            scaled: scaled,
            raw: correctAnswers,
            min: 0,
            max: maxQuestionIndex
        },
        completion: true,
        success: passed,
        duration: duration
    };
    const completionXAPIStatement = createXAPIStatement(
        "completed", object, result,
        addParentToContext(xapiConfig.context) // context with parent exercise added
    );
    await sendXAPIStatement(completionXAPIStatement);
}


/**
 * Sends an xAPI statement indicating that a question has been answered.
 *
 * @param {questionObject} questionObject - The activity object representing the question that was answered.
 * @param {resultObject} result - the xapi result object of the user's response to the question
 *
 * @returns {Promise<void>} A promise that resolves when the xAPI statement has been successfully sent.
 */
async function sendQuestionXAPIStatement(questionObject, resultObject) {
    const questionXAPIData = createXAPIStatement(
        "answered", questionObject, resultObject,
        addParentToContext(xapiConfig.context)
    );

    await sendXAPIStatement(questionXAPIData);
}

/**
 * Sends an xAPI statement to the configured Learning Record Store (LRS).
 * @param {object} xAPIData - The xAPI statement object that will be sent to the LRS.
 * @returns {Promise<void>} A promise that resolves when the xAPI statement has been successfully sent, or rejects if an error occurs.
 */
async function sendXAPIStatement(xAPIData) {
    try {
        console.log("sending xapi data")
        
        const response = await fetch(xapiConfig.endpoint, {
            method: "POST",
            headers: {
                "X-Experience-API-Version": "1.0.3",
                "Content-Type": "application/json",
                "Authorization": `Basic ${xapiConfig.auth}` // Replace with your actual credentials
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
    }
};


function initializeVueAppWatchers(vueApp) {
    // Watch the 'item' for changes
    vueApp.$watch('item', handleItemChange, { deep: true, immediate: true });

    // Watch 'messageType' for changes when an answer is checked
    vueApp.$watch('messageType', (newVal) => handleAnswerCheck(newVal, vueApp));
}

// Handle changes to the item
function handleItemChange(newVal, oldVal) {
    if (!newVal.question) return;

    console.log('Item Question: ', newVal.question.content);

    let widgets = newVal.question.widgets;
    Object.values(widgets).forEach(widget => {
        console.log(`Item Type: ${widget.type}`);
        console.log(`Item Value: ${widget.options.value}`);
    });
}

// Handle answer checking logic
function handleAnswerCheck(newVal, vueApp) {
    if (newVal === 'blank') {
        // question reset. do not take any action
        return;
    }

    if (newVal === 'error' && vueApp.message === vueApp.message_strings.incompleteAns) {
            console.log("Answer incomplete");
            return; // Exit early if the answer is incomplete
    }
    const success = newVal === 'truth'

    const attempted = handleAnswer(vueApp.questionIndex, success)

    if(!attempted){
        // already attempted before. dont send statement
        return;
    }


    // TODO call groupWidgets
    // TODO call processGroupedWidgets
    const widgetsArray = Object.values(vueApp.item.question.widgets || {});
    // Filter out widgets that provide no user interaction
    const type = widgetsArray.filter(widget => !unsupportedInteractionTypes.includes(widget.type))
                            .map(widget => widget.type)[0]

    // Missing or generic widgets default to `Widgets.Question`, which records the question data only
    // without capturing how the user interacted with it. 
    // This fallback ensures no content is lost, but lacks detailed response tracking.
    const QuestionClass = interactionTypeMapping[type] || Widgets.Question
    const question = new QuestionClass(vueApp.questionIndex, xapiConfig.object.id, vueApp.item);

    const questionObject = question.getObject();
    const duration = recordProgress(startExerciseTime);
    
    const userResponse = vueApp.itemRenderer.questionRenderer.getUserInputForWidgets();
    const questionResult = question.generateResult(userResponse, success, duration)

    if (isExerciseComplete(vueApp.questionIndex, vueApp.maxQuestionIndex, vueApp.exerciseComplete)) {
        sendCompletionXAPIStatement(xapiConfig.object, correctAnswers, vueApp.maxQuestionIndex);
    }
}

// Send the start xAPI statement
async function sendStartXAPIStatement(vueApp) {
    try {
        const startXAPIData = createXAPIStatement("attempted", xapiConfig.object);
        await sendXAPIStatement(startXAPIData);
        console.log("Start xAPI statement sent successfully");
    } catch (error) {
        console.error("Failed to send start xAPI statement:", error);
    }
}

function handleAnswer(questionIndex, isCorrect) {
    // Ensure the question is marked as attempted only once
    if (!attemptedQuestions.has(questionIndex)) {
        attemptedQuestions.add(questionIndex);

        // Increment correct or incorrect counters based on isCorrect flag
        if (isCorrect) {
            correctAnswers += 1;
            console.log("Correct answer! Incrementing correctAnswers");
        } else {
            incorrectAnswers += 1;
            console.log("Incorrect answer! Incrementing incorrectAnswers");
        }
        return true
    } else {
        if(isCorrect){
            console.log("Answer correct, but question was previously attempted.")
        }
        return false
    }
}
/**
 * Main function to process a given question object and generate xAPI statements based on different widget types.
 *
 * This function processes widgets in the question to categorize them as individual, groupable, or unsupported,
 * and then generates xAPI statements accordingly. The main focus is to group widgets in a way that reduces the number
 * of xAPI statements while preserving the context.
 *
 * Assumptions and Key Behaviors:
 * - Widgets are grouped if they are of the same type and consecutive.
 * - Widgets that default to only question data are added once to the group.
 * - Unsupported widgets generate a single statement, irrespective of their count.
 * - Grouped widgets are expanded into individual widgets before processing.
 * - The main types of widgets are: individual, groupable, default question data, unsupported, and grouped.
 * - Grouped widgets (e.g., "graded-group") do not produce statements themselves but instead have their inner widgets processed.
 *
 * Processing logic:
 * - Iterate through each widget and categorize it based on its type.
 * - Maintain a `currentGroup` to handle widgets that can be grouped together.
 * - At the end of the iteration, any remaining group is pushed to the list of grouped widgets.
 * - Inner widgets from group widgets are processed with the same grouping rules.
 * - Finally, generate xAPI statements based on the grouped widgets list.
 */

// Define the supported interaction types
const individualInteractionTypes = ["radio", "matcher", "sorter", "dropdown"];
const groupableInteractionTypes = ["input-number", "expression"];
const groupWidgetTypes = ["graded-group",];

let questionCounter = 1;

/**
 * Processes the given question object to handle different widget types for xAPI statement generation.
 *
 * This function iterates over the widgets in the question, groups them based on their type, and then prepares
 * xAPI statements. Grouping is done to minimize the number of statements, based on consecutive widgets of the
 * same type and other rules for special widgets.
 *
 * Steps involved:
 * 1. **Initial Setup**: Extract widgets from the question object and initialize the necessary variables.
 * 2. **Iteration**: Iterate through each widget and determine its type:
 *    - **Group Widget**: Extract and process inner widgets.
 *    - **Unsupported Widget**: Add only once to grouped widgets.
 *    - **Default Question Data Widget (Unknown Widget Type)**: Add only once to grouped widgets.
 *    - **Individual Widget**: Handle it individually, close any ongoing group.
 *    - **Groupable Widget**: Continue adding to `currentGroup` if possible, or start a new group.
 * 3. **Final Group Handling**: If there is any remaining `currentGroup`, push it to the grouped widgets.
 * 4. **xAPI Statement Generation**: Process all grouped widgets to generate xAPI statements.
 *
 * @param {Object} item - The question item containing widget information to be processed.
 * @property {Object} item.question - The question object.
 * @property {Object} item.question.widgets - The widgets object, where each key is a widget identifier and the value is the widget data.
 */
function groupWidgets(item) {
    try {
        const widgets = item.question.widgets;
        const widgetKeys = Object.keys(widgets);

        let groupedWidgets = [];
        let currentGroup = null;
        let defaultQuestionDataAdded = false;
        let unsupportedWidgetsAdded = false;

        widgetKeys.forEach(widgetKey => {
            const widget = widgets[widgetKey];
            if (!isValidWidget(widget)) {
                console.warn(`Invalid widget data for widgetKey: ${widgetKey}`);
                return;
            }

            const widgetType = widget.type;

            if (isGroupWidget(widgetType)) {
                // Process the inner widgets of the group widget
                const innerWidgets = widget.options.widgets;
                const innerWidgetKeys = Object.keys(innerWidgets);
                innerWidgetKeys.forEach(innerWidgetKey => {
                    const innerWidget = innerWidgets[innerWidgetKey];
                    currentGroup = processInnerWidget(innerWidget, groupedWidgets, currentGroup);
                });
            } else if (isUnsupportedWidget(widgetType)) {
                if (!unsupportedWidgetsAdded) {
                    if (currentGroup) {
                        groupedWidgets.push(currentGroup);
                        currentGroup = null;
                    }
                    groupedWidgets.push({ widgets: [widget] });
                    unsupportedWidgetsAdded = true;
                }
            } else if (isIndividualWidget(widgetType)) {
                handleIndividualWidget(widgetType, widget, groupedWidgets, currentGroup);
                currentGroup = null;
            } else if (isGroupableWidget(widgetType)) {
                currentGroup = handleGroupableWidget(widgetType, widget, groupedWidgets, currentGroup);
            } else {
                // Treat unknown widget types as defaulting to question data
                if (!defaultQuestionDataAdded && !currentGroup) {
                    // Add a default question data widget if no other group is active
                    currentGroup = { widgets: [widget] };
                    defaultQuestionDataAdded = true;
                }
            }
        });

        // Push the last group if it exists
        if (currentGroup) {
            groupedWidgets.push(currentGroup);
        }
        return groupedWidgets;
    } catch (error) {
        console.error("An error occurred while processing the question: ", error);
    }
}

/**
 * Processes an inner widget of a group widget.
 *
 * This function is specifically used for handling widgets inside a group-type widget (e.g., "graded-group").
 * The widget is processed and appropriately added to the current group or as a new entry to the list of grouped widgets.
 *
 * Key considerations:
 * - Inner widgets are treated just like top-level widgets, following the same rules for grouping.
 * - If the widget is unsupported or individual, it ends the current grouping.
 * - Groupable widgets are added to the current group if they match.
 * - Unknown widgets are treated as default question data widgets.
 *
 * @param {Object} widget - The widget object.
 * @param {Array} groupedWidgets - The list of grouped widgets.
 * @param {Object|null} currentGroup - The current group being processed.
 * @returns {Object|null} - The updated current group.
 */
function processInnerWidget(widget, groupedWidgets, currentGroup) {
    const widgetType = widget.type;
    if (isUnsupportedWidget(widgetType)) {
        if (currentGroup) {
            groupedWidgets.push(currentGroup);
            currentGroup = null;
        }
        groupedWidgets.push({ widgets: [widget] });
    } else if (isIndividualWidget(widgetType)) {
        if (currentGroup) {
            groupedWidgets.push(currentGroup);
            currentGroup = null;
        }
        groupedWidgets.push({ type: widgetType, widgets: [widget] });
    } else if (isGroupableWidget(widgetType)) {
        currentGroup = handleGroupableWidget(widgetType, widget, groupedWidgets, currentGroup);
    } else {
        // Treat unknown widget types as defaulting to question data
        if (currentGroup) {
            currentGroup.widgets.push(widget);
        } else {
            currentGroup = { widgets: [widget] };
        }
    }
    return currentGroup;
}

/**
 * Checks if a widget is valid.
 * @param {Object} widget - The widget object.
 * @returns {boolean} - True if the widget is valid, false otherwise.
 */
function isValidWidget(widget) {
    return widget && widget.type;
}

/**
 * Checks if a widget type is a group widget.
 * @param {string} widgetType - The type of the widget.
 * @returns {boolean} - True if the widget type is a group widget, false otherwise.
 */
function isGroupWidget(widgetType) {
    return groupWidgetTypes.includes(widgetType);
}

/**
 * Checks if a widget type is unsupported.
 * @param {string} widgetType - The type of the widget.
 * @returns {boolean} - True if the widget type is unsupported, false otherwise.
 */
function isUnsupportedWidget(widgetType) {
    return unsupportedInteractionTypes.includes(widgetType);
}

/**
 * Checks if a widget type should be processed individually.
 * @param {string} widgetType - The type of the widget.
 * @returns {boolean} - True if the widget should be processed individually, false otherwise.
 */
function isIndividualWidget(widgetType) {
    return individualInteractionTypes.includes(widgetType);
}

/**
 * Checks if a widget type is groupable.
 * @param {string} widgetType - The type of the widget.
 * @returns {boolean} - True if the widget is groupable, false otherwise.
 */
function isGroupableWidget(widgetType) {
    return groupableInteractionTypes.includes(widgetType);
}

/**
 * Handles individual widgets by adding them to groupedWidgets and ending any ongoing group.
 * @param {string} widgetType - The type of the widget.
 * @param {Object} widget - The widget object.
 * @param {Array} groupedWidgets - The list of grouped widgets.
 * @param {Object|null} currentGroup - The current group being processed.
 */
function handleIndividualWidget(widgetType, widget, groupedWidgets, currentGroup) {
    if (currentGroup) {
        groupedWidgets.push(currentGroup);
    }
    groupedWidgets.push({ type: widgetType, widgets: [widget] });
}

/**
 * Handles groupable widgets by either continuing the current group or starting a new one.
 * @param {string} widgetType - The type of the widget.
 * @param {Object} widget - The widget object.
 * @param {Array} groupedWidgets - The list of grouped widgets.
 * @param {Object|null} currentGroup - The current group being processed.
 * @returns {Object} - The updated current group.
 */
function handleGroupableWidget(widgetType, widget, groupedWidgets, currentGroup) {
    if (currentGroup && currentGroup.type === widgetType) {
        currentGroup.widgets.push(widget);
    } else {
        if (currentGroup) {
            groupedWidgets.push(currentGroup);
        }
        currentGroup = { type: widgetType, widgets: [widget] };
    }
    return currentGroup;
}

/**
 * Processes the grouped widgets to generate xAPI statements.
 *
 * After grouping widgets, this function iterates over the groups and generates xAPI statements for each group.
 * The generated statements are unique, and their IDs are formatted depending on the number of groups:
 * - If there is only one statement, it uses a simple identifier (e.g., "question-1").
 * - If there are multiple statements for a question, they are assigned sub-identifiers (e.g., "question-1-a", "question-1-b").
 *
 * Key considerations:
 * - Ensures that each widget or group of widgets gets a unique identifier.
 * - Minimizes redundancy by generating fewer statements when possible.
 *
 * @param {Array} groupedWidgets - The list of grouped widgets.
 */
function processGroupedWidgets(groupedWidgets) {
    console.log("processGroupedWidgets called with groupedWidgets:", groupedWidgets);
    const questionId = `question-${questionCounter++}`;

    if (groupedWidgets.length === 1) {
        const group = groupedWidgets[0];
        generateXAPIStatement(questionId, group);
    } else {
        groupedWidgets.forEach((group, index) => {
            const subId = `${questionId}-${String.fromCharCode(97 + index)}`;
            generateXAPIStatement(subId, group);
        });
    }
}

function generateXAPIStatement(statementId, group) {
    console.log(`Generating xAPI statement for ${statementId}:`, group);

    // Use the widget type from the first widget in the group
    const widgetType = group.widgets[0].type; // All widgets in the group are of the same type
    const WidgetClass = interactionTypeMapping[widgetType] || Widgets.Question;

    // Create an instance of the widget class and generate the question object and result
    const question = new WidgetClass(statementId, xapiConfig.object.id, group.widgets);
    const questionObject = question.getObject();
    const questionResult = question.generateResult();

    console.log("Generated question object:", questionObject);
    console.log("Generated question result:", questionResult);

    // Send the xAPI statement here using the generated data
    sendQuestionXAPIStatement(questionObject, questionResult);
}

