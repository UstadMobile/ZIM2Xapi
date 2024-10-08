/*
    All khan academy widgets and its json structure can be found here
    https://khan.github.io/perseus/?path=/docs/perseus-widgets
*/
import { xapiConfig } from "./score-tracker.js"

export class Question {
     constructor(questionIndex, endpoint, item) {
          this.item = item;
          this.object = {
               id: `${endpoint}/question-${questionIndex + 1}`,
               objectType: "Activity",
               definition: {
                    name: { [xapiConfig.language]: `Question ${questionIndex + 1}` },
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    description: {[xapiConfig.language]: item.question.content }
               }
          }
     }

     getObject() {
          return this.object
     }

     generateResult(userResponse, success, duration) {
          console.log(userResponse)
          return {
               success: success,
               duration: duration
          }
     }
}

/**
 * InputNumber widget
 * 
 * Example Json
 * widgets: {
      'input-number 1': {
        alignment: 'default',
        graded: true,
        options: {
          answerType: 'rational',
          inexact: false,
          maxError: 0.1,
          simplify: 'optional',
          size: 'normal',
          value: 0.3333333333333333
        },
        type: 'input-number',
        version: {
          major: 0,
          minor: 0
        }
      }
    }
 * 
 */
export class InputNumber extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          const widgetsArray = Object.values(item.question.widgets || {});

          const correctResponseString = widgetsArray
               .filter(widget => widget.type === 'input-number' || widget.type == 'numeric-input')
               .map(widget => widget.options?.value || options.answers?.[0]?.value)  // Extract value from options if available
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



/**
 * Orderer widget
 * 
 * @param {number} questionIndex 
 * @param {string} endpoint 
 * @param {object} item 
 * 
 * Example Json
 * widgets: {
      'orderer 1': {
        graded: true,
        options: {
          correctOptions: [
            {
              content: '$10.9$',
              images: {},
              widgets: {}
            },
            {
              content: '$\sqrt{120}$',
              images: {},
              widgets: {}
            },
            {
              content: '$11$',
              images: {},
              widgets: {}
            }
          ],
          height: 'normal',
          layout: 'horizontal',
          options: [
            {
              content: '$10.9$',
              images: {},
              widgets: {}
            },
            {
              content: '$11$',
              images: {},
              widgets: {}
            },
            {
              content: '$\sqrt{120}$',
              images: {},
              widgets: {}
            }
          ],
          otherOptions: []
        },
        type: 'orderer',
        version: {
          major: 0,
          minor: 0
        }
      }
     }
 */
export class Orderer extends Question {

     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          // TODO handle multiple widgets
          const widgetsArray = Object.values(item.question.widgets || {});
          const widget = widgetsArray.find(w => w.type === 'orderer');

          // Ensure widget options exist
          if (!widget || !widget.options) {
               throw new Error("Invalid widget data for Orderer");
          }

          const choices = processChoicesWidgetData(widget)

          const correctResponseIds = widget.options.correctOptions.map(correctOption => {
               // Find the corresponding choice by matching content
               const matchingChoice = choices.find(choice => choice.description[xapiConfig.language] === correctOption.content);
               // Return the ID of the matching choice
               return matchingChoice ? matchingChoice.id : null;
          })
               // Filter out any null values (in case no match was found) and join the IDs
               .filter(id => id !== null)
               .join("[,]");

          this.object.definition.choices = choices
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
                         const matchingChoice = this.object.definition.choices.find(choice => choice.description[[xapiConfig.language]] === response);
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

/**
 * Radio widget
 * 
 * Example Json
 * choices={[
    {
      checked: false,
      content: 'Content 1',
      correct: false,
      crossedOut: false,
      disabled: false,
      hasRationale: false,
      highlighted: false,
      isNoneOfTheAbove: false,
      previouslyAnswered: false,
      rationale: '',
      revealNoneOfTheAbove: false,
      showCorrectness: false,
      showRationale: false
    },
    {
      checked: false,
      content: 'Content 2',
      correct: false,
      crossedOut: false,
      disabled: false,
      hasRationale: false,
      highlighted: false,
      isNoneOfTheAbove: false,
      previouslyAnswered: false,
      rationale: '',
      revealNoneOfTheAbove: false,
      showCorrectness: false,
      showRationale: false
    },
    {
      checked: false,
      content: 'Content 3',
      correct: true,
      crossedOut: false,
      disabled: false,
      hasRationale: false,
      highlighted: false,
      isNoneOfTheAbove: false,
      previouslyAnswered: false,
      rationale: '',
      revealNoneOfTheAbove: false,
      showCorrectness: false,
      showRationale: false
    },
    {
      checked: false,
      content: '',
      correct: false,
      crossedOut: false,
      disabled: false,
      hasRationale: false,
      highlighted: false,
      isNoneOfTheAbove: true,
      previouslyAnswered: false,
      rationale: '',
      revealNoneOfTheAbove: false,
      showCorrectness: false,
      showRationale: false
    }
  ]}
 * 
 */
export class Radio extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          // TODO handle multiple widgets
          const widgetsArray = Object.values(item.question.widgets || {});
          const widget = widgetsArray.find(w => w.type === 'radio');

          // Ensure widget options exist
          if (!widget || !widget.options || !widget.options.choices) {
               throw new Error("Invalid widget data for Radio");
          }

          const choices = processChoicesWidgetData(widget)

          const correctResponseIds = choices
               .filter(choice => choice.correct) // Filter for correct options
               .map(choice => choice.id) // Map to get the IDs of the correct choices
               .join("[,]")

          this.object.definition.choices = choices.map(({ id, description }) => ({ id, description })); // Remove `correct` key for xAPI
          this.object.definition.interactionType = "choice"
          this.object.definition.correctResponsesPattern = [correctResponseIds];

     }

     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)
          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               const questionKey = Object.keys(userResponse)[0]; // Assuming there's only one question response
               const radioResponse = userResponse[questionKey]; // Access the specific question response
               
               if (radioResponse.noneOfTheAboveSelected) {
                    const noneOfTheAboveChoice = this.object.definition.choices.find(choice => choice.description[xapiConfig.language] === "None of the Above");
                    userResponseString = noneOfTheAboveChoice ? noneOfTheAboveChoice.id : null;
                } else {
                    const userChoices = this.object.definition.choices.map((choice, index) => {
                         return radioResponse.choicesSelected[index] ? choice.id : null;
                     }).filter(id => id !== null); // Filter out nulls
             
                    userResponseString = userChoices.join("[,]"); // Join selected choice IDs
               }
          }

          result.response = userResponseString
          return result
     }
}

/**
 * Dropdown widget
 * 
 * Example Json
 * widgets: {
      'dropdown 1': {
        alignment: 'default',
        graded: true,
        options: {
          choices: [
            {
              content: 'greater than or equal to',
              correct: false
            },
            {
              content: 'less than or equal to',
              correct: true
            }
          ],
          placeholder: 'greater/less than or equal to',
          static: false
        },
        static: false,
        type: 'dropdown',
        version: {
          major: 0,
          minor: 0
        }
      }
    }
 * 
 */
export class Dropdown extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

           // TODO handle multiple widgets
          const widgetsArray = Object.values(item.question.widgets || {});
          const widget = widgetsArray.find(w => w.type === 'dropdown');

          // Ensure widget options exist
          if (!widget || !widget.options || !widget.options.choices) {
               throw new Error("Invalid widget data for Radio");
          }
           
          const choices = processChoicesWidgetData(widget)

          const correctResponseIds = choices
          .filter(choice => choice.correct) // Filter for correct options
          .map(choice => choice.id) // Map to get the IDs of the correct choices
          .join("[,]")

          this.object.definition.choices = choices.map(({ id, description }) => ({ id, description })); // Remove `correct` key for xAPI
          this.object.definition.interactionType = "choice"
          this.object.definition.correctResponsesPattern = [correctResponseIds];

     }

     /*
          User Response example
          {
               "dropdown 1": {
                    "value": 1
               }
          }
     */
     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               const questionKey = Object.keys(userResponse)[0];
               const dropdownResponse = userResponse[questionKey];

               const selectedIndex = dropdownResponse.value - 1; // Adjust to 0-based index for the array
               const selectedChoice = this.object.definition.choices[selectedIndex].id;

               userResponseString = selectedChoice
          }

          result.response = userResponseString

          return result
     }
}

/**
 * Sorter widget
 * 
 * Example Json
 * widgets: {
      'sorter 1': {
        graded: true,
        options: {
          correct: [
            '$0.005$ kilograms',
            '$15$ grams',
            '$55$ grams'
          ],
          layout: 'horizontal',
          padding: true
        },
        type: 'sorter',
        version: {
          major: 0,
          minor: 0
        }
      }
    }
 */
export class Sorter extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          const widgetsArray = Object.values(item.question.widgets || {});
          const widget = widgetsArray.find(w => w.type === 'sorter');

          // Ensure widget options exist
          if (!widget || !widget.options || !widget.options.correct) {
               throw new Error("Invalid widget data for Orderer");
          }

          const choices = widget.options.correct.map((option, index) => {
               const id = `choice${index + 1}`;
               return {
                    id: id,
                    description: {
                         [xapiConfig.language]: option
                    }
               };
          });

          const correctResponseIds = choices
               .map(choice => choice.id)
               .join("[,]")

          this.object.definition.choices = choices
          this.object.definition.interactionType = "sequencing"
          this.object.definition.correctResponsesPattern = [correctResponseIds];


     }

     /*
          User Response example
          {
               "sorter 1": {
                    "options": [
                        0:"$15$ grams"
                        1:"$0.005$ kilograms"
                        2:"$55$ grams"  
                    ]
               }
          }
     */
     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {

               const questionKey = Object.keys(userResponse)[0];
               const sorterOptions = userResponse[questionKey].options;

               // for each option, find the matching choice and return the id
               const userChoices = sorterOptions.map(option => {
                    const matchingChoice = this.object.definition.choices.find(choice => choice.description[[xapiConfig.language]] === option);
                    return matchingChoice ? matchingChoice.id : null;
               }).filter(id => id !== null); // Filter out nulls

               userResponseString = userChoices.join("[,]"); // Join selected choice IDs
          }

          result.response = userResponseString
          return result
     }
}

/*
     Expression widget

     Example Json
     widgets: {
        'expression 1': {
          graded: true,
          options: {
            answerForms: [
              {
                considered: 'ungraded',
                form: false,
                simplify: false,
                value: 'x+1'
              },
              {
                considered: 'wrong',
                form: false,
                simplify: false,
                value: 'y+1'
              },
              {
                considered: 'correct',
                form: false,
                simplify: false,
                value: 'z+1'
              },
              {
                considered: 'correct',
                form: false,
                simplify: false,
                value: 'a+1'
              }
            ],
            ariaLabel: 'number of centimeters',
            buttonSets: [
              'basic'
            ],
            buttonsVisible: 'focused',
            functions: [
              'f',
              'g',
              'h'
            ],
            times: false,
            visibleLabel: 'number of cm'
          },
          type: 'expression',
          version: {
            major: 1,
            minor: 0
          }
        }
      }

*/
export class Expression extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          const widgetsArray = Object.values(item.question.widgets || {});

          // Get all the correct answers for each widget
          const correctAnswersByWidget = widgetsArray
                    .filter(widget => widget.type === 'expression')
                    .map(widget => {
               const answerForms = widget.options.answerForms;

               return answerForms
               .filter(answer => answer.considered === 'correct')
               .map(answer => answer.value);
          })


          // Generate all combinations of the given arrays
          const allCombinations = generateCombinations(correctAnswersByWidget);
          const correctResponsesPattern = allCombinations.map(combination => combination.join('[,]'));

          this.object.definition.interactionType = "fill-in"
          this.object.definition.correctResponsesPattern = correctResponsesPattern;
     }

     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          const userResponseString = Object.values(userResponse)
                                             .filter(value => value !== null)
                                             .join('[,]')

          result.response = userResponseString

          return result
     }
}


/*
     Matcher Widget 

     Example Json
     widgets: {
      'matcher 1': {
        graded: true,
        options: {
          labels: [
            '**Claims**',
            '**Evidence**'
          ],
          left: [
            'Our Sun will run out of fuel and die in around 5 billion years ',
            'Plate tectonics will rearrange the continents: the Pacific will narrow, bringing Australia closer to the Americas, and the Atlantic will expand to form the largest of the oceans ',
            'Our Sun will run out of hydrogen, swell into a red giant, gobble up the inner rocky planets, and then collapse and die ',
            'Average global temperatures will rise ',
            'In 3 to 4 billion years, our galaxy will begin a slow collision with its closest large neighbor, Andromeda '
          ],
          orderMatters: false,
          padding: true,
          right: [
            'Medium-sized stars typically exist for roughly 10 billion years',
            'The current trajectory of the Earth’s tectonic plate movement',
            'The life cycle of medium-sized stars includes a red giant stage and ends in a whimper as a white dwarf',
            'Rapid escalation of greenhouse gas emissions',
            'The current trajectory of the Milky Way galaxy and those in its immediate proximity'
          ]
        },
        type: 'matcher',
        version: {
          major: 0,
          minor: 0
        }
      }
    }
*/
export class Matcher extends Question {
     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties

          const widgetsArray = Object.values(item.question.widgets || {});
          const widget = widgetsArray.find(w => w.type === 'matcher');

          // Ensure widget options exist
          if (!widget || !widget.options || !widget.options.left || !widget.options.right) {
               throw new Error("Invalid widget data for Matcher");
          }

          const leftChoices = widget.options.left;
          const rightChoices = widget.options.right;

          const source = leftChoices.map((choice, index) => ({
               id: `source${index + 1}`,
               description: {
                    [xapiConfig.language]: choice
               }
          }));
          
          const target = rightChoices.map((choice, index) => ({
               id: `${index + 1}`,
               description: {
                    [xapiConfig.language]: choice
               }
          }));

          // end result based on size would be source1[.]1[,]source2[.]2[,]source3[.]3
          const correctResponsesPattern = leftChoices.map((choice, index) => {
               return `source${index + 1}[.]${index + 1}`;
           }).join('[,]');

          this.object.definition.interactionType = "matching"
          this.object.definition.source = source;
          this.object.definition.target = target;
          this.object.definition.correctResponsesPattern = [correctResponsesPattern];
          
     }


     /*
     Matcher user response 
     
     {
    "matcher 1": {
       0: {
        "left": [
            "Relative maximum or minimum",
            "Positive or negative interval",
            "Increasing or decreasing interval"
        ],
        "right": [
            "The gym's net worth was at its lowest at $6$ months.",
            "The gym was losing money for the first $6$ months.",
            "The gym's losses exceeded its profits between $2$ and $10$ months after opening."
        ]
     }
    }
}
     */
     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               const matcher = Object.values(userResponse).filter(item => item && item.left && item.right)[0];

               // left remains the same
               const left = this.object.definition.source.map(source => source.id)      
               // right is the user response                          
               const right = matcher.right

               const userChoices = right.map(option => {
                    const matchingChoice = this.object.definition.target.find(choice => choice.description[[xapiConfig.language]] === option);
                    return matchingChoice ? matchingChoice.id : null;
               }).filter(id => id !== null); // Filter out nulls

               userResponseString = left.map((choice, index) => {
                    return `${choice}[.]${userChoices[index]}`;
               }).join('[,]');

          }

          result.response = userResponseString

          return result
     }
}

export class Categorizer extends Question {

     constructor(questionIndex, endpoint, item) {
          super(questionIndex, endpoint, item); // Initialize common properties
         
          const widgetsArray = Object.values(item.question.widgets || {});
          const widget = widgetsArray[0];

          // source
          const items = widget.options.items
          // target
          const categories = widget.options.categories

          const source = items.map((item, index) => ({
               id: `source${index + 1}`,
               description: {
                    [xapiConfig.language]: item
               }
          }));
          
          const target = categories.map((category, index) => ({
               id: `target${index + 1}`,
               description: {
                    [xapiConfig.language]: category
               }
          }));

          const values = widget.options.values

          const correctResponsesPattern = items.map((item, index) => {
               return `source${index + 1}[.]target${values[index]}`;
             }).join('[,]');
     
          this.object.definition.interactionType = "matching"
          this.object.definition.source = source;
          this.object.definition.target = target;
          this.object.definition.correctResponsesPattern = [correctResponsesPattern];
          
     }

     /*
     {
          categorizer 1 :{
               0: {
                    values:[
                         0: 1
                         1: 2
                    ]
               }
          }
     }

     */
     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)
          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               const categorizerKey = Object.keys(userResponse)[0];
               const userValues = userResponse[categorizerKey][0].values; // User's selected categories

               userResponseString = userValues.map((userValue, index) => {
                         const target = this.object.definition.target[userValue]
                         const source = this.object.definition.source[index]
                         return `${source.id}[.]${target.id}`
                  }).join("[,]")
          }

          result.response = userResponseString

          return result
     }

}



/*
     Generate all combinations of the given arrays
*/
function generateCombinations(arrays, prefix = []) {
     if (arrays.length === 0) {
       return [prefix];
     }
 
     const [first, ...rest] = arrays;
     const combinations = [];
 
     first.forEach(item => {
       combinations.push(...generateCombinations(rest, [...prefix, item]));
     });
 
     return combinations;
}


function processChoicesWidgetData(widgetData) {

     const choices = widgetData.options.choices.map((option, index) => {
          const id = `choice${index + 1}`;
          return {
               id: id,
               description: {
                    [xapiConfig.language]: option.isNoneOfTheAbove ? "None of the Above" : option.content
               },
               correct: option.correct
          };
     });

     return choices
}



