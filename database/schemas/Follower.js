const mongoose = require('mongoose');

const FollowerSchema = new mongoose.Schema({
    followerId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    followedId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    }
});

module.exports = mongoose.model('Follower', FollowerSchema);