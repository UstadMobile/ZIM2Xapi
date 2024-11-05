export const ACTOR = {
    name: ["Project Tin Can"],
    mbox: "mailto:tincan@scorm.com"
  };
  
  export const ENDPOINT = 'https://dummy-endpoint.com/lrs/';
  export const AUTH = 'dummyAuthToken';
  
  export const VERBS = {
    ATTEMPTED: {
      id: "http://adlnet.gov/expapi/verbs/attempted",
      display: { "en": "attempted" }
    },
    COMPLETED: {
      id: "http://adlnet.gov/expapi/verbs/completed",
      display: { "en": "completed" }
    },
    ANSWERED: {
      id: "http://adlnet.gov/expapi/verbs/answered",
      display: { "en": "answered" }
    }
};


export const QuestionType = {
  INPUT: 'input-number',
  DRAG_AND_DROP: 'drag_and_drop',
  RADIO: 'radio'
};