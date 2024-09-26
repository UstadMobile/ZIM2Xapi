window.vueApp = vueApp;

let xapiEnabled = false;
let xapiConfig = {};
let tinCanXML = null;

function loadTinCanXML() {
    console.log('Attempting to load tincan.xml');
    return fetch('tincan.xml')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(str => {
            console.log('tincan.xml content:', str);
            return (new window.DOMParser()).parseFromString(str, "text/xml");
        })
        .then(data => {
            tinCanXML = data;
            console.log('Loaded tincan.xml');
        })
        .catch(error => {
            console.error('Error loading tincan.xml:', error);
            return null;
        });
}

function getTinCanData(xpath) {
    if (!tinCanXML) {
        console.warn('tinCanXML is null, unable to get data');
        return null;
    }
    try {

        const namespaceResolver = function (prefix) {
               const ns = {
                    'tincan': 'http://projecttincan.com/tincan.xsd' // Define the namespace here
               };
                 return ns[prefix] || null;
        };

        return tinCanXML.evaluate(xpath, tinCanXML, namespaceResolver, XPathResult.STRING_TYPE, null).stringValue;
    } catch (error) {
        console.error('Error evaluating XPath:', error);
        return null;
    }
}

function parseXAPILaunchParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const endpoint = urlParams.get('endpoint');
    const auth = urlParams.get('auth');
    const actor = urlParams.get('actor');

    if (endpoint && auth && actor) {
        xapiEnabled = true;
        xapiConfig = {
            endpoint: decodeURIComponent(endpoint),
            auth: decodeURIComponent(auth),
            actor: JSON.parse(decodeURIComponent(actor)),
            registration: urlParams.get('registration'),
            activity_id: urlParams.get('activity_id'),
            activity_platform: urlParams.get('activity_platform'),
            language: urlParams.get('Accept-Language'),
            grouping: urlParams.get('grouping')
        };
        console.log('xAPI enabled with config:', xapiConfig);

        return loadTinCanXML().then(() => {
            xapiConfig.activityName = getTinCanData('//tincan:activity/tincan:name');
            xapiConfig.activityDescription = getTinCanData('//tincan:activity/tincan:description');
            xapiConfig.activityType = getTinCanData('//tincan:activity/@type');
            console.log('Updated xAPI config with tincan.xml data:', xapiConfig);
        });
    } else {
        console.log('xAPI not enabled: missing required launch parameters');
        return Promise.resolve();
    }
}
function sendXAPIStatement(action, verb, additionalData = {}) {
    console.log('sendXAPIStatement called with:', { action, verb, additionalData });
    if (!xapiEnabled) {
        console.log('xAPI not enabled, statement not sent:', action);
        return;
    }
    const statement = {
        actor: xapiConfig.actor,
        verb: {
            id: verb,
            display: { "en-US": action }
        },
        object: {
            id: xapiConfig.activity_id || getTinCanData('//tincan:activity/@id'),
            definition: {
                name: { "en-US": xapiConfig.activityName || "Exercise Name" },
                description: { "en-US": xapiConfig.activityDescription || "Exercise Description" },
                type: xapiConfig.activityType || "http://adlnet.gov/expapi/activities/assessment"
            }
        },
        context: {
            registration: xapiConfig.registration,
            platform: xapiConfig.activity_platform,
            language: xapiConfig.language,
            contextActivities: xapiConfig.grouping ? {
                grouping: [{ id: xapiConfig.grouping }]
            } : undefined
        },
        result: additionalData
    };

    console.log("Sending xAPI statement:", statement);
    // Implement actual sending logic here
}
function injectXAPIFunctions(vueApp) {
    console.log('Injecting xAPI functions into Vue app');
    if (!xapiEnabled) {
        console.log('xAPI integration skipped: not enabled');
        return;
    }

    // Store original methods
    const originalMethods = {
        interactionCallback: vueApp.interactionCallback,
        checkAnswer: vueApp.checkAnswer,
        setPerseusData: vueApp.setPerseusData,
        takeHint: vueApp.takeHint,
        renderItem: vueApp.renderItem
    };

    // Override renderItem to catch when itemRenderer is set
    vueApp.renderItem = function() {
        console.log('xAPI: renderItem called');
        const result = originalMethods.renderItem.apply(this, arguments);
        // The itemRenderer should now be set, so we can override the other methods
        overrideMethodsWithItemRenderer(this);
        return result;
    };

    function overrideMethodsWithItemRenderer(instance) {
        instance.interactionCallback = function() {
            console.log('xAPI: interactionCallback called');
            return originalMethods.interactionCallback.apply(this, arguments);
        };

        instance.checkAnswer = function() {
            console.log('xAPI: checkAnswer called');
            const result = originalMethods.checkAnswer.apply(this, arguments);
            if (this.itemRenderer && !this.loading) {
                const check = this.itemRenderer.scoreInput();
                if (!check.empty) {
                    sendXAPIStatement("answered", "http://adlnet.gov/expapi/verbs/answered", {
                        success: check.correct,
                        response: '' // You might want to implement a way to get the actual answer
                    });
                }
            }
            return result;
        };

        instance.takeHint = function() {
            console.log('xAPI: takeHint called');
            const result = originalMethods.takeHint.apply(this, arguments);
            if (this.itemRenderer && this.itemRenderer.state && this.itemRenderer.state.hintsVisible > 0) {
                sendXAPIStatement("requested-hint", "http://adlnet.gov/expapi/verbs/asked", {
                    hintIndex: this.itemRenderer.state.hintsVisible - 1
                });
            }
            return result;
        };

        instance.setPerseusData = function(index) {
            console.log('xAPI: setPerseusData called');
            const result = originalMethods.setPerseusData.apply(this, arguments);
            if (this.exerciseComplete) {
                sendXAPIStatement("completed", "http://adlnet.gov/expapi/verbs/completed");
            }
            return result;
        };

        console.log('xAPI functions injected successfully with itemRenderer');
    }

    // In case itemRenderer is already set (unlikely, but possible)
    if (vueApp.itemRenderer) {
        overrideMethodsWithItemRenderer(vueApp);
    }

    console.log('xAPI initial setup complete');
}
/*
function injectXAPIFunctions(vueApp) {
    console.log('Injecting xAPI functions into Vue app');
    if (!xapiEnabled) {
        console.log('xAPI integration skipped: not enabled');
        return;
    }

    const originalMethods = {
            interactionCallback: vueApp.interactionCallback,
            checkAnswer: vueApp.checkAnswer,
            setPerseusData: vueApp.setPerseusData,
            takeHint: vueApp.takeHint,
            renderItem: vueApp.renderItem
    };

    vueApp.renderItem = function() {
            console.log('xAPI: renderItem called');
            const result = originalMethods.renderItem.apply(this, arguments);
            // The itemRenderer should now be set, so we can override the other methods
            overrideMethodsWithItemRenderer(this);
            return result;
    };



    vueApp.interactionCallback = function() {
            console.log('xAPI: interactionCallback called');
            originalMethods.interactionCallback.call(this);
            //sendXAPIStatement("attempted", "http://adlnet.gov/expapi/verbs/attempted");
    };

    vueApp.checkAnswer = function() {
            console.log('xAPI: checkAnswer called');
            const result = originalMethods.checkAnswer.call(this);
            console.log(result)
            if (result && !result.empty) {
                sendXAPIStatement("answered", "http://adlnet.gov/expapi/verbs/answered", {
                    success: result.correct,
                    response: result.simpleAnswer
                });
            }
            return result;
    };

    vueApp.takeHint = function() {
            console.log('xAPI: takeHint called');
            if (originalMethods.takeHint) {
                originalMethods.takeHint.call(this);
            }
            if (this.itemRenderer && this.itemRenderer.state && this.itemRenderer.state.hintsVisible > 0) {
                sendXAPIStatement("requested-hint", "http://adlnet.gov/expapi/verbs/asked", {
                    hintIndex: this.itemRenderer.state.hintsVisible - 1
                });
            }
     };

    vueApp.setPerseusData = function(index) {
            console.log('xAPI: setPerseusData called');
            const result = originalMethods.setPerseusData.call(this, index);
            if (this.exerciseComplete) {
                sendXAPIStatement("completed", "http://adlnet.gov/expapi/verbs/completed");
            }
            return result;
     };

    console.log('xAPI functions injected successfully');
}
 */

function waitForVueApp() {
    return new Promise((resolve) => {
        const checkVueApp = () => {
            if (window.vueApp) {
                console.log('Vue app found');
                resolve(window.vueApp);
            } else {
                console.log('Waiting for Vue app...');
                setTimeout(checkVueApp, 100);
            }
        };
        checkVueApp();
    });
}

function waitForItemRenderer(vueApp) {
    return new Promise((resolve) => {
        const checkItemRenderer = () => {
            if (vueApp.itemRenderer) {
                console.log('itemRenderer found');
                resolve(vueApp.itemRenderer);
            } else {
                console.log('Waiting for itemRenderer...');
                setTimeout(checkItemRenderer, 100);
            }
        };
        checkItemRenderer();
    });
}

// Initialize xAPI and inject functions when everything is ready
parseXAPILaunchParameters()
    .then(() => {
        console.log('xAPI launch parameters parsed');
        return waitForVueApp();
    })
    .then(( vueApp ) => {
            //console.log('itemRenderer found, injecting xAPI functions');
            injectXAPIFunctions(vueApp);
        })
    .catch((error) => {
        console.error('Error initializing xAPI:', error);
    });