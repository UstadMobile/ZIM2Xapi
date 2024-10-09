import * as Widgets from './khan-widgets.js';
// Global Variables Initialization
let xapiEnabled = false;
export let xapiConfig = {};
let correctAnswers = 0;
let incorrectAnswers = 0;
let attemptedQuestions = new Set();
let startExerciseTime = new Date();
let lastProgressTime = startExerciseTime;

// GROUP Widget - Contains multiple widgets
// Groupable - Widgets are grouped if they are of the same type and consecutive.
// Individual - Widgets handled individually
// Unsupported - These widgets provide content or context but do not have direct user interaction to record. 
// Default - Any missing widgets not mentioned only record question data
const GROUP_WIDGET = "group-widget";
const GROUPABLE = "groupable";
const INDIVIDUAL = "individual";
const UNSUPPORTED = "unsupported"
const DEFAULT = "default"

// supported khan academy interaction types
// These types actively capture user responses that can be tracked with xAPI.
// Each widget type corresponds to a unique user interaction that we want to record.
const interactionTypeMapping = {
    "input-number": { class: Widgets.InputNumber, category: GROUPABLE },
    "orderer": { class: Widgets.Orderer, category: INDIVIDUAL },
    "radio": { class: Widgets.Radio, category: INDIVIDUAL },
    "dropdown": { class: Widgets.Dropdown, category:INDIVIDUAL },
    "sorter": { class: Widgets.Sorter, category: INDIVIDUAL },
    "expression": { class: Widgets.Expression, category: GROUPABLE },
    "matcher": { class: Widgets.Matcher, category: INDIVIDUAL },
    "numeric-input": { class: Widgets.InputNumber, category: GROUPABLE },
    "categorizer": { class: Widgets.Categorizer, category: GROUPABLE },
    "image": { class: null, category: UNSUPPORTED },
    "definition": { class: null, category: UNSUPPORTED },
    "explanation": { class: null, category: UNSUPPORTED },
    "passage": { class: null, category: UNSUPPORTED },
    "passage-ref": { class: null, category: UNSUPPORTED },
    "video": { class: null, category: UNSUPPORTED },
    "graded-group": { class: null, category: GROUP_WIDGET }
};

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

/**
 * Adds parent and grouping context activities to the provided context.
 *
 * This function adds the parent context activity and optionally a grouping context if provided.
 *
 * @param {Object} context - The current xAPI context object.
 * @param {Array} contextActivitiesId - An array of context activity IDs to be added as "grouping".
 * @returns {Object} - The updated context with parent and grouping context activities.
 */
function addParentAndGroupingToContext(context, contextActivitiesId = null) {
    let updatedContext = context ? JSON.parse(JSON.stringify(context)) : {};
    updatedContext.contextActivities = context?.contextActivities || {};
    updatedContext.contextActivities.parent = xapiConfig.parent

    if (contextActivitiesId && contextActivitiesId.length > 0) {
        if (!updatedContext.contextActivities.grouping) {
            updatedContext.contextActivities.grouping = [];
        }
    
        contextActivitiesId.forEach(id => {
            updatedContext.contextActivities.grouping.push({
                id: `${xapiConfig.object.id}/question-${id}`,
            });
        });
    }
   
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
        addParentAndGroupingToContext(xapiConfig.context) // context with parent exercise added
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
async function sendQuestionXAPIStatement(questionObject, resultObject, context) {
    const questionXAPIData = createXAPIStatement(
        "answered", questionObject, resultObject, context
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

    const duration = recordProgress(startExerciseTime);
    const userResponse = vueApp.itemRenderer.questionRenderer.getUserInputForWidgets();


    const groupedWidgets = groupWidgets(vueApp.item)
    const statements = processGroupedWidgets(groupedWidgets, vueApp.questionIndex)

    statements.forEach(statement => {
        generateXAPIStatement(statement.id, statement.group, vueApp.item.question.content, 
            statement.contextActivityIds, userResponse, success, duration);
    });

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
        let unsupportedAndDefaultGroup = { widgets: [], type: DEFAULT };

        widgetKeys.forEach(widgetKey => {
            const widget = widgets[widgetKey];
            if (!isValidWidget(widget)) {
                console.warn(`Invalid widget data for widgetKey: ${widgetKey}`);
                return;
            }

            const widgetWithKey = { ...widget, key: widgetKey };
            currentGroup = handleWidget(widgetWithKey, groupedWidgets, currentGroup, unsupportedAndDefaultGroup)        
        });

        // Push the last group if it exists
        if (currentGroup) {
            groupedWidgets.push(currentGroup);
        }

        if (unsupportedAndDefaultGroup.widgets.length > 0) {
            console.log("Pushing unsupported and default widgets to groupedWidgets.");
            groupedWidgets.push(unsupportedAndDefaultGroup);
        }

        return groupedWidgets;
    } catch (error) {
        console.error(`An error occurred while processing the question: ${item} with error ${error}`);
    }
}


/**
 * Processes a given widget, grouping it accordingly and adding it to the appropriate group.
 * This function is called both for top-level widgets and for any inner widgets of group widgets.
 *
 * @param {Object} widget - The widget to be processed.
 * @param {Array} groupedWidgets - The list of grouped widgets.
 * @param {Object|null} currentGroup - The current group being processed.
 * @param {Object} unsupportedAndDefaultGroup - The group for unsupported and default widgets.
 * @returns {Object|null} - The updated current group.
 */
function handleWidget(widget, groupedWidgets, currentGroup, unsupportedAndDefaultGroup) {
    const widgetCategory = interactionTypeMapping[widget.type]?.category || DEFAULT;
    switch (widgetCategory) {
        case GROUP_WIDGET:
            handleGroupWidget(widget, groupedWidgets, currentGroup);
            break;
        case INDIVIDUAL:
            handleIndividualWidget(widget, groupedWidgets, currentGroup);
            currentGroup = null;
            break;
        case GROUPABLE:
            currentGroup = handleGroupableWidget(widget, groupedWidgets, currentGroup);
            break;
        default:
            unsupportedAndDefaultGroup.widgets.push(widget);
            currentGroup = null;
            break;
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


function handleGroupWidget(widget, groupedWidgets, currentGroup) {
    console.log("Widget is a group widget, processing inner widgets...");
    const innerWidgets = widget.options.widgets;
    const innerWidgetKeys = Object.keys(innerWidgets);
    innerWidgetKeys.forEach(innerWidgetKey => {
        const innerWidget = { ...innerWidgets[innerWidgetKey], key: innerWidgetKey };
        currentGroup = handleWidget(innerWidget, groupedWidgets, currentGroup);
    });
}

/**
 * Handles individual widgets by adding them to groupedWidgets and ending any ongoing group.
 * @param {Object} widget - The widget object.
 * @param {Array} groupedWidgets - The list of grouped widgets.
 * @param {Object|null} currentGroup - The current group being processed.
 */
function handleIndividualWidget(widget, groupedWidgets, currentGroup) {
    if (currentGroup) {
        groupedWidgets.push(currentGroup);
    }
    groupedWidgets.push({ widgets: [widget], type: widget.type });
}

/**
 * Handles groupable widgets by either continuing the current group or starting a new one.
 * @param {Object} widget - The widget object.
 * @param {Array} groupedWidgets - The list of grouped widgets.
 * @param {Object|null} currentGroup - The current group being processed.
 * @returns {Object} - The updated current group.
 */
function handleGroupableWidget(widget, groupedWidgets, currentGroup) {
    if (currentGroup && currentGroup.type === widget.type) {
        currentGroup.widgets.push(widget);
    } else {
        if (currentGroup) {
            groupedWidgets.push(currentGroup);
        }
        currentGroup = { widgets: [widget], type: widget.type };
    }
    return currentGroup;
}

function generateQuestionId(questionIndex, subIndex = null) {
    let questionId = `${questionIndex + 1}`;
    if (subIndex !== null) {
        questionId += `${String.fromCharCode(97 + subIndex)}`; // Generates sub-IDs like "1a", "1b", etc.
    }
    return questionId;
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
function processGroupedWidgets(groupedWidgets, questionIndex) {
    console.log("processGroupedWidgets called with groupedWidgets:", groupedWidgets);
    const baseId = xapiConfig.object.id;

    const actionableGroups = groupedWidgets.filter(
        group => group.type !== UNSUPPORTED 
            && group.type !== DEFAULT);

    let statementsToGenerate = [];

    if (actionableGroups.length > 1) {
        const contextActivityIds = actionableGroups.map((group, index) => {
            return `${generateQuestionId(questionIndex, index)}`
        });

        actionableGroups.forEach((group, index) => {
            const questionId = contextActivityIds[index];
            statementsToGenerate.push({ id: questionId, group: group, contextActivityIds: contextActivityIds });
        });
    } else {
        const group = actionableGroups.length === 1 ? actionableGroups[0] : groupedWidgets[0];
        const questionId = generateQuestionId(baseId, questionIndex);
        statementsToGenerate.push({ id: questionId, group: group, contextActivityIds: null });
    }

    return statementsToGenerate;
}

function generateXAPIStatement(questionId, group, questionContent, contextActivitiesId, userResponse, success, duration) {
    console.log(`Generating xAPI statement for ${questionId}:`, group);

    // Use the widget type from the first widget in the group
    const widgetType = group.widgets[0].type; // All widgets in the group are of the same type
    const WidgetClass = interactionTypeMapping[widgetType]?.class || Widgets.Question;

    // Create an instance of the widget class and generate the question object and result
    const question = new WidgetClass(questionId, xapiConfig.object.id, questionContent, group.widgets);
    const questionObject = question.getObject();

    const questionResult = question.generateResult(userResponse, success, duration);
    const questionContext = addParentAndGroupingToContext(xapiConfig.context, contextActivitiesId)

    console.log("Generated question object:", questionObject);
    console.log("Generated question result:", questionResult);

    // Send the xAPI statement here using the generated data
    sendQuestionXAPIStatement(questionObject, questionResult, questionContext);
}

