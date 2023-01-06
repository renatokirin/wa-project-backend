const express = require('express');
const router = express.Router();
const User = require('./../database/schemas/User');
const checkAuthenticated = require('./../auth/checkAuthenticated');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

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

    if (await bcrypt.compare(req.body.password, user.password)) {
        user.authToken = uuidv4();

        await user.save().then(result => {
            return res
                .cookie("token", user.authToken)
                .cookie("email", user.email)
                .cookie("username", user.username)
                .status(200).json({ "authenticated": true });
        }).catch(err => {
            return res.status(500).json({ "authenticated": false, "error": err });
        });
    } else {
        // 401 Unauthorized
        return res.status(401).json({ "authenticated": false })
    }
});


router.patch('/auth/signOut', async (req, res) => {
    let user = await User.findOne({ email: req.cookies.email });
    if (checkAuthenticated(req.cookies.token, req.cookies.email)) {
        user.authToken = uuidv4();
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
        .sendStatus(200);
});


module.exports = router;