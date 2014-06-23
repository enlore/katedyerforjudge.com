var express = require('express')
  , path    = require('path')
  , less    = require('less-middleware')
  , fs      = require('fs')
  , config  = JSON.parse(fs.readFileSync('config.json'))
  , app     = express()
  ;

app.set('env', process.env.ENV || 'production')

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
    lessOptions.debug = true 
}

app.use(less(path.join(__dirname, 'less'), lessOptions))
app.use(express.static(path.join(__dirname, 'static')))

// api
app.get('/', function (req, res) { res.render('index') })
app.get('/about', function (req, res) { res.render('about') })
app.get('/get-involved', function (req, res) { res.render('get-involved') })
app.get('/donate', function (req, res) { res.render('donate') })

app.listen(app.get('port'), function () {
    console.log('~~~~~> Listening on %s', app.get('port'))
    console.log('~~~~~> Running in %s mode', app.get('env'))
})
