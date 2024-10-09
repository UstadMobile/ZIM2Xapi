/*
    All khan academy widgets and its json structure can be found here
    https://khan.github.io/perseus/?path=/docs/perseus-widgets
*/
import { xapiConfig } from "./score-tracker.js"

const NONE_OF_THE_ABOVE = "None of the Above"

/**
 * Filters the user response to include only relevant keys that match with the widgets.
 *
 * @param {Object} userResponse - The complete user response object.
 * @param {Array} widgets - The list of widgets for which to filter the response.
 * @returns {Object} - The filtered user response object.
 */
function filterUserResponse(userResponse, widgets) {
      return widgets.reduce((acc, widget) => {
        if (userResponse[widget.key]) {
            acc.push(userResponse[widget.key]);
        }
        return acc;
    }, []);
 }

export class Question {
     constructor(id, endpoint, questionContent, widgets) {
          this.widgets = widgets;
          this.object = {
               id: `${endpoint}/question-${id}`,
               objectType: "Activity",
               definition: {
                    name: { [xapiConfig.language]: `Question ${id}` },
                    type: "http://adlnet.gov/expapi/activities/cmi.interaction",
                    description: {[xapiConfig.language]: questionContent }
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
     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties

          const correctResponseString = widgets
               .map(widget => widget.options?.value || options.answers?.[0]?.value)  // Extract value from options if available
               .filter(value => value !== undefined)  // Filter out any undefined values
               .join("[,]");

          this.object.definition.interactionType = "numeric"
          this.object.definition.correctResponsesPattern = [correctResponseString];
     }

     /*
     {
          "input-number 1": {
               "currentValue": "104"
           }   
     }
     */
     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)

          let userResponseString;

          if (success) {
               // If success is true, use the correct response pattern directly
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {

               const filteredResponse = filterUserResponse(userResponse, this.widgets);

               const userValuesArray = filteredResponse.map(item => item.currentValue)

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

     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties

          // indiviual widget would always only have 1 item in the array
          const widget = widgets[0]

          const choices = processChoicesWidgetData(widget.options.options)

          const correctResponseIds = widget.options.correctOptions.map(correctOption => {
               // Find the corresponding choice by matching content
               return getMatchingChoiceIdByContent(correctOption.content, choices, xapiConfig.language)
          })
               // Filter out any null values (in case no match was found) and join the IDs
          .filter(id => id !== null)
          .join("[,]");

          this.object.definition.choices = choices
          this.object.definition.interactionType = "sequencing"
          this.object.definition.correctResponsesPattern = [correctResponseIds];

     }


     /*
     {
     "orderer 1": {
        "current": [
            "![](./bc3ac45347f3556ba8169b59ae452b01/images/5215f28ed641e8658caad9a61bbf3619.png)"
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

               const filteredResponse = filterUserResponse(userResponse, this.widgets);

               userResponseString = filteredResponse.flatMap(item => item.current)
                    .map(response => {
                         // Find the matching choice based on the response content
                         return getMatchingChoiceIdByContent(response, this.object.definition.choices, xapiConfig.language)
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
     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties

          const widget = widgets[0];

          const choices = processChoicesWidgetData(widget.options.choices)

          const correctResponseIds = choices
               .filter(choice => choice.correct) // Filter for correct options
               .map(choice => choice.id) // Map to get the IDs of the correct choices
               .join("[,]")

          this.object.definition.choices = choices.map(({ id, description }) => ({ id, description })); // Remove `correct` key for xAPI
          this.object.definition.interactionType = "choice"
          this.object.definition.correctResponsesPattern = [correctResponseIds];

     }

     /*
     {
          "radio 1": {
               "countChoices": false,
               "choicesSelected": [
                    false,
                    true,
                    false
               ],
               "numCorrect": 1,
               "noneOfTheAboveIndex": null,
               "noneOfTheAboveSelected": false
          }
     }
     */
     generateResult(userResponse, success, duration) {
          let result = super.generateResult(userResponse, success, duration)
          let userResponseString;

          if (success) {
               userResponseString = this.object.definition.correctResponsesPattern[0];
          } else {
               // deconstruct and get the first value of the response
               const [radioResponse] = filterUserResponse(userResponse, this.widgets)

               if (radioResponse.noneOfTheAboveSelected) {
                    const noneOfTheAboveChoice = this.object.definition.choices.find(choice => choice.description[xapiConfig.language] === NONE_OF_THE_ABOVE);
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
     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties

          const widget = widgets[0];
           
          const choices = processChoicesWidgetData(widget.options.choices)

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
               const [dropDownResponse] = filterUserResponse(userResponse, this.widgets)

               const selectedIndex = dropDownResponse.value - 1; // Adjust to 0-based index for the array
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
     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties

          const widget = widgets[0];


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

               const [sorterResponse] = filterUserResponse(userResponse, this.widgets)
               const sorterOptions = sorterResponse.options

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
     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties

          // Get all the correct answers for each widget
          const correctAnswersByWidget = widgets
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

          const userResponseString =  filterUserResponse(userResponse, this.widgets)
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
     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties

          const widget = widgets[0];

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
               const [matcherResponse] = filterUserResponse(userResponse, this.widgets)
               // left remains the same
               const left = this.object.definition.source.map(source => source.id)      
               // right is the user response                          
               const right = matcherResponse.right

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

     constructor(questionIndex, endpoint, questionContent, widgets) {
          super(questionIndex, endpoint, questionContent, widgets); // Initialize common properties
         
          const widget = widgets[0];

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
               const [response] = filterUserResponse(userResponse, this.widgets)
               const userValues = response.values; // User's selected categories

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


function processChoicesWidgetData(choicesList) {

     const choices = choicesList.map((option, index) => {
          const id = `choice${index + 1}`;
          return {
               id: id,
               description: {
                    [xapiConfig.language]: option.isNoneOfTheAbove ? NONE_OF_THE_ABOVE : option.content
               },
               correct: option.correct
          };
     });

     return choices
}

/**
 * Matches the content to the corresponding choice in the choices list.
 *
 * @param {String} content - The content to be matched.
 * @param {Array} choices - The list of choices to search in.
 * @param {String} language - The language key used for matching.
 * @returns {String|null} - Returns the ID of the matching choice, or null if no match is found.
 */
function getMatchingChoiceIdByContent(content, choices, language) {
     const matchingChoice = choices.find(choice => {
         const choiceDescription = choice.description[language] || Object.values(choice.description)[0];
         return choiceDescription === content;
     });
 
     return matchingChoice?.id ?? null
 }


