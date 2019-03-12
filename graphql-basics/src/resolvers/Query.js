const Query = {
  me() {
    return {
      id: '123098',
      name: 'Indiana',
      email: 'indyJones@berkerley.edu',
    };
  },
  greetings(parent, args, ctx, info) {
    return args.name ? `Hello ${args.name}!` : 'Hello user!';
  },
  add(parent, args, ctx, info) {
    if (!args.numbers.length) return 0;
    return args.numbers.reduce((acc, number) => acc + number, 0);
  },
  users(parent, args, ctx, info) {
    if (!args.query) return ctx.db.users;
    // const regex = new RegExp(args.query, 'ig'); // using string.match regex is not performant https://jsperf.com/casecomparison
    return ctx.db.users.filter(user =>
      user.name.toLowerCase().includes(args.query.toLowerCase())
    );
  },
  post(parent, args, ctx, info) {
    return ctx.db.posts.find(post => post.id === args.id);
  },
  posts(parent, args, ctx, info) {
    if (!args.postQuery) return ctx.db.posts;
    return ctx.db.posts.filter(
      post =>
        post.title.toLowerCase().includes(args.postQuery.toLowerCase()) ||
        post.body.toLowerCase().includes(args.postQuery.toLowerCase())
    );
  },
  comments(parent, args, ctx, info) {
    if (!args.commentQuery) return ctx.db.comments;
    return ctx.db.comments.filter(comment =>
      comment.text.toLowerCase().includes(args.commentQuery.toLowerCase())
    );
  },
};

export default Query;
