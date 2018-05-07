const app = require('./app')
const env = require('dotenv').config();

var port = process.env.PORT || 8081;
app.listen(port, () => { console.log(`server is listening on ${port}`) })