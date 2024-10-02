/*
    All khan academy widgets and its json structure can be found here
    https://khan.github.io/perseus/?path=/docs/perseus-widgets
*/
class Question {
    constructor(questionIndex, endpoint, item) {
        this.item = item;
        this.object = {
            id: `${endpoint}/question-${questionIndex + 1}`,
            objectType: "Activity",
            definition: {
                 name: { "en-US": `Question ${questionIndex + 1}` },
                 type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                 description: { "en-US": item.question.content }
            }
        }
    }

    getObject(){
        return this.object
    }

    generateResult(userResponse, duration) {
        throw new Error("generateResult() must be implemented by subclasses");
    }
}

export class InputNumber extends Question {
    constructor(questionIndex, endpoint, item) {
        super(questionIndex, endpoint, item); // Initialize common properties

        const widgetsArray = Object.values(vueApp.item.question.widgets || {});
        const correctResponseString = widgetsArray
            .map(widget => widget.options?.value)  // Extract value from options if available
            .filter(value => value !== undefined)  // Filter out any undefined values
            .join("[,]");

        this.object.definition.interactionType = "numeric"
        this.object.definition.correctResponsesPattern = [correctResponseString];
    }

    generateResult(userResponse, success, duration) {

        const userValuesArray = Object.keys(userResponse).map(key => userResponse[key].currentValue);
        const userResponseString = userValuesArray.join("[,]");

        return {
                response: userResponseString,
                success: success,
                duration: duration
        }
    }
}

export class Categorizer {
    static toXAPI(widgetData) {
            return "numeric"
    }
}

export class Dropdown {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class GradedGroupSet {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class GradedGroup {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class Group {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class Grapher {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class IFrame {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class Interaction {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class Matcher {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

export class Matrix {
    static toXAPI(widgetData) {
          return "numeric"
     }
}

