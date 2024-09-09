const mongoose = require('mongoose')
const playerSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    wins: {
        type: Number,
        default: 0
    },
    looses: {
        type: Number,
        default: 0,
    },
    totalGames: {
        type: Number,
        default: 0
    }
});
const Player = mongoose.model('Player', playerSchema);

module.exports = Player