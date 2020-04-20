const express = require('express');
const exphbs  = require('express-handlebars');
const morgan = require('morgan');
const debug = require('debug')('app');
 
const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('tiny'));
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    res.render('detail', req.query);
});

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));
 
app.listen(port, () => debug('Listening to port 3000'));