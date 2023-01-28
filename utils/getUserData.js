const User = require('./../database/schemas/User');
const Like = require('./../database/schemas/Like');

async function getUserData(postId, userId) {
    let bookmarked;
    let liked;

    bookmarked = await User.findOne({
        _id: userId,
        bookmarks: postId.toString()
    });
    liked = await Like.findOne({
        postId: postId.toString(),
        userId: userId
    });

    let bookmarkedBool = bookmarked ? true : false;
    let likedBool = liked ? true : false;

    return {
        "bookmarked": bookmarkedBool,
        "liked": likedBool
    };
}

module.exports = getUserData;