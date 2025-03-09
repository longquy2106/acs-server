const fetchGQL = require('graphql-client');
require('dotenv').config();

const client = new fetchGQL({
    url: process.env.ENDPOINT_HASURA,
    headers: {
        'content-type': 'application/json',
        'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET
    }
})

if (client) {
    console.log('connect thành công');
    console.log(process.env.ENDPOINT_HASURA);
    console.log(client.query[Function]);
} else {
    console.log('chưa connect được');
}
// Biến thêm vào như hôm trước đã nói, nếu có tùy biến  
module.exports = client;