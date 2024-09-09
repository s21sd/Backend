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
    console.log('A user connected', socket.id);

    // Functon logic to create Room
    socket.on('createGame', async ({ username }) => {
        try {

            const player = await Player.findOneAndUpdate(
                { username },
                { $inc: { totalGames: 1 } },
                { new: true, upsert: true }
            );


            const newGame = new GameSession({
                player1: player._id,
                player2: player._id,
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

    // Function Login to Join Room

    socket.on('joinGame', async ({ username, gameId }) => {
        try {
            const game = await GameSession.findById(
                '66de3b3ea95b482e17ed6233'
            );
            if (!game) {
                socket.emit('error', 'Room Not Found');
            }
            console.log(game);
            if (game.player2) {
                socket.emit('error', 'game is full');
            }
            // updating the player two also
            const player = await Player.findOneAndUpdate(
                { username },
                { $inc: { totalGames: 1 } },
                { new: true, upsert: true }
            )
            game.player2 = player._id;
            socket.join(game._id.toString());
            io.to(game._id.toString()).emit('gamejoined', { gameId: game._id }, { playerId: player._id });


        } catch (error) {
            console.error('Error Joining game:', error.message);


            socket.emit('error', 'Could not Join game.');
        }







    })

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
