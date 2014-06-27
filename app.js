var express = require('express')
  , path    = require('path')
  , less    = require('less-middleware')
  , fs      = require('fs')
  , config  = JSON.parse(fs.readFileSync('config.json'))
  , bodyParser   = require('body-parser')
  , app     = express()
  , stripe  = require('stripe')('sk_test_75v3BBW80vcLslnEL5nQmSLM')
  , Mailgun = require('mailgun').Mailgun
  , mg      = new Mailgun('key-1le00ub2z3uc8onmlmnk2sdph6-484v5', 'v2')
  , jade    = require('jade')
  ;

app.set('env', process.env.ENV || 'production')

app.set('sender', 'site@katedyerforjudge.com')
app.set()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

var lessOptions = {
    debug: false,
    dest: path.join(__dirname, 'static'),
    preprocess: {
        path: function (pathname, req) {
            console.log(pathname)
            console.log(pathname.replace('/css', ''))
            return pathname.replace('/css', '') 
        } 
    }
}

// env based config
if (app.get('env') === 'production') {
    app.set('port', config.port)
} else {
    app.set('port', process.env.PORT || 3000)
    lessOptions.debug = false
}

app.use(bodyParser.urlencoded())
app.use(less(path.join(__dirname, 'less'), lessOptions))
app.use(express.static(path.join(__dirname, 'static')))

// api
app.get('/', function (req, res) { res.render('index') })
app.get('/about', function (req, res) { res.render('about') })
app.get('/get-involved', function (req, res) { res.render('get-involved') })
app.get('/donate', function (req, res) { res.render('donate') })

app.post('/donate', function (req, res) {
    var token = req.body.stripeToken
    console.log(token)

    stripe.charges.create({
        amount: 1000,
        currency: 'usd',
        card: token,
        description: 'Test Donation',
    }, function (err, charge) {
        if (err && err.type === 'StripeCardError') {
            console.log('Card declined') 
            throw Error('Card declined')
        }

        var emailTemplate = path.join(__dirname, 'views', 'donation-email.jade')
        var recip = ['n.e.lorenson@gmail.com']
          , domain = 'katedyerforjudge.com'
          , subj    = 'New Donation'
          , text = 'Nick Lorenson\nn.e.lorenson@gmail.com\n$20.00\ntext version'
          , html = jade.renderFile(emailTemplate, {name: 'Nick Lorenson', email: 'n.e.lorenson@gmail.com', amount: '20.00'})
          ;

        mg.send(app.get('sender'), recip, subj, text, html, domain, function (err) {
            if (err)
               throw err 
        })
    })

    return res.redirect('/donate')
})

app.listen(app.get('port'), function () {
    console.log('~~~~~> Listening on %s', app.get('port'))
    console.log('~~~~~> Running in %s mode', app.get('env'))
})
