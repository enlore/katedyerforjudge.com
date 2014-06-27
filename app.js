var express     = require('express')
  , path        = require('path')
  , less        = require('less-middleware')
  , fs          = require('fs')
  , config      = JSON.parse(fs.readFileSync('config.json'))
  , bodyParser  = require('body-parser')
  , session     = require('express-session')
  , cookieParser    = require('cookie-parser')
  , app         = express()
  , stripe      = require('stripe')('sk_test_75v3BBW80vcLslnEL5nQmSLM')
  , Mailgun     = require('mailgun').Mailgun
  , mg          = new Mailgun('key-1le00ub2z3uc8onmlmnk2sdph6-484v5', 'v2')
  , jade        = require('jade')
  ;

app.set('env', process.env.ENV || 'production')

app.set('sender', 'site@katedyerforjudge.com')
app.set()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.set('trust proxy')

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

var sessionOptions = {
    name: '',
    secret: 'js843j*&l8d&Dj30)W$jjfd*&S)@@53',
    cookie: {
        secure: false,
        maxAge: 60000 * 10
    }
}

// env based config
if (app.get('env') === 'production') {
    app.set('port', config.port)
    sessionOptions.cookie.secure = true

} else {
    app.set('port', process.env.PORT || 3000)
    lessOptions.debug = false
}

app.use(session(sessionOptions))
app.use(bodyParser.urlencoded())
app.use(less(path.join(__dirname, 'less'), lessOptions))
app.use(express.static(path.join(__dirname, 'static')))

// api
app.get('/', function (req, res) { res.render('index') })
app.get('/about', function (req, res) { res.render('about') })
app.get('/get-involved', function (req, res) { res.render('get-involved') })
app.get('/donate', function (req, res) { res.render('donate') })

app.post('/donate', function (req, res) {
    // stick the form fields in the session (having already been validated client side)
    req.session.form = {
        human_name  : req.body.human_name,
        phone       : req.body.phone,
        email       : req.body.email,
        address     : req.body.address,
        city        : req.body.city,
        zip_code    : req.body.zip_code,
        occupation  : req.body.occupation,
        employer    : req.body.employer
    }

    if (req.body.amount_other) {
        req.session.form.amount = req.body.other_amount 
    } else {
        req.session.form.amount = req.body.amount 
    }

    res.redirect('/confirm')
})

app.get('/confirm', function (req, res) {
    res.render('confirm-donate', {form: req.session.form})
})

app.post('/confirm', function (req, res) {
    // gen token on this request
    stripe.charges.create({
        amount: req.session.form.amount,
        currency: 'usd',
        card: req.body.token,
        description: 'Donation to Kate Dyer Campaign',

    }, function (err, charge) {
        if (err && err.type === 'StripeCardError') {
            console.log('Card declined') 
            throw Error('Card declined')
        }

        var emailTemplate = path.join(__dirname, 'views', 'donation-email.jade')

        var templateVals = {
            human_name      : req.body.human_name, 
            phone           : req.body.phone,
            email           : req.body.email,
            address         : req.body.address,
            city            : req.body.city,
            zip_code        : req.body.zip_code,
            occupation      : req.body.occupation,
            employer        : req.body.employer,
            amount          : req.body.amount
        }

        var recip = ['n.e.lorenson@gmail.com']
          , domain = 'katedyerforjudge.com'
          , subj    = 'New Donation'
          , text = 'Nick Lorenson\nn.e.lorenson@gmail.com\n$20.00\ntext version'
          , html = jade.renderFile(emailTemplate, templateVals)
          ;

        mg.send(app.get('sender'), recip, subj, text, html, domain, function (err) {
            if (err)
               throw err 
        })

        res.redirect('/thank-you')
    })
})

app.listen(app.get('port'), function () {
    console.log('~~~~~> Listening on %s', app.get('port'))
    console.log('~~~~~> Running in %s mode', app.get('env'))
})
