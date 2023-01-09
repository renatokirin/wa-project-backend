const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    email: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    password: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    authToken: { // Don't send this to client <-- <-- <--
        type: mongoose.SchemaTypes.String
    },
    signUpDate: {
        type: mongoose.SchemaTypes.Date,
        default: new Date()
    },
    profilePicture: {
        name: {
            type: mongoose.SchemaTypes.String,
        },
        image: {
            data: mongoose.SchemaTypes.Buffer,
            contentType: mongoose.SchemaTypes.String
        }
    },
    bookmarks: {
        type: mongoose.SchemaTypes.Array,
        default: [],
    },
    about: {
        type: mongoose.SchemaTypes.String
    },
});

module.exports = mongoose.model('User', UserSchema);