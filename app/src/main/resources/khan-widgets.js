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

     getObject() {
          return this.object
     }

     generateResult(userResponse, success, duration) {
          return {
               success: success,
               duration: duration
          }
     }
}

export class InputNumber extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          const widgetsArray = Object.values(item.question.widgets || {});
          const correctResponseString = widgetsArray
               .map(widget => widget.options?.value)  // Extract value from options if available
               .filter(value => value !== undefined)  // Filter out any undefined values
               .join("[,]");

          this.object.definition.interactionType = "numeric"
          this.object.definition.correctResponsesPattern = [correctResponseString];
     }

     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          let userResponseString;

          if (success) {
               // If success is true, use the correct response pattern directly
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               const userValuesArray = Object.keys(userResponse).map(key => userResponse[key].currentValue);
               userResponseString = userValuesArray.join("[,]");
          }

          result.response = userResponseString
          return result
     }
}

export class Orderer extends Question {

     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          const widgetsArray = Object.values(item.question.widgets || {});
          const widget = widgetsArray[0];

          // Ensure widget options exist
          if (!widget || !widget.options) {
               throw new Error("Invalid widget data for Orderer");
          }

          const choices = widget.options.options.map((option, index) => {
               const id = `choice${index + 1}`;
               return {
                    id: id,
                    description: {
                         "en-US": option.content
                    }
               };
          });

          const correctResponseIds = widget.options.correctOptions.map(correctOption => {
               // Find the corresponding choice by matching content
               const matchingChoice = choices.find(choice => choice.description["en-US"] === correctOption.content);
               // Return the ID of the matching choice
               return matchingChoice ? matchingChoice.id : null;
          })
               // Filter out any null values (in case no match was found) and join the IDs
               .filter(id => id !== null)
               .join("[,]");

          this.object.choices = choices
          this.object.definition.interactionType = "sequencing"
          this.object.definition.correctResponsesPattern = [correctResponseIds];

     }

     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               const userValuesArray = Object.keys(userResponse)
                    .flatMap(key => userResponse[key].current);

               userResponseString = userValuesArray
                    .map(response => {
                         // Find the matching choice based on the response content
                         const matchingChoice = this.object.choices.find(choice => choice.description["en-US"] === response);
                         return matchingChoice ? matchingChoice.id : null;
                    })
                    // Filter out any null values (i.e., unmatched responses)
                    .filter(id => id !== null)
                    // Join the IDs to create the response string in xAPI format
                    .join("[,]");
          }

          result.response = userResponseString
          return result
     }
}

export class Radio extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties
     }

     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               const userValuesArray = Object.keys(userResponse)
                    .flatMap(key => userResponse[key].current);

               userResponseString = userValuesArray
                    .map(response => {
                         // Find the matching choice based on the response content
                         const matchingChoice = this.object.choices.find(choice => choice.description["en-US"] === response);
                         return matchingChoice ? matchingChoice.id : null;
                    })
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

