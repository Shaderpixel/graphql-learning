// demo user data
const users = [
  {
    id: '1',
    name: 'Andrew',
    email: 'andrew@hello.com',
  },
  {
    id: '2',
    name: 'Richard',
    email: 'rich@hello.com',
  },
  {
    id: '3',
    name: 'Hollis',
    email: 'hollis@hello.com',
    age: 30,
  },
];

// demo posts data
const posts = [
  {
    id: '1',
    title: 'My First Post',
    body: 'Lorem Ipsum',
    published: false,
    author: '1',
  },
  {
    id: '2',
    title: 'My Second Post',
    body: 'Lorem Ipsum',
    published: true,
    author: '1',
  },
  {
    id: '3',
    title: 'My Third Post',
    body: 'Lorem Ipsum',
    published: true,
    author: '3',
  },
];

// demo comments data
const comments = [
  {
    id: 'abc',
    text: 'Firsst...',
    author: '1',
    post: '2',
  },
  {
    id: 'def',
    text: 'Cool comment',
    author: '2',
    post: '3',
  },
  {
    id: 'ghi',
    text: 'Cool project brah',
    author: '3',
    post: '1',
  },
  {
    id: 'jkl',
    text: 'I am going to make that pie!',
    author: '3',
    post: '2',
  },
];

const db = {
  users,
  posts,
  comments,
};

export default db;
