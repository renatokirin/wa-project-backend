const express = require('express');
const router = express.Router();
const User = require('./../database/schemas/User');
const Post = require('./../database/schemas/Post');
const Follower = require('./../database/schemas/Follower');
const checkAuthenticated = require('./../auth/checkAuthenticated');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require("fs");
const getUserData = require('./../utils/getUserData.js');

function allowedCharacters(str) {
    return Boolean(str.match(/^[A-Za-z0-9]*$/));
}


router.post('/auth/signUp', async (req, res) => {

    if (!(allowedCharacters(req.body.username))) {
        return res.status(406).json({ "error": "forbidden characters in username" });
    }

    let userWithSameEmail = await User.findOne({ email: req.body.email.toLowerCase() });
    let userWithSameUsername = await User.findOne({ username: req.body.username.toLowerCase() });

    if (!(userWithSameEmail || userWithSameUsername)) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        let user = new User();
        user.username = req.body.username.toLowerCase();
        user.email = req.body.email.toLowerCase();
        user.password = hashedPassword;

        await user.save().then(result => {
            return res.status(201).json({ "username": user.username, "email": user.email });
        }).catch(err => {
            return res.status(500).json({ "error": err });
        });
    }

    // 406 Not Acceptable
    if (userWithSameEmail) {
        return res.status(406).json({ "alreadyExists": "email" });
    }
    if (userWithSameUsername) {
        return res.status(406).json({ "alreadyExists": "username" });
    }
});


router.patch('/auth/signIn', async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ "authenticated": false });

    if (await bcrypt.compare(req.body.password, user.password)) {
        user.authToken = uuidv4();

        await user.save().then(result => {
            return res
                .cookie("token", user.authToken)
                .cookie("email", user.email)
                .cookie("username", user.username)
                .cookie("id", user._id)
                .status(200).json({ "authenticated": true });
        }).catch(err => {
            return res.status(500).json({ "authenticated": false, "error": err });
        });
    } else {
        // 401 Unauthorized
        return res.status(401).json({ "authenticated": false });
    }
});


router.patch('/auth/signOut', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let user = authResult.user;
        user.authToken = uuidv4();
        await user.save();
    }

    return res
        .clearCookie('token', {
            domain: 'localhost',
            path: '/'
        })
        .clearCookie('email', {
            domain: 'localhost',
            path: '/'
        })
        .clearCookie('username', {
            domain: 'localhost',
            path: '/'
        })
        .clearCookie('id', {
            domain: 'localhost',
            path: '/'
        })
        .sendStatus(200);
});

router.get('/bookmarks', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let bookmarkedPosts = [];
        let ids = authResult.user.bookmarks;
        await Post.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).then(result => {
            result.forEach(post => {
                if (!post.removed) {
                    bookmarkedPosts.push({
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
        });;

        for (let i = 0; i < bookmarkedPosts.length; i++) {
            bookmarkedPosts[i].userData = await getUserData(bookmarkedPosts[i]._id, authResult.user._id);
        }

        return res.status(200).json(bookmarkedPosts);
    } else {
        return res.sendStatus(401);
    }
});

router.post('/bookmarks/:postId', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let bookmarked = await User.findOne({
            _id: authResult.user._id,
            bookmarks: req.params.postId
        });

        if (!bookmarked) {
            let user = authResult.user;
            user.bookmarks.push(req.params.postId);
            await user.save().then(result => { return res.sendStatus(201) })
                .catch(err => { return res.status(500).json({ "error": err }) });
        } else {
            return res.sendStatus(406);
        }
    }
});

router.delete('/bookmarks/:postId', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let bookmarked = await User.findOne({
            _id: authResult.user._id,
            bookmarks: req.params.postId
        });

        if (bookmarked) {
            let user = authResult.user;
            user.bookmarks.pull(req.params.postId);
            await user.save().then(result => { return res.sendStatus(200) })
                .catch(err => { return res.status(500).json({ "error": err }) });
        } else {
            return res.sendStatus(404);
        }
    }
});


router.post('/follows/:userId', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let followed = await Follower.findOne({ followerId: authResult.user._id, followedId: req.params.userId });

        if (!followed) {
            let follower = new Follower();
            follower.followerId = authResult.user._id;
            follower.followedId = req.params.userId;
            await follower.save();
            return res.sendStatus(201);
        } else {
            return res.sendStatus(406);
        }
    }
});

router.delete('/follows/:userId', async (req, res) => {
    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let followed = await Follower.findOne({ followerId: authResult.user._id, followedId: req.params.userId });

        if (followed) {
            await followed.delete();
            return res.sendStatus(201);
        } else {
            return res.sendStatus(404);
        }
    }
});

router.get('/:id/follows', async (req, res) => {
    let follows;
    try {
        follows = await Follower.find({ followerId: req.params.id });
    } catch (e) { return res.sendStatus(406) };
    if (!follows) return res.sendStatus(406);

    let ids = [];
    follows.forEach(item => ids.push(item.followedId));

    let users = await User.find({ _id: { $in: ids } });
    let followed = [];
    users.map(user => followed.push({
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture
    }));

    return res.status(200).json(followed);
});

router.get('/:id/followers', async (req, res) => {
    let followedBy;
    try {
        followedBy = await Follower.find({ followedId: req.params.id });
    } catch (e) { return res.sendStatus(406) };
    if (!followedBy) return res.sendStatus(406);

    let ids = [];
    followedBy.forEach(item => ids.push(item.followerId));

    let users = await User.find({ _id: { $in: ids } });
    let followers = [];
    users.map(user => followers.push({
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture
    }));

    return res.status(200).json(followers);
});

router.get('/:id', async (req, res) => {

    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    let user;

    try {
        user = await User.findOne({ _id: req.params.id });
    } catch (e) { return res.sendStatus(406) };

    if (!user) return res.sendStatus(404);

    let userInfo = {
        username: user.username,
        signUpDate: user.signUpDate,
        profilePicture: user.profilePicture,
        about: user.about
    };

    if (authResult.isAuthenticated) {
        const isFollowed = await Follower.findOne({
            followerId: authResult.user._id,
            followedId: user._id
        });

        if (isFollowed) userInfo.isFollowed = true;
        else userInfo.isFollowed = false;
    }

    let query = { "author.id": user._id, "removed": false };

    if (req.query.topic) {
        query = { "author.id": user._id, "topic.name": req.query.topic, "removed": false }
    }

    let posts = [];

    const count = await Post.count({ "author.id": user._id, "removed": false });


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

    const followers = await Follower.count({ followedId: user._id });
    const following = await Follower.count({ followerId: user._id });

    return res.status(200).json({
        userInfo,
        followers,
        following,
        posts,
        totalPages: Math.ceil(count / req.query.limit),
        count
    });
});

module.exports = router;