const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';

const user1 = {
    _id: 'user1_id_' + Date.now(),
    username: 'UserOne',
    skillsTeach: ['React', 'driving'],
    skillsLearn: ['Cooking', 'java']
};

const user2 = {
    _id: 'user2_id_' + Date.now(),
    username: 'UserTwo',
    skillsTeach: ['React', 'Java', 'Python'],
    skillsLearn: ['Guitar', 'Driving', 'Shooting']
};

// Mocking the User model behavior requires the server to actually fetch these users from DB.
// Since we can't easily insert into DB from here without connecting to Mongoose, 
// we notice that socketManager.js fetches user from DB: const user = await User.findById(userId);
// 
// PROBLEM: The socketManager relies on the database.
//
// Workaround: We will use existing users if possible, or we need to insert them.
// Actually, let's just inspect the logs when we run this. 
// If the server fails to find the user, it will return early.
//
// To make this work without DB access, we would need to mock the DB or modify the socketManager to accept user data in the payload (insecure but good for testing).
// 
// For now, let's assume we can't easily inject users. 
// Instead, I'll rely on the server logs I just added. 
// But I CANNOT see the server logs easily.
//
// Plan B: I will modify socketManager.js temporarily to accept user data in the `find_match` payload if provided, 
// bypassing the DB lookup for testing purposes.
// Or better: I'll create a new temporary socket event `test_match` that takes raw data.

// Let's go with Plan B: Modify socketManager.js to optionally use provided user data if userId is not found or if a special flag is set.
// Actually, let's just look at the code:
// const user = await User.findById(userId);
// if (!user) return;

// If I send a fake ID, it will fail.
// I need real IDs.

// I will try to register two users first using axios?
// Yes, that's better.

const axios = require('axios');
const SERVER_URL = 'http://localhost:5000/api';

async function run() {
    try {
        // Register User 1
        console.log('Registering User 1...');
        const email1 = `user1_${Date.now()}@test.com`;
        const res1 = await axios.post(`${SERVER_URL}/auth/register`, {
            username: `UserOne_${Date.now()}`,
            email: email1,
            password: 'password123',
            skillsTeach: user1.skillsTeach,
            skillsLearn: user1.skillsLearn
        });
        const u1 = res1.data.user;
        const token1 = res1.headers['set-cookie']; // Cookies need handling? 
        // proper cookie handling is tricky with axios in node without jar.
        // But socket.io uses cookie? 
        // socketManager doesn't seem to check auth on connection, only verify userId on 'find_match'.
        // Wait, socketManager doesn't use middleware. It just trusts the `userId` sent in `find_match`.
        // "socket.on('find_match', async ({ userId }) => {" -> checks DB.

        console.log('User 1 Registered:', u1.username, u1.id);

        // Register User 2
        console.log('Registering User 2...');
        const email2 = `user2_${Date.now()}@test.com`;
        const res2 = await axios.post(`${SERVER_URL}/auth/register`, {
            username: `UserTwo_${Date.now()}`,
            email: email2,
            password: 'password123',
            skillsTeach: user2.skillsTeach,
            skillsLearn: user2.skillsLearn
        });
        const u2 = res2.data.user;
        console.log('User 2 Registered:', u2.username, u2.id);

        // Connect Sockets
        console.log('Connecting sockets...');
        const socket1 = io(SOCKET_URL);
        const socket2 = io(SOCKET_URL);

        socket1.on('connect', () => {
            console.log('Socket 1 connected');
            socket1.emit('join_user', u1.id);
            console.log('Socket 1 finding match...');
            socket1.emit('find_match', { userId: u1.id });
        });

        socket2.on('connect', () => {
            console.log('Socket 2 connected');
            socket2.emit('join_user', u2.id);
            // Delay slightly
            setTimeout(() => {
                console.log('Socket 2 finding match...');
                socket2.emit('find_match', { userId: u2.id });
            }, 1000);
        });

        socket1.on('match_found', (data) => {
            console.log('SUCCESS: Socket 1 found match!', data);
            process.exit(0);
        });

        socket2.on('match_found', (data) => {
            console.log('SUCCESS: Socket 2 found match!', data);
            process.exit(0);
        });

        socket1.on('waiting_for_match', () => console.log('Socket 1 waiting...'));
        socket2.on('waiting_for_match', () => console.log('Socket 2 waiting...'));

        // Timeout
        setTimeout(() => {
            console.log('FAILED: Timeout reached without match.');
            process.exit(1);
        }, 10000);

    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
        process.exit(1);
    }
}

run();
