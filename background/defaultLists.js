// background/defaultLists.js

export const defaultLists = [
    {
        id: 'list_common_verbs',
        name: '常用动词',
        enabled: true,
        matchRules: { ignoreCase: true },
        highlightStyle: { 
            color: '#ffffff', 
            backgroundColor: '#007ACC',
            fontWeight: 'bold',
            textDecoration: 'none'
        },
        words: [
            { word: 'take', comment: '' },
            { word: 'make', comment: '' },
            { word: 'use', comment: '' },
            { word: 'go', comment: '' },
            { word: 'come', comment: '' },
            { word: 'see', comment: '' },
            { word: 'know', comment: '' },
            { word: 'get', comment: '' },
            { word: 'give', comment: '' },
            { word: 'find', comment: '' }
        ]
    },
    {
        id: 'list_common_nouns',
        name: '常用名词',
        enabled: true,
        matchRules: { ignoreCase: true },
        highlightStyle: { 
            color: '#ffffff', 
            backgroundColor: '#28a745',
            fontWeight: 'bold',
            textDecoration: 'none'
        },
        words: [
            { word: 'time', comment: '' },
            { word: 'person', comment: '' },
            { word: 'year', comment: '' },
            { word: 'way', comment: '' },
            { word: 'day', comment: '' },
            { word: 'thing', comment: '' },
            { word: 'man', comment: '' },
            { word: 'world', comment: '' },
            { word: 'life', comment: '' },
            { word: 'hand', comment: '' }
        ]
    },
    {
        id: 'list_common_adjectives',
        name: '常用形容词',
        enabled: true,
        matchRules: { ignoreCase: true },
        highlightStyle: { 
            color: '#ffffff', 
            backgroundColor: '#dc3545',
            fontWeight: 'bold',
            textDecoration: 'none'
        },
        words: [
            { word: 'good', comment: '' },
            { word: 'new', comment: '' },
            { word: 'first', comment: '' },
            { word: 'last', comment: '' },
            { word: 'long', comment: '' },
            { word: 'great', comment: '' },
            { word: 'little', comment: '' },
            { word: 'own', comment: '' },
            { word: 'other', comment: '' },
            { word: 'old', comment: '' }
        ]
    }
];
