const mongoose = require('mongoose');
const DB_HOST = 'mongodb+srv://samtaktreba:DazVr9tYn2DwySV0@cluster0.dhtizyx.mongodb.net/db-contacts?retryWrites=true&w=majority';
mongoose.set('strictQuery', true);
mongoose.connect(DB_HOST)
  .then(() => {
    app.listen(3000)
  }).catch(error => {
    console.log(error.message);
    process.exit(1);
  })
const app = require('./app')
