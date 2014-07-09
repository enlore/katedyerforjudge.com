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
  , stripe          = require('stripe')(config.stripe_live_secret || 'sk_test_4KdReHf3654dRthCEiHecLyX')
  , Mailgun         = require('mailgun').Mailgun
  , mg              = new Mailgun('key-1le00ub2z3uc8onmlmnk2sdph6-484v5', 'v2')
  , compress        = require('compression')
  , morgan          = require('morgan')
  , jade            = require('jade')
  , helmet          = require('helmet')
  ;

// express
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.set('trust proxy', 1)

// app
app.set('env', process.env.ENV || 'production')
app.set('sender', config.sender || "app")
app.set('domain', 'katedyerforjudge.com')
app.set('volunteer-recip', config.volunteer_recip || 'n.e.lorenson@gmail.com')
app.set('donation-recip', config.donation_recip || 'n.e.lorenson@gmail.com')

app.locals.pretty = true

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

//app.use(helmet({ nocache: false }))
app.use(morgan(morganOptions))
app.use(compress(compressOptions))
app.use(cookieParser())
app.use(session(sessionOptions))
app.use(bodyParser.urlencoded({extended: true}))
app.use(csurf(csurfOptions))
app.use(less(path.join(__dirname, 'less'), lessOptions))
app.use(express.static(path.join(__dirname, 'static')))

// csrf template setter
app.use(function (req, res, next) {
    res.locals.csrf_token = req.csrfToken()
    next()
})

// web api
app.get('/', function (req, res) { res.render('index') })
app.get('/about', function (req, res) { res.render('about') })
app.get('/media', function (req, res) { res.render('media') })
app.get('/thank-you', function (req, res) { res.render('thank-you') })

// volunteer form
app.get('/get-involved', function (req, res) { res.render('get-involved') })
app.post('/get-involved', function (req, res) {

    var volunteerTemplate = path.join(__dirname, 'views', 'volunteer-email.jade')

    var templateVals = {
        human_name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        interest: req.body.interest
    }

    var recip   = app.get('volunteer-recip')
      , domain  = app.get('domain')
      , subj    = 'VOLUNTEER'
      , text    = ''
      , html    = jade.renderFile(volunteerTemplate, templateVals)
      ;

    mg.send(app.get('sender'), recip, subj, text, html, domain, function (err) {
        if (err)
           throw err 
    })

    res.render('thank-you-volunteer')
})

// donation form
app.get('/donate', function (req, res) { res.render('donate') })
app.post('/donate', function (req, res) {
    req.session.form = {
        human_name  : req.body.human_name,
        phone       : req.body.phone,
        email       : req.body.email
    }

    if (req.body.amount_other) {
        req.session.form.big_form = true
        req.session.form.amount     = req.body.other_amount 
        req.session.form.address    = req.body.address,
        req.session.form.city       = req.body.city,
        req.session.form.zip_code   = req.body.zip_code,
        req.session.form.occupation = req.body.occupation,
        req.session.form.employer   = req.body.employer
    } else {
        req.session.form.big_form = false
        req.session.form.amount = req.body.amount 
    }
    
    console.log('req.body', req.body)
    console.log('req.session', req.session)

    res.redirect('/confirm')
})

// donation confirmation
app.get('/confirm', function (req, res) { res.render('confirm-donate', {form: req.session.form}) })
app.post('/confirm', function (req, res, next) {
    console.log(req.body)

    var amount = req.body.amount || req.session.form.amount
    console.log('recieved amount', amount)

    // gen token on this request
    stripe.charges.create({
        // ----------- amount in CENTS -----------
        amount: Number(amount) * 100,          //x
        // ----------- amount in CENTS -----------
        receipt_email: req.body.email,
        currency: 'usd',
        card: req.body.stripeToken,
        description: 'Donation to Kate Dyer Campaign',
        metadata : {
            name: req.body.human_name, 
            email: req.body.email
        }
    }, function (err, charge) {
        if (err && err.type === 'StripeCardError') {
            console.log('~~~~~> Card declined') 
            next(err)
        } else if (err) {
            console.log('Stripe error: ', err) 
            next(err)
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
            amount          : req.session.form.amount
        }

        var recip   = app.get('donation-recip')
          , domain  = app.get('domain')
          , subj    = 'DONATION'
          , text    = ''
          , html    = jade.renderFile(emailTemplate, templateVals)
          ;

        mg.send(app.get('sender'), recip, subj, text, html, domain, function (err) {
            if (err)
               throw err 
        })

        res.redirect('/thank-you')
    })
})

// error handler - log it and shoot an email
app.use(function (err, req, res, next) {
    console.log(err)

    if (err.stack)
        console.log(err.stack)

    var textBody = ''

    if (err.message && err.stack) {
        textBody = err.message + '\n' + err.stack
    } else if (err && err.stack) {
        textBody = err + '\n' + err.stack 
    } else if (err) {
        textBody = err 
    }

    mg.send('error@katedyerforjudge.com', 'n.e.lorenson@gmail.com', 'APP ERROR', textBody, '', 'katedyerforjudge.com', function (err) {
        if (err) {
            console.log('Errors within errors')
            console.log(err.message, '\n', err.stack) 
        }
    })

    res.render('error', {error: err.message})
})

app.listen(app.get('port'), function () {
    console.log('~~~~~> Listening on %s', app.get('port'))
    console.log('~~~~~> Running in %s mode', app.get('env'))
})
