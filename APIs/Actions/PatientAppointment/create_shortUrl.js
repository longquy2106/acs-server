
module.exports = function (req, res) {
  const originalUrl = req.body.url;
  const shortUrl = generateShortUrl();

  // Lưu trữ short URL và đường dẫn gốc vào bảng tra
  urlMap[shortUrl] = originalUrl;

  res.json({ shortUrl: `${process.env.DOMAIN_SERVER}/${shortUrl}` });
}