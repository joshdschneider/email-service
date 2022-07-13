const postmark = require('postmark');

const token = process.env.POSTMARK_KEY;
const client = new postmark.ServerClient(token);
const from = process.env.POSTMARK_FROM;

module.exports = { client, from };
