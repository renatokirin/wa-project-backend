const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
    name: {
        type: mongoose.SchemaTypes.String,
        required: true
    }
});

module.exports = mongoose.model('Topic', TopicSchema);