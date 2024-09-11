const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Player = require('./Models/Player');
const GameSession = require('./Models/Game');
require('dotenv').config();
require('./db');

const app = express();
const PORT = 8000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
});

app.get('/', (req, res) => {
    res.send({ message: 'Server is working!' });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createGame', async ({ username }) => {
        try {
            const player = await Player.findOneAndUpdate(
                { username },
                { $inc: { totalGames: 1 } },
                { new: true, upsert: true }
            );

            const newGame = new GameSession({
                player1: player._id,
                player2: null,
                currentTurn: player._id
            });

            await newGame.save();
            socket.join(newGame._id.toString());

            socket.emit('Game_Created', { gameId: newGame._id, playerId: player._id });
        } catch (error) {
            console.error('Error creating game:', error.message);
            socket.emit('error', 'Could not create game.');
        }
    });

    socket.on('joinGame', async ({ username, gameId }) => {
        try {
            const game = await GameSession.findById(gameId);

            if (!game) {
                socket.emit('error', 'Room Not Found');
                return;
            }

            if (game.player2) {
                socket.emit('error', 'Game is full');
                return;
            }

            const player = await Player.findOneAndUpdate(
                { username },
                { $inc: { totalGames: 1 } },
                { new: true, upsert: true }
            );

            game.player2 = player._id;
            await game.save();

            socket.join(game._id.toString());
            io.to(game._id.toString()).emit('gamejoined', { gameId: game._id, playerId: player._id });

        } catch (error) {
            console.error('Error joining game:', error.message);
            socket.emit('error', 'Could not join game.');
        }
    });

    socket.on('makemove', async ({ gameId, playerId, x, y }) => {
        console.log(gameId, playerId);
        const game = await GameSession.findById(gameId);

        if (!game) {
            socket.emit('Error', 'Game not Found');
            return;
        }

        if (game.isGameOver) {
            socket.emit('Error', 'Game Over');
            return;
        }

        if (game.currentTurn.toString() !== playerId) {
            socket.emit('Error', 'Not your Turn');
            return;
        }

        if (game.board[x][y] !== '') {
            socket.emit('Error', 'Invalid Move');
            return;
        }

        game.board[x][y] = game.currentTurn.equals(game.player1) ? 'X' : 'O';
        game.totalMoves++;

        if (checkForWin(game.board)) {
            game.isGameOver = true;
            game.winner = game.currentTurn;
            await game.save();
            io.to(game._id.toString()).emit('gameover', { winner: game.currentTurn });
            return;
        } else if (game.totalMoves === 9) {
            game.isGameOver = true;
            await game.save();
            io.to(game._id.toString()).emit('gameover', { winner: null });
            return;
        }

        game.currentTurn = game.currentTurn.equals(game.player1) ? game.player2 : game.player1;
        await game.save();

        io.to(game._id.toString()).emit('updateBoard', { board: game.board, currentTurn: game.currentTurn });
    });

    socket.on('update', async ({ gameId }) => {
        const game = await GameSession.findById(gameId);
        console.log(game.board)
        if (!game) {
            socket.emit('Error', 'Game not Found');
            return;
        }
        io.to(game._id.toString()).emit('updateBoard', { board: game.board, currentTurn: game.currentTurn });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

function checkForWin(board) {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return true;
        if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return true;
    }
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return true;
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return true;

    return false;
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
