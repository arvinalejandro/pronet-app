import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';
import cloudinary from '../lib/cloudinary.js';
import { sendCommentNotificationEmail } from '../emails/emailHandlers.js';

export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: { $in: [...req.user.connections, req.user._id] } })
      .populate('author', 'name username profilePicture headline')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.log('Error in getFeedPosts: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    let newPost;

    if (image) {
      const imgResult = await cloudinary.uploader.upload(image);
      newPost = new Post({
        author: req.user._id,
        content,
        image: imgResult.secure_url,
      });
    } else {
      newPost = new Post({
        author: req.user._id,
        content,
      });
    }
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log('Error in createPost: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (post.image) {
      await cloudinary.uploader.destroy(post.image.split('/').pop().split('.')[0]);
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.log('Error in deletePost: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username profilePicture headline')
      .populate('comments.user', 'name profilePicture username headline');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.log('Error in getPostById: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: { content, user: req.user._id } } },
      { new: true }
    ).populate('author', 'name username profilePicture headline email');

    //create notification if user is not the author of the post
    //console.log(post.author);
    if (post.author._id.toString() !== req.user._id.toString()) {
      const newNotification = new Notification({
        recipient: post.author._id,
        type: 'comment',
        relatedUser: req.user._id,
        relatedPost: postId,
      });

      await newNotification.save();

      try {
        const postUrl = process.env.CLIENT_URL + `/post/${postId}`;
        await sendCommentNotificationEmail(
          post.author.email,
          post.author.name,
          req.user.name,
          postUrl,
          content
        );
      } catch (error) {
        console.log('Error in sendCommentNotificationEmailController: ', error.message);
      }
    }

    res.status(200).json(post);
  } catch (error) {
    console.log('Error in createComment: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);

    if (post.likes.includes(userId)) {
      //unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);

      if (post.author.toString() !== userId.toString()) {
        //create notification if user is not the author of the post
        const newNotification = new Notification({
          recipient: post.author,
          type: 'like',
          relatedUser: userId,
          relatedPost: postId,
        });

        await newNotification.save();
      }
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.log('Error in likePost: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
