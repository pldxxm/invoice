const {Schema, model} = require('mongoose');
const userSchema = new Schema({
    email: {
    type: String,
    required: true,
    unique: true,
    match: [
        /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,
    ],
    trim: true,
    },
    username: {
        type: String,
        required: false,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    gender : {
        type: String,
        required: false,
        enum: ['male', 'female'],
        trim: true,
    },
    }

)

const UserModel = model('User', userSchema);
module.exports = UserModel;
