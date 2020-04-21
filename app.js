const express = require('express');
const exphbs  = require('express-handlebars');
const morgan = require('morgan');
const debug = require('debug')('app');
require('dotenv').config();
const mercadopago = require('mercadopago');

mercadopago.configure({
    sandbox: true,
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});
 
const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('tiny'));
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', async (req, res) => {
    const preference = await mercadopago.preferences.create({
        items: [
            {
                title: req.query.title,
                unit_price: Number(req.query.price),
                quantity: Number(req.query.unit)
            }
        ]
    })
    res.render('detail', { ...req.query, id: preference.body.id });
});

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));
 
app.listen(port, () => debug('Listening to port ' + port));