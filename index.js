require('dotenv').config();

const port = process.env.PORT || 3333;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const users = require('./api/users');
const templates = require('./api/templates');
const email = require('./api/email');

app.use(jsonParser);
app.use('/users', users);
app.use('/templates', templates);
app.use('/email', email);

app.listen(port, () => console.log(`Server listening on port ${port}`));
