const io = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = http.createServer((request, response) => {
    const indexPath = path.join(__dirname, "index.html");
    const readStream = fs.createReadStream(indexPath);
    readStream.pipe(response);
});

const socket = io(server);
let usersList = [];
let delUsersList = [];

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
}

socket.on('connection', client => {
    console.log('ID клиента: ' + client.id);

    client.broadcast.emit('NEW_CLIENT_CONNECTED');

    client.on('NewPlayer', name => {
        let systemMessage = '';
        let user = {
            name: '',
            color: '',
            id: ''
        };

        let index = delUsersList.findIndex((user) => user.name === name);

        if (index > -1) {
            oldUser = delUsersList.splice(index, 1);
            usersList.push(oldUser[0]);
            systemMessage = `Вернулся пользователь: ${oldUser[0].name}`;
        } else {
            user.name = name;
            user.color = getRandomColor();
            user.id = client.id;
            usersList.push(user);
            systemMessage = `Подключился пользователь: ${name}`;
        }

        const payload = {
            message: systemMessage,
        };
        console.log(systemMessage);

        client.emit('SERVER_MSG', payload);
        client.broadcast.emit('SERVER_MSG', payload);

        console.log(usersList);
    })

    client.on('disconnect', name => {
        let index = usersList.findIndex((user) => user.id === client.id);
        delUser = usersList.splice(index, 1);
        delUsersList.push(delUser[0]);

        let systemMessage = `Отключился пользователь: ${delUser[0].name}`;
        const payload = {
            message: systemMessage,
        };
        console.log(systemMessage);

        client.emit('SERVER_MSG', payload);
        client.broadcast.emit('SERVER_MSG', payload);

        console.log(usersList);
    })

    client.on('CLIENT_MSG', data => {
        let user = usersList.find((user) => user.id === client.id);

        const payload = {
            author: user.name,
            message: data.message,
            color: user.color
        };

        client.emit('SERVER_MSG', payload);
        client.broadcast.emit('SERVER_MSG', payload);
    });
});

const port = 3000;
const host = "localhost";
server.listen(port, host, () =>
    console.log(`Server running at http://${host}:${port}`)
);