# Setting up your first GraphQL server

###Introduction
This article is first in the new tutorial series on GraphQL. In this series, we will do a walkthrough of key GraphQL concepts one by one. I have tried to keep every lesson short and simple so that you can work on it whenever you have some free time. By the end of this tutorial series, you will learn about: 

1. GraphQL queries and mutations,

2. schema and types system, and

3. the best practices for using GraphQL in your projects.

In this first tutorial, we will begin with creating a GraphQL server using an open-source GraphQL editor called GraphIQL. Following that, we will create a simple GraphQL schema similar to Github's user object. We will also learn about `query arguments` and `aliases` and their applications.

Let us begin with a brief introduction about GraphQL:

[GraphQL][gql] is an appliction layer query language by Facebook. With GraphQL, you can define your backend as a graph-based schema. The clients can get predicatable results by quering your dataset for exactly what they need.

To demonstrate this, let us quickly set up a simple GraphhQL server on top of Github user API. We will be using [reference implementation of GraphQL][gqljs] in Javascript. All of the code covered in this tutorial is available [here][repo].

### Setting up a server
First, we will setup an HTTP server to receive graphql queries. I am using [Express][express] here since graphql provides a pluggable [middleware for express][gqlexpress] applications to easily create a graphql server.

To get started, create a new node project, or clone this repository:

```
git clone https://github.com/adhbh/ewa-graphql.git
```

We will start by installing graphql, express and graphql-express. In the ewa-graphql folder, run:
```
npm install --save express graphql express-graphql
```

Since we will be using ES6 (or ES2015) to make development easier, we will require `babel` to transpile our code:
```
npm install -g babel-cli
npm install --save-dev babel-cli babel-preset-es2015
```

Let us use `express` to create an HTTP server that listens to port `7600`. In ewa-graphql folder, create a new file named `server.js` with contents:

```
import express from 'express'
const app = express()
app.listen(7600)
```

We can now added a `start` script in `package.json` file which will transpile the code using babel and start the express server:

```
"scripts": {
    "start": "babel-node --presets es2015 server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
}
``` 

We will now import `express-graphql` and add it as a middleware to our express app:
```
import express from 'express'
import graphQLHTTP from 'express-graphql'
const app = express();

app.use(graphQLHTTP({
    graphiql: true,
}))

app.listen(7600);
```

You might be wondering what is `graphiql` and why it is set to `true`. GraphIQL (pronounced graphical) is an in-browser IDE for exploring GraphQL. It has built-in support for documentation and autocompletion. You'll be using it throughout this course. 

To see how it looks, try running `npm start` and open `http://localhost:7600` in your browser. You must see an error like this:

```
{
    errors: [
        {
            message: "GraphQL middleware options must contain a schema."
        }
    ]
}
```

For executing GraphQL quries using `grpahiql`, we need to define a `schema`. We should know about the GraphQL type system and how it describes what data can be queried. In the next section, we will define a schema for Github's user object. For now, for sake of seeing the Graphiql interface, let us create a new file `schema.js` with contents: 

```
import { GraphQLObjectType, GraphQLString }

export default new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            hello: {
                type: GraphQLString,
                resolve: (root, args) => 'world'
            }
        }
    }),
})
```

and then import the schema in the graphql server:

```
import express from 'express';
import graphQLHTTP from 'express-graphql';

import schema from './schema.js'

const app = express();

app.use(graphQLHTTP({
    schema,
    graphiql: true,
}));

app.listen(7600);
```

What we have created is a "hello world" for GraphQL applications. To see it the `GraphIQL` IDE, run `npm start` and go to `http://localhost:7600`. Now it is time that we run our first graphql query!

Paste the following in GraphIQL editor 

```
{
  hello
}
```
and then click on the 'play' button on top left corner next to the GraphIQL logo. The server should repsonse with the following data:

```
{
  "data": {
    "hello": "world"
  }
}
```

We will now learn how to define a schema for any dataset.

### Defining a GraphQL schema
GraphQL query language is basically about selecting fields on objects.
For example:
```
{
  user (login: "tj") {
    name
    about
  }
}
```
1. We start with the default 'root' object
2. We select user field on that, with an argument `login: "tj"`
3. From the object returned by `user` we select `name` and `about` fields

Every GraphQL service defines a schema which completely describes the set of possible data you can query on that service. When the query comes in, the query is validated and executed against this schema.

Let us analyse Github's user API. The json returned by `https://api.github.com/users/tj` is 
```
{
    login: "tj",
    id: 25254,
    avatar_url: "https://avatars.githubusercontent.com/u/25254?v=3",
    gravatar_id: "",
    url: "https://api.github.com/users/tj",
    html_url: "https://github.com/tj",
    followers_url: "https://api.github.com/users/tj/followers",
    following_url: "https://api.github.com/users/tj/following{/other_user}",
    gists_url: "https://api.github.com/users/tj/gists{/gist_id}",
    starred_url: "https://api.github.com/users/tj/starred{/owner}{/repo}",
    subscriptions_url: "https://api.github.com/users/tj/subscriptions",
    organizations_url: "https://api.github.com/users/tj/orgs",
    repos_url: "https://api.github.com/users/tj/repos",
    events_url: "https://api.github.com/users/tj/events{/privacy}",
    received_events_url: "https://api.github.com/users/tj/received_events",
    type: "User",
    site_admin: false,
    name: "TJ Holowaychuk",
    company: "Apex",
    blog: "http://tjholowaychuk.com",
    location: "Victoria, BC, Canada",
    email: "tj@vision-media.ca",
    hireable: null,
    bio: "Founder of Apex https://apex.sh @tjholowaychuk on Twitter & Medium.",
    public_repos: 243,
    public_gists: 530,
    followers: 24012,
    following: 165,
    created_at: "2008-09-18T22:37:28Z",
    updated_at: "2016-10-26T08:32:24Z"
}
```

It is intutive to note that few of the fields like `name` and `email` are of type `String`, few fields like `following` and `followers` are `Integers`, while `site_admin` is a `Boolean`.

We will only consider some fields from this json, and create our user object using GraphQL.

Any new object can be created using `GraphQLObjectType` like below:
```
const UserType = new GraphQLObjectType({
    name: 'UserType',
    description: '...',
    fields: {},
})
```

It is important to note that the `name` for any two GraphQL objects in a schema sould not be same. Let's add some fields to this object:

```
const UserType = new GraphQLObjectType({
    name: 'UserType',
    description: '...',
    fields: {
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        about: { type: GraphQLString },
        following: { type: GraphQLInt },
        followers: { type: GraphQLInt },
    },
})
```

We will now create the special Query object which is the `root` of our graphql schema. The `root` will contain a `user` field which should be of type `UserType`.

```
const QueryType = new GraphQLObjectType({
    name: 'Query',
    description: '...',
    fields: {
        user: {
            type: UserType,
        },
    },
})

export default new GraphQLSchema({
    query: QueryType,
});
```

Note that in our query, we also need to pass the `login` argument so that GraphQL server knows what are the exact details to fetch.

Hence, we add `args` to the the user:
```
const QueryType = new GraphQLObjectType({
    name: 'Query',
    description: '...',
    fields: {
        user: {
            type: UserType,
            args: {
                login: { type: GraphQLString }
            },
            resolve: (root, args) => ({
                login: args.login,
                name: "Adheesh",
                email: "adheeshbhatia@gmail.com",
                bio: "Loves Graphql",
                following: 123,
                followers: 34,
            })
        },
    },
})
```
There are 2 things to note here:
1. The query arguments can only be of type scalar, enum or a list of scalars or enums.

2. When we write the GraphQL schema, we will also have to provide the resolve method which will be invoked by the GraphQL execution engine when data are actually queried. 

That means, when `user` field is queried from `QueryType`, it will first execute the resolve method on the `user` field, and the data returned is an instance of `UserType` object.

Also, 
1. The first parameter of resolve function is the data returned from the parent object (in the above case, parent object is the default object called `root`).

2. The second parameter are the `arguments` for that particular field. (In this case: `{ login: 'xyz' }` )

The third argument is context about which you will learn in upcoming tutorials.

We can use `resolve` to transform the data as we require. We will now demonstrate this in `UserType` object.
```
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
```
Here, we are telling the GraphQL server that if `about` field is asked for in the user object, you should look for `user['bio']` and not `user['about']`.


### Using a real datasource

At this point, we have a well-defined GraphQL schema. Now we should make it fetch real data from Github API. We will use [node-fetch][nf] to talk with Github API

```
npm install --save node-fetch
```

Interestingly, the GraphQL `resolve` methods can either return a value or a `Promise`. Which means that in `QueryType` object we can easily change the resolve method to return a promise to fetch github user:

```
const QueryType = new GraphQLObjectType({
    name: 'Query',
    description: '...',
    fields: {
        user: {
            type: UserType,
            args: {
                login: { type: GraphQLString }
            },
            resolve: (root, args) => fetch(`https://api.github.com/users/`+args.login)
                    .then(res => res.json())
        },
    },
})
```

At this point, our schema.js file looks like this:
```
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
})

```

To run and see it working, run `npm start` and open 'http://localhost:7600'. Run the query:
```
{
  user(login: "tj") {
    name
    email
    about
    following
    followers
  }
}
```

Image 2 here

### Query alias
As the name suggests, alias lets you rename the result of a field to anything you want.

Try running the following query in `GraphIQL` :
```
{
  user(login: "tj") {
    emailId: email
  }
}
```

This can be useful when we want to get two or more results in one request.

For example: 
```
{
  user1: user(login: "adhbh") {
    name
  }
  user2: user(login: "tj") {
    name
    email
  }
}
```

### What's next?
In this tutorial, we have created a GraphQL server for us using a real datasource. We will use this in the upcoming tutorials to learn about concepts like mutations, fragments, query variables and several advanced GraphQL types like interfaces and unions.

In the next tutorial, we will see how GraphQL can be used to get many resources in a single request. While typical REST APIs require loading from multiple URLs, GraphQL APIs get all the data your app needs with a single endpoint. We will also see how [dataloader][dataloader] can be used with GraphQL for caching and batching requests.

[gqljs]: <https://github.com/graphql/graphql-js>
[gql]: <http://graphql.org/>
[repo]: <https://github.com/adhbh/ewa-graphql>
[express]: <https://www.npmjs.com/package/express>
[dataloader]: <https://github.com/facebook/dataloader>
[gqlexpress]:<https://github.com/graphql/express-graphql>
[nf]:<https://www.npmjs.com/package/node-fetch>