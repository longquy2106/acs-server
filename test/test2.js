const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Nhập chuỗi s: ', (s) => {
    // Gọi phương thức Find với chuỗi s
    let result = new ChallengeClass().Find(s);
    console.log('Kết quả:', result);
    
    rl.close();
});
