var express         = require('express')
  , path            = require('path')
  , less            = require('less-middleware')
  , fs              = require('fs')
  , config          = JSON.parse(fs.readFileSync('config.json'))
  , bodyParser      = require('body-parser')
  , session         = require('express-session')
  , cookieParser    = require('cookie-parser')
  , csurf           = require('csurf')
  , app             = express()
  , stripe          = require('stripe')('sk_test_75v3BBW80vcLslnEL5nQmSLM')
  , Mailgun         = require('mailgun').Mailgun
  , mg              = new Mailgun('key-1le00ub2z3uc8onmlmnk2sdph6-484v5', 'v2')
  , compress        = require('compression')
  , morgan          = require('morgan')
  , jade            = require('jade')
  , helmet          = require('helmet')
  ;

app.set('env', process.env.ENV || 'production')
app.set('sender', config.sender || "app")

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.set('trust proxy', 1)

var lessOptions = {
    debug: false,
    dest: path.join(__dirname, 'static'),
    preprocess: {
        path: function (pathname, req) {
            return pathname.replace('/css', '') 
        } 
    }
}

var sessionOptions = {
    name: 'dyer.sid',
    secret: config.secret,
    proxy: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 60000 * 10
    }
}

var csurfOptions = {}

var compressOptions = {}

var morganOptions = {
    format: 'dev',
    skip: function (req, res) {
        return res.statusCode === 304 
    }
}

// env based config
if (app.get('env') === 'production') {
    app.set('port', config.port)
    //sessionOptions.cookie.secure = true
} else {
    app.set('port', process.env.PORT || 3000)
    lessOptions.debug = false
}

app.use(helmet())
app.use(morgan(morganOptions))
app.use(compress(compressOptions))
app.use(cookieParser())
app.use(session(sessionOptions))
app.use(bodyParser.urlencoded({extended: true}))
app.use(csurf(csurfOptions))
app.use(less(path.join(__dirname, 'less'), lessOptions))
app.use(express.static(path.join(__dirname, 'static')))

app.use(function (req, res, next) {
    console.log('secure? %s', req.secure)
    next()
})

app.use(function (req, res, next) {
    res.locals.csrf_token = req.csrfToken()
    next()
})

// api
app.get('/', function (req, res) { res.render('index') })
app.get('/about', function (req, res) { res.render('about') })
app.get('/get-involved', function (req, res) { res.render('get-involved') })
app.get('/thank-you', function (req, res) { res.render('thank-you') })

app.get('/donate', function (req, res) { res.render('donate') })

app.post('/donate', function (req, res) {
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
    console.log(req.session.form)
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
