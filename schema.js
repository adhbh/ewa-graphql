import {
	GraphQLInt,
	GraphQLBoolean,
	GraphQLID,
	GraphQLNonNull,
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
	GraphQLList
} from 'graphql'

import fetch from 'node-fetch'

const UserType = new GraphQLObjectType({
    name: 'UserType',
    description: '...',
    fields: {
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        about: {
            type: GraphQLString,
            resolve: (user) => {
                return user.bio
            }
        },
        following: { type: GraphQLInt },
        followers: { type: GraphQLInt },
    },
})

const QueryType = new GraphQLObjectType({
    name: 'Query',
    description: '...',
    fields: {
        user: {
            type: UserType,
            args: {
                login: { type: GraphQLString }
            },
            resolve: (root, args) => fetch('https://api.github.com/users/' + args.login)
                    .then(res => res.json())
        },
    },
})

export default new GraphQLSchema({
	query: QueryType,
});