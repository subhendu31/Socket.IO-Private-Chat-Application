const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const port = 3433;

// Create the HTTP server
const httpServer = createServer(app);

// Create a new instance of Socket.IO
const io = new Server(httpServer);

// Object to store usernames and their corresponding socket IDs
const users = {};

// Serve static files (CSS)
app.use(express.static(path.join(__dirname)));

// Define a route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html
});

// Set up Socket.IO connection
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Listen for username registration
    socket.on('register', (username) => {
        users[socket.id] = username; // Store the username with the socket ID
        console.log(`${username} registered with socket ID: ${socket.id}`);
        // Emit the updated list of users
        io.emit('user_list', Object.values(users));
    });

    // Listen for messages sent to specific users
    socket.on('private_message', ({ recipient, message }) => {
        const recipientSocketId = Object.keys(users).find(key => users[key] === recipient); // Get the socket ID for the recipient
        if (recipientSocketId) {
            const senderUsername = users[socket.id]; // Get the sender's username
            io.to(recipientSocketId).emit('private_message', { from: senderUsername, message });
            console.log(`Sent message to ${recipient}: ${message}`);
        } else {
            console.log(`User ${recipient} not found`);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // Remove the user from the users object if they disconnect
        const username = users[socket.id];
        delete users[socket.id]; // Remove the user from the users object
        console.log(`${username} disconnected`);
        // Emit the updated list of users
        io.emit('user_list', Object.values(users));
    });
});

// Start the server
httpServer.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});

