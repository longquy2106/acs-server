// server/APIs/login.js
const client = require('../../../../ConnectDatabase/his_ace')
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function (req, res) {
    var variables = {
    }
    console.log('after verify for chart');
    if (req.query && req.verify?.company_id) {
        console.log('req.verify.company_id', req.verify.company_id);
        // console.log('req.query.internal_hospital_id', Number(req.query.internal_hospital_id));
        // Câu lệnh truy vấn
        let query =
            `query MyQuery {
        his_ace_companies(where: {id: {_eq: ${req.verify.company_id}}}, order_by: {created_at: desc}) {
          id
          code
          name
          url_image
          phone_number
          website
          address
          company_contacts {
            id
            fullname
            email
            phone_number
            position
          }
          internal_hospital_id
        }
      }
      `
        client.query(
            query,
            variables,
            function (req, res) {
                // callback trả về kết quả hoặc nếu có lỗi diễn ra
                if (res.status === 401)
                    throw new Error('Not authorized')
            }).then(function (body) {
                console.log('body.data', body.data);
                // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
                res.json(body.data)
            }).catch(function (err) {
                console.log(err.message)
            })
    } else {
    }
};