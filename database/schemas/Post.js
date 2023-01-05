const mongoose = require('mongoose');
const { marked } = require('marked');

const PostSchema = new mongoose.Schema({
    title: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    description: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    markdown: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    html: {
        type: mongoose.SchemaTypes.String,
    },
    createdAt: {
        type: mongoose.SchemaTypes.Date,
        default: new Date()
    },
    lastEdit: {
        type: mongoose.SchemaTypes.Date
    },
    likes: {
        type: mongoose.SchemaTypes.Number,
        default: 0
    },
    author: {
        id: {
            type: mongoose.SchemaTypes.ObjectId
        },
        username: {
            type: mongoose.SchemaTypes.String
        }
    },
    topic: {
        id: {
            type: mongoose.SchemaTypes.ObjectId
        },
        name: {
            type: mongoose.SchemaTypes.String
        }
    },
    removed: {
        type: mongoose.SchemaTypes.Boolean,
        default: false
    }
});

/*
PostSchema.pre('validate', function (next) {
    if (this.markdown) {
        this.html = marked.parse(this.markdown);
    }
    next();
});
*/

module.exports = mongoose.model('Post', PostSchema);