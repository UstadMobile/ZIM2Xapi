import { processGroupedWidgets } from '../../../app/src/main/resources/score-tracker.js';


describe('processGroupedWidgets function', () => {


    it('should return an empty array for empty groupedWidgets input', () => {
        const groupedWidgets = [];
        const questionIndex = 0;
    
        const result = processGroupedWidgets(groupedWidgets, questionIndex);
    
        expect(result).toEqual([]);
      });

      
      it('should return a single statement for one non-default group', () => {
        const groupedWidgets = [
          {
            type: 'input-number',
            widgets: [
              { key: 'widget1', type: 'input-number' }
            ]
          }
        ];
        const questionIndex = 1;
    
        const result = processGroupedWidgets(groupedWidgets, questionIndex);
    
        expect(result).toEqual([
          {
            id: `${questionIndex + 1}`,  // Ensure correct ID format
            group: groupedWidgets[0],
            contextActivityIds: null
          }
        ]);
      });


      it('should return statements for multiple non-default groups', () => {
        const groupedWidgets = [
          {
            type: 'input-number',
            widgets: [
              { key: 'widget1', type: 'input-number' }
            ]
          },
          {
            type: 'radio',
            widgets: [
              { key: 'widget2', type: 'radio' }
            ]
          }
        ];
        const questionIndex = 2;
    
        const result = processGroupedWidgets(groupedWidgets, questionIndex);
    
        const actualIndex = questionIndex + 1
        expect(result).toEqual([
          {
            id: `${actualIndex}a`,
            group: groupedWidgets[0],
            contextActivityIds: [`${actualIndex}a`, `${actualIndex}b`]
          },
          {
            id: `${actualIndex}b`,
            group: groupedWidgets[1],
            contextActivityIds: [`${actualIndex}a`, `${actualIndex}b`]
          }
        ]);
      });

      it('should filter out default widgets and generate statements for non-default widgets', () => {
        const groupedWidgets = [
          {
            type: 'default',
            widgets: [
              { key: 'widget1', type: 'image' }
            ]
          },
          {
            type: 'input-number',
            widgets: [
              { key: 'widget2', type: 'input-number' }
            ]
          }
        ];
        const questionIndex = 3;
    
        const result = processGroupedWidgets(groupedWidgets, questionIndex);
    
        expect(result).toEqual([
          {
            id: `${questionIndex + 1}`,
            group: groupedWidgets[1],
            contextActivityIds: null
          }
        ]);
      });

    
it('should handle all default widgets and return a single statement', () => {
    const groupedWidgets = [
      {
        type: 'default',
        widgets: [
          { key: 'widget1', type: 'image' }
        ]
      },
      {
        type: 'default',
        widgets: [
          { key: 'widget2', type: 'video' }
        ]
      }
    ];
    const questionIndex = 4;

    const result = processGroupedWidgets(groupedWidgets, questionIndex);

    // Expected: One single statement for all default widgets
    expect(result).toEqual([
      {
        id: `${questionIndex + 1}`,
        group: {
          type: 'default',
          widgets: [
            ...groupedWidgets[0].widgets,
          ]
        },
        contextActivityIds: null
      }
    ]);
  });

});