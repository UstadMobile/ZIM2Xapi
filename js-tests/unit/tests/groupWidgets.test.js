import { groupWidgets } from '../../../app/src/main/resources/score-tracker.js';

describe('groupWidgets function', () => {
    it('should return an empty array when given no widgets', () => {
        const input = { question: { widgets: {} } };
        const result = groupWidgets(input);
        expect(result).toEqual([]);
    });


    it('should group individual widgets separately', () => {
        const input = {
          question: {
            widgets: {
              widget1: { type: 'orderer' },  // INDIVIDUAL
              widget2: { type: 'radio' }      // INDIVIDUAL
            }
          }
        };
        const result = groupWidgets(input);
        expect(result).toEqual([
          { widgets: [{ ...input.question.widgets.widget1, key: 'widget1' }], type: 'orderer' },
          { widgets: [{ ...input.question.widgets.widget2, key: 'widget2' }], type: 'radio' }
        ]);
      });
    
      it('should handle unsupported widgets and add them to the default group', () => {
        const input = {
          question: {
            widgets: {
              widget1: { type: 'image' },      // UNSUPPORTED
              widget2: { type: 'definition' }, // UNSUPPORTED
              widget3: { type: 'orderer' }     // INDIVIDUAL
            }
          }
        };
        const result = groupWidgets(input);
        expect(result).toEqual([
            {
              type: 'orderer',
              widgets: [
                { ...input.question.widgets.widget3, key: 'widget3' }
              ]
            },
            {
              type: 'default',
              widgets: [
                { ...input.question.widgets.widget1, key: 'widget1' },
                { ...input.question.widgets.widget2, key: 'widget2' }
              ]
            }
          ]);
      });


      it('should correctly handle mixed widget types with groupable widgets grouped only when consecutive', () => {
        const input = {
          question: {
            widgets: {
              widget1: { type: 'input-number' },  // GROUPABLE
              widget2: { type: 'radio' },         // INDIVIDUAL
              widget3: { type: 'input-number' },  // GROUPABLE (non-consecutive, should not be grouped with widget1)
              widget4: { type: 'matcher' },       // INDIVIDUAL
              widget5: { type: 'input-number' },  // GROUPABLE (starts a new group)
              widget6: { type: 'input-number' },  // GROUPABLE (consecutive with widget5)
            }
          }
        };
      
        const result = groupWidgets(input);
        expect(result).toEqual([
          {
            type: 'input-number',
            widgets: [
              { ...input.question.widgets.widget1, key: 'widget1' }
            ]
          },
          {
            type: 'radio',
            widgets: [
              { ...input.question.widgets.widget2, key: 'widget2' }
            ]
          },
          {
            type: 'input-number',
            widgets: [
              { ...input.question.widgets.widget3, key: 'widget3' }
            ]
          },
          {
            type: 'matcher',
            widgets: [
              { ...input.question.widgets.widget4, key: 'widget4' }
            ]
          },
          {
            type: 'input-number',
            widgets: [
              { ...input.question.widgets.widget5, key: 'widget5' },
              { ...input.question.widgets.widget6, key: 'widget6' }
            ]
          }
        ]);
      });

      // Removed support for group widgets until an exercise is found
/*
      it('should process GROUP_WIDGET and group its inner widgets', () => {
        const input = {
          question: {
            widgets: {
              widget1: {
                type: 'graded-group',
                options: {
                  widgets: {
                    innerWidget1: { type: 'radio' },  // INDIVIDUAL
                    innerWidget2: { type: 'input-number' } // GROUPABLE
                  }
                }
              }
            }
          }
        };
        const result = groupWidgets(input);
        expect(result).toEqual([
          {
            widgets: [{ ...input.question.widgets.widget1.options.widgets.innerWidget1, key: 'innerWidget1' }],
            type: 'radio'
          },
          {
            widgets: [{ ...input.question.widgets.widget1.options.widgets.innerWidget2, key: 'innerWidget2' }],
            type: 'input-number'
          }
        ]);
      });

      it('should handle a GROUP_WIDGET containing input-number while having other input-number widgets outside', () => {
        const input = {
          question: {
            widgets: {
              widget1: { type: 'input-number' },    // GROUPABLE
              widget2: { type: 'input-number' },    // GROUPABLE (consecutive)
              widget3: {
                type: 'graded-group',              // GROUP_WIDGET
                options: {
                  widgets: {
                    innerWidget1: { type: 'input-number' }  // GROUPABLE (inside the group)
                  }
                }
              },
              widget4: { type: 'radio' },           // INDIVIDUAL
            }
          }
        };
      
        const result = groupWidgets(input);
        expect(result).toEqual([
          {
            type: 'input-number',                   // Grouping widget1 and widget2 together
            widgets: [
              { ...input.question.widgets.widget1, key: 'widget1' },
              { ...input.question.widgets.widget2, key: 'widget2' }
            ]
          },
          {
            type: 'input-number',                   // The inner input-number widget inside the group is a separate group
            widgets: [
              { ...input.question.widgets.widget3.options.widgets.innerWidget1, key: 'innerWidget1' }
            ]
          },
          {
            type: 'radio',
            widgets: [
              { ...input.question.widgets.widget4, key: 'widget4' }
            ]
          }
        ]);
      });
    */

});