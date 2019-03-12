const Subscription = {
  count: {
    subscribe(parent, args, { pubsub }, info) {
      let count = 0;

      setInterval(() => {
        pubsub.publish('count', {
          count,
        });
        count += 1;
      }, 1000);

      return pubsub.asyncIterator('count');
    },
  },
  comment: {
    subscribe(parent, { postId }, { pubsub, db }, info) {
      // check if the post exist & published
      const foundPost = db.posts.find(
        post => post.id === postId && post.published
      );
      if (!foundPost) {
        throw new Error(
          `Can't find post with id '${postId}' or it isn't published, to subscribe to`
        );
      }
      // create a channel name that is specific to the postId
      return pubsub.asyncIterator(`comment ${postId}`);
    },
  },
  post: {
    subscribe(parent, args, { pubsub }, info) {
      return pubsub.asyncIterator('post');
    },
  },
};

export default Subscription;
