const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const rooms = {};

io.on("connection", socket => {
  console.log("Connected")
    socket.on("join room", roomID => {
        console.log("Join room fired", roomID);
        if (rooms[roomID]) {
            console.log("Push")
            rooms[roomID].push(socket.id);
        } else {
            console.log("Create")
            rooms[roomID] = [socket.id];
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if (otherUser) {
            console.log("Other user fired and user joined fired")
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
    });

    socket.on("offer", payload => {
        console.log("Offer fired", payload)
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", payload => {
        console.log("Answer fired", payload)
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", incoming => {
        console.log("Ice candidate fired");
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });
});


server.listen(9000, () => console.log('server is running on port 9000'));