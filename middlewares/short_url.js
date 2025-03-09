// server/APIs/login.js
const { query } = require('express');
const client = require('../ConnectDatabase/his_ace')
require('dotenv').config();
module.exports = async function (req, res) {
    var variables = {
    }

    const shortUrl = req.params.shortUrl;
    let originalUrl = '';


    let query =
        `query MyQuery {
        his_ace_shortlinks(where: {short_url: {_eq: "${shortUrl}"}}) {
          id
          short_url
          original_url
        }
      } 
      `
    await client.query(
        query,
        variables,
        function (req, res) {
            // callback trả về kết quả hoặc nếu có lỗi diễn ra
            if (res.status === 401)
                throw new Error('Not get patient info!')
        }).then(async function (body) {
            console.log('body.data', body.data);
            originalUrl = body.data?.his_ace_shortlinks[0]?.original_url
            console.log('body.data?.his_ace_shortlink[0]?.url', body.data?.his_ace_shortlinks[0]?.original_url);
            // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
        }).catch(function (err) {
            console.log(err.message)
        })

    if (originalUrl) {
        res.redirect(originalUrl);
    } else {
        res.status(404).json({ error: 'Link not found' });
    }
};