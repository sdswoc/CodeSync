const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    roomID:String,
    users:Array,
    language:String,
    peerIds:Array
})

module.exports = mongoose.model('Room',userSchema);