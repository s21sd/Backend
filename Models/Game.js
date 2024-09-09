const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  board: {
    type: [[String]],
    default: [['', '', ''], ['', '', ''], ['', '', '']],
  },
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  totalMoves: {
    type: Number,
    default: 0,
  },
  isGameOver: {
    type: Boolean,
    default: false,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null,
  },
});

const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = GameSession;
