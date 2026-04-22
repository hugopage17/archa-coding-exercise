export default {
    expenseApi: {
        input: '../django-api/schema.yaml',
        output: {
            mode: 'tags-split',
            target: 'src/api/generated',
            client: 'react-query',
            baseUrl: '/api',
        },
    },
}