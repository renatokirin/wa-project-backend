const express = require('express');
const router = express.Router();
const checkAuthenticated = require('./../auth/checkAuthenticated');
const sharp = require('sharp');
const multer = require('multer');
const fs = require("fs");

const Storage = multer.diskStorage({
    destination: 'temp',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: Storage }).single('profilepicture');

router.patch('/editProfilePicture', async (req, res) => {

    let authResult = await checkAuthenticated(req.cookies.token, req.cookies.email);

    if (authResult.isAuthenticated) {
        let user = authResult.user;

        upload(req, res, (err) => {

            try {
                console.log(req.file.filename);
            } catch (e) { return res.sendStatus(406); }

            if (err) {
                console.log(err);
            } else {
                const img = sharp("temp/" + req.file.filename)
                    .resize({ height: 100, width: 100 }).toBuffer().then(dt => {
                        const image = {
                            name: req.body.name,
                            image: {
                                data: dt,
                                contentType: 'image/png'
                            }
                        };
                        user.profilePicture = image;
                        user.save().then(result => res.sendStatus(200)).catch(err => console.log(err));

                        fs.unlink("temp/" + req.file.filename, (err) => {
                            if (err) console.log(err);
                        });
                    });
            }
        });

    } else {
        return res.sendStatus(401);
    }
});

module.exports = router;