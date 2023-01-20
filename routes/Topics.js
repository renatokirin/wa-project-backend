const express = require('express');
const router = express.Router();
const Topic = require('./../database/schemas/Topic');


router.get('', async (req, res) => {
    let topics = await Topic.find({ "name": { $regex: req.query.name } });
    res.status(200).json(topics);
}); 

module.exports = router;