const express = require('express');
const router = express.Router();
const Post = require('./../database/schemas/Post');
const User = require('./../database/schemas/User');
const Topic = require('./../database/schemas/Topic');
const Like = require('./../database/schemas/Like');
const checkAuthenticated = require('./../auth/checkAuthenticated');
const getUserData = require('./../utils/getUserData.js');

router.post('/', async (req, res) => {

    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {

        let post = new Post();

        // Title, description, markdown assignment
        post.title = req.body.title;
        post.description = req.body.description;
        post.markdown = req.body.markdown;

        if (!req.body.topicName) return res.status(406).json({ "error": "Missing topic" });
        if (!post.title) return res.status(406).json({ "error": "Missing title" });
        if (!post.description) return res.status(406).json({ "error": "Missing description" });
        if (!post.markdown) return res.status(406).json({ "error": "Missing markdown" });

        // Topic assignment
        let topicWithSameName = await Topic.find({ "name": (req.body.topicName).toLowerCase() }).catch(err => {
            return res.status(500).json({ "error": err });
        });

        if (topicWithSameName.length == 0) {
            let topic = new Topic();
            topic.name = (req.body.topicName).toLowerCase();
            post.topic.id = topic._id;
            post.topic.name = topic.name;
            await topic.save().catch(err => {
                return res.status(500).json({ "error": err });
            });;
        } else {
            post.topic.id = topicWithSameName[0]._id;
            post.topic.name = topicWithSameName[0].name;
        }

        // Author assignment
        post.author.id = authResult.user._id;
        post.author.username = authResult.user.username;

        // Date assignment
        post.createdAt = new Date();

        await post.save().then(result => {
            return res.status(201).json({ "id": post._id });
        }).catch(err => {
            return res.status(500).json({ "error": err });
        });

    } else {
        return res.sendStatus(401);
    }
});



router.get('/', async (req, res) => {

    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    let query = { "removed": false };

    if (req.query.topic) {
        query = { "topic.name": req.query.topic, "removed": false }
    }

    let posts = [];

    const count = await Post.count(query);

    await Post.find(query).sort({ createdAt: -1 })
        .limit(req.query.limit * 1)
        .skip((req.query.page - 1) * req.query.limit)
        .exec()
        .then(result => {
            result.forEach(post => {
                if (!post.removed) {
                    posts.push({
                        "author": post.author,
                        "topic": post.topic,
                        "_id": post._id,
                        "createdAt": post.createdAt,
                        "lastEdit": post.lastEdit,
                        "likes": post.likes,
                        "title": post.title,
                        "description": post.description
                    });
                }
            });
        }).catch(err => {
            return res.status(500).json({ "error": err });
        });

    if (authResult.isAuthenticated) {
        for (let i = 0; i < posts.length; i++) {
            posts[i].userData = await getUserData(posts[i]._id, authResult.user._id);
        }
    }

    return res.status(200).json({
        posts,
        totalPages: Math.ceil(count / req.query.limit)
    });
});

router.get('/:id', async (req, res) => {
    let post;
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    await Post.findOne({ _id: req.params.id }).then(result => {
        if (!result.removed) {
            post = result;
        } else {
            return res.sendStatus(404);
        }
    }).catch(err => res.status(404).json({ "error": err }));

    if (authResult.isAuthenticated && post) {
        post.userData = await getUserData(post._id, authResult.user._id);
    }

    return res.status(200).json(post);
});

router.patch('/:id', async (req, res) => {

    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let selectedPost = await Post.findOne({ _id: req.params.id, "author.id": authResult.user._id });

        if (selectedPost) {

            // Title, description, markdown assignment
            selectedPost.title = req.body.title;
            selectedPost.description = req.body.description;
            selectedPost.markdown = req.body.markdown;

            selectedPost.lastEdit = new Date();
            await selectedPost.save().then(result => {
                return res.status(200).json({ "id": selectedPost._id });
            }).catch(err => {
                return res.status(500).json({ "error": err });
            });
        } else {
            return res.sendStatus(404);
        }

    } else {
        return res.sendStatus(401);
    }

});

router.delete('/:id', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let selectedPost = await Post.findOne({ _id: req.params.id, "author.id": authResult.user._id });

        if (selectedPost) {
            selectedPost.removed = true;
            await selectedPost.save().catch(err => res.status(500).json({ "deleted": false }));
            return res.status(200).json({ "deleted": true });
        } else {
            return res.sendStatus(404);
        }
    } else {
        return res.sendStatus(401);
    }
});



router.post('/:id/likes', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let post = await Post.findOne({ _id: req.params.id });
        if (!post) return res.sendStatus(404);

        let user = authResult.user;

        let like = await Like.findOne({ postId: req.params.id, userId: user._id });

        if (!like) {
            let newLike = new Like();
            newLike.postId = post._id;
            newLike.userId = user._id;
            newLike = await newLike.save().catch(err => console.log(err));
            post.likes++;
            post = await post.save().catch(err => console.log(err));
            return res.sendStatus(201);
        } else {
            return res.sendStatus(406);
        }
    } else {
        return res.sendStatus(401);
    }

});

router.delete('/:id/likes', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let post = await Post.findOne({ _id: req.params.id });
        if (!post) return res.sendStatus(404);

        let user = authResult.user;

        let like = await Like.findOne({ postId: req.params.id, userId: user._id });

        if (like) {
            await Like.findOneAndDelete({ postId: req.params.id, userId: authResult.user._id });
            post.likes--;
            post = await post.save();
            return res.sendStatus(200);
        } else {
            return res.sendStatus(404);
        }

    } else {
        return res.sendStatus(401);
    }

});




module.exports = router;