const client = require('../ConnectDatabase/index')
const jwt = require('jsonwebtoken');
const getDataLogin = (req, res) => {

    // Câu lệnh truy vấn
    let queryLogin =
        `query MyQuery {
            his_ace_users(where: {email: {_eq: "${req.query.email}"}, password: {_eq: "${req.query.password}"}}) {
                id
            }
        }

            `
    console.log('queryLogin', queryLogin);
    client.query(
        queryLogin,
        variables,
        function (req, res) {
            // callback trả về kết quả hoặc nếu có lỗi diễn ra
            if (res.status === 401)
                throw new Error('Not authorized')
        }).then(function (body) {
            // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
            // res.json(body.data)
            res.json({
                ToKen: jwt.sign({
                    user: null,
                    permisstion: null
                },
                    "admin-secret-thuong-123",
                    {
                        expiresIn: "3 days"
                    }),
                RefreshToken: jwt.sign({
                    user: null,
                    permisstion: null
                },
                    "Admin@2740",
                    {
                        expiresIn: "7 days"
                    }),
            })
        }).catch(function (err) {
            console.log(err.message)
        })
}
module.exports = getDataLogin