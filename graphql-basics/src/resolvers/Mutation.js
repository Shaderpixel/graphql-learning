import uuidV4 from 'uuid/v4';

const Mutation = {
  createUser(parent, args, ctx, info) {
    const emailTaken = ctx.db.users.some(
      user => user.email === args.data.email
    ); // we don't use find because all we need is just a boolean not the found value
    if (emailTaken) {
      throw new Error('Email taken.');
    }
    ctx.db.users.push({ id: uuidV4(), ...args.data });
    return ctx.db.users[ctx.db.users.length - 1];
  },
  deleteUser(parent, args, ctx, info) {
    const userIndex = ctx.db.users.findIndex(user => user.id === args.id);
    if (userIndex === -1) {
      throw new Error(
        `Delete user: Can't find user with associated id of ${args.id}`
      );
    }

    // we could use filter array to filter out the id but since we already have the userIndex..
    // splice is 0.17% faster but mutates users
    // splice returns the removed item
    const [deletedUser] = ctx.db.users.splice(userIndex, 1);

    // remove posts by deleted user
    ctx.db.posts = ctx.db.posts.filter(post => {
      const match = post.author === args.id;

      // we need to delete all comments in that post
      if (match)
        ctx.db.comments = ctx.db.comments.filter(
          comment => comment.post !== post.id
        );

      return !match;
    });

    // remove comments made by deleted user
    ctx.db.comments = ctx.db.comments.filter(
      comment => comment.author !== args.id
    );

    // return deleted user object as specified in type def
    return deletedUser;
  },
  updateUser(parent, args, { db }, info) {
    const { id, data } = args;
    // look for user
    const foundUser = db.users.find(user => user.id === id);
    if (!foundUser)
      throw new Error(`Update user: can't find user with ${id} to update`);

    // check if email has been provided
    if (typeof data.email === 'string') {
      // check to see if email is already taken
      const emailTaken = db.users.some(user => user.email === data.email);
      if (emailTaken) throw new Error('Email has been taken');
      foundUser.email = data.email;
    }

    // check if name has been provided
    if (typeof data.name === 'string') foundUser.name = data.name;

    // check if age is set to undefine. We want to allow null so that it can be cleared
    // Number(null) = 0 while Number(undefined) becomes NaN
    if (!isNaN(Number(data.age))) {
      foundUser.age = data.age;
    }

    return foundUser;
  },
  createPost(parent, args, { db, pubsub }, info) {
    const userExist = db.users.some(user => user.id === args.data.author);
    if (!userExist) {
      throw new Error('Cannot find existing user to create post for');
    }
    const newPost = { id: uuidV4(), ...args.data };
    db.posts.push(newPost);
    // publish an event to the listening channel
    newPost.published &&
      pubsub.publish('post', {
        post: { mutation: 'CREATED', data: newPost },
      });

    return newPost;
  },
  updatePost(parent, args, { db, pubsub }, info) {
    const { id, data } = args;
    // findIndex method
    const foundPostIndex = db.posts.findIndex(post => post.id === id);
    if (foundPostIndex === -1)
      throw new Error(`No matching post to update for id ${id}`);
    const originalPost = db.posts[foundPostIndex];
    const updatedPost = { ...originalPost, ...data };
    db.posts[foundPostIndex] = updatedPost;

    if (typeof data.published === 'boolean') {
      // we check to make sure that the data.published is provided and is indeed a boolean value and not a undefined or null
      if (originalPost.published && !updatedPost.published) {
        pubsub.publish('post', {
          post: { mutation: 'DELETED', data: originalPost }, // if post is being unpublished, don't return the new post information to subscribers
        });
      } else if (!originalPost.published && updatedPost.published) {
        pubsub.publish('post', {
          post: { mutation: 'CREATED', data: updatedPost },
        });
      } else if (originalPost.published && updatedPost.published) {
        // published is unintentionally included
        pubsub.publish('post', {
          post: { mutation: 'UPDATED', data: updatedPost },
        });
      }
    } else if (updatedPost.published) {
      // check to makesure that the updated post is published before publishing the event
      pubsub.publish('post', {
        post: { mutation: 'UPDATED', data: updatedPost },
      });
    }

    // find method
    // const foundPost = db.posts.find(post => post.id === id);
    // if (!foundPost) throw new Error('Post not found');
    // // foundPost = { ...db.posts[foundPostIndex], ...data } will not work because we are reassigning found post to a new object and no longer updating the found entry!!!
    // if (typeof data.title === 'string') foundPost.title = data.title;
    // if (typeof data.body === 'string') foundPost.body = data.body;
    // if (typeof data.published === 'boolean') foundPost.published = data.published;

    return updatedPost;
  },
  deletePost(parent, args, { db, pubsub }, info) {
    const postIndex = db.posts.findIndex(post => post.id === args.id);
    if (postIndex === -1) {
      throw new Error('Delete Post: No matching posts found');
    }
    const [deletedPost] = db.posts.splice(postIndex, 1);
    db.comments = db.comments.filter(comment => comment.post !== args.id);

    deletedPost.published &&
      pubsub.publish('post', {
        post: { mutation: 'DELETED', data: deletedPost },
      });
    return deletedPost;
  },
  createComment(parent, args, { db, pubsub }, info) {
    const userExist = db.users.some(user => user.id === args.data.author);
    const postExist = db.posts.some(
      post => post.id === args.data.post && post.published
    );

    if (!userExist) {
      throw new Error('Cannot find existing user to create comment for');
    }

    if (!postExist)
      throw new Error(
        'Cannot find existing post to create comment for or post is not published'
      );

    const newComment = { id: uuidV4(), ...args.data };
    db.comments.push(newComment);

    pubsub.publish(`comment ${args.data.post}`, {
      comment: { mutation: 'CREATED', data: newComment },
    });
    return newComment;
  },
  updateComment(parent, args, { db, pubsub }, info) {
    const { id, data } = args;
    const foundComment = db.comments.find(comment => comment.id === id);

    if (!foundComment)
      throw new Error(`Cannot find matching comment to update for id: ${id}`);

    if (typeof data.text === 'string') foundComment.text = data.text;

    pubsub.publish(`comment ${foundComment.post}`, {
      comment: { mutation: 'UPDATED', data: foundComment },
    });
    return foundComment;
  },
  deleteComment(parent, args, { db, pubsub }, info) {
    const commentIndex = db.comments.findIndex(
      comment => comment.id === args.id
    );
    if (commentIndex === -1)
      throw new Error('Delete Comment: No matching comment found');

    // delete the comment
    const [deletedComment] = db.comments.splice(commentIndex, 1);

    pubsub.publish(`comment ${deletedComment.post}`, {
      comment: { mutation: 'DELETED', data: deletedComment },
    });
    return deletedComment;
  },
};

export default Mutation;
