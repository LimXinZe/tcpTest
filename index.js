const net = require('net');
// env
require('dotenv').config();
const HOST = 'api.megafeed.com';
const PORT = 3128;
const USERNAME = process.env.API_USERNAME;
const PASSWORD = process.env.API_PASSWORD;
const HEARTBEAT_INTERVAL = 5000; // 5 seconds

let client = new net.Socket();

// Function to connect to the server
function connectToServer() {
    new Promise((resolve, reject) => {
        client.connect(PORT, HOST, (e) => {
            console.log(e)
            console.log('Connected to server');
            const authMessage = { Command: 'auth', Username: USERNAME, Password: PASSWORD };
            // var buf = Buffer.from(JSON.stringify(authMessage));
            // console.log(buf);
            client.write(objToMsg(authMessage));
            resolve();
        });
    }).then(_ => {
        setInterval(() => {
            const heartBeatMessage = { Command: 'heartbeat' };
            client.write(objToMsg(heartBeatMessage));
            console.log('Heartbeat sent');
        }, HEARTBEAT_INTERVAL);
    })
}

let objToMsg = (obj) => {
    const objMessage = JSON.stringify(obj);
    return `${objMessage}`;
}



// Handle incoming messages from the server
client.on('data', (data) => {
    console.log("====================data ======================");

    console.log('Received raw data:', data.toString());
    try {
        const message = JSON.parse(data);
        console.log('Received:', message);
    } catch (error) {
        console.error('Error parsing JSON:', error.message);
    }
    console.log("====================end data ======================");
});

client.on('auth', (data) => {
    console.log("====================auth ======================");
    console.log(data)
    console.log('Received raw data:', data.toString());
    try {
        const message = JSON.parse(data);
        console.log('Received:', message);
    } catch (error) {
        console.error('Error parsing JSON:', error.message);
    }
    console.log("====================end auth ======================");

});

// Handle connection closure
client.on('close', () => {
    console.log('Connection closed, attempting to reconnect...');
    setTimeout(connectToServer, 3000); // Reconnect after 3 seconds
});

// Handle errors
client.on('error', (error) => {
    console.error('Connection error:', error.message);
});

// Initial connection
connectToServer();

