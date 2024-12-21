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
            'take',
            'make',
            'use',
            'go',
            'come',
            'see',
            'know',
            'get',
            'give',
            'find'
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
            'time',
            'person',
            'year',
            'way',
            'day',
            'thing',
            'man',
            'world',
            'life',
            'hand'
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
            'good',
            'new',
            'first',
            'last',
            'long',
            'great',
            'little',
            'own',
            'other',
            'old'
        ]
    }
];
