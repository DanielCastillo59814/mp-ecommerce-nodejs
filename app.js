const express = require('express');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const debug = require('debug')('app');
const path = require('path');
if (process.env.NODE_ENV === 'dev') {
    require('dotenv').config();
}
const mercadopago = require('mercadopago');

mercadopago.configure({
    sandbox: true,
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});
 
const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

const handleHTTPError = (err, res) => {
    if (err.response) {
      debug(err.response.data);
      debug(err.response.status);
      debug(err.response.headers);
      res.status(400);
      res.json({
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      });
    } else if (err.request) {
      debug(err.request);
      res.status(400);
      res.json(err.request);
    } else if (err.name) {
      debug(err.name);
      debug(err.message);
      debug(err.cause);
      debug(err.stack);
      res.status(400);
      res.json(err);
    } else {
      debug(err);
      res.status(500);
      res.json(res);
    }
  };

app.get('/', async (req, res) => {
    try {
        console.log(req.query);
        let params = {};
        if (req.query.preference_id) {
            let preference = await mercadopago.preferences.get(req.query.preference_id);
            preference = preference.body;
            console.log(preference);
            let total_amount = 0;
            preference.items.forEach(item => total_amount += item.quantity * item.unit_price);
            params = {
                payment_method_id: req.query.payment_type,
                total_amount,
                merchant_order_id: req.query.merchant_order_id,
                preference_id: req.query.preference_id,
                success: req.query.success === 'true',
                pending: req.query.pending === 'true',
                failure: req.query.failure === 'true'
            };
        }
        res.render('home', params);
    } catch(err) {handleHTTPError(err);}
});
app.post('/', function (req, res){
    console.log(req.body);
    /*
        estos son datos sencibles,
        guardarlos y redirigir al back_url
    */
    res.redirect(req.body.back_url);
});

app.get('/detail', async (req, res) => {
    try {
        const pref = {
            items: [
                {
                    id: 1234,
                    title: req.query.title,
                    description: 'Dispositivo móvil de Tienda e-commerce',
                    picture_url: path.join('https://danielcast-mp-ecommerce-nodejs.herokuapp.com/',req.query.img),
                    unit_price: Number(req.query.price),
                    quantity: 1
                }
            ],
            payer: {
                name: 'Lalo',
                surname: 'Landa',
                email: 'test_user_58295862@testuser.com',
                phone: {
                    area_code: '52',
                    number: 5549737300
                },
                address: {
                    zip_code: '03940',
                    street_number: 1602,
                    street_name: ' Insurgentes Sur'
                }
            },
            payment_methods: {
                excluded_payment_methods: [
                    {id: 'amex'}
                ],
                excluded_payment_types: [
                    {id: 'atm'}
                ],
                installments: 6
            },
            back_urls: {
                success: req.protocol + '://' + req.get('host') + '/?success=true',
                pending: req.protocol + '://' + req.get('host') + '/?pending=true',
                failure: req.protocol + '://' + req.get('host') + '/?failure=true',
            },
            auto_return: 'approved',
            external_reference: 'ABCD1234'
        };
        console.log(pref);
        const preference = await mercadopago.preferences.create(pref);
        res.render('detail', { ...req.query, id: preference.body.id, public_key: process.env.PUBLIC_KEY });
    } catch(err) {
        console.error('Error en el servidor', err);
        res.status(500);
        res.json(err);
    }
});

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));
 
app.listen(port, () => debug('Listening to port ' + port));