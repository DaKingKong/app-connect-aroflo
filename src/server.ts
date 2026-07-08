// main file for local server
require('dotenv').config()

const { app } = require('./app');

const {
  PORT,
  APP_HOST,
} = process.env;

const port = PORT || 6066;
const host = APP_HOST || (process.env.DYNO ? '0.0.0.0' : 'localhost');

app.listen(port, host, () => {
  console.log(`-> server running at: http://${host}:${port}`);
});
