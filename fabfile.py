from fabric.api import *
import os

env.hosts = ['katedyerforjudge.com']
env.user = 'no'

def pack():
    pass

def stage():
    local('tar cvzf dist/dist.tar.gz app.js static views package.json config.json')

    put('dist/dist.tar.gz', '/tmp')

    with cd('/var/www/katedyerforjudge.com/staging'):
        run('tar xvzf /tmp/dist.tar.gz')
        run('npm install')
        run('forever restart app.js')

    run('rm /tmp/dist.tar.gz')
    local('rm dist/dist.tar.gz')

def deploy():
    with lcd('dist'):
        local('tar cvzf dist.tar.gz *')
        put('dist.tar.gz', '/tmp')

        with cd('/var/www/katedyerforjudge.com/static'):
            run('tar xvzf /tmp/dist.tar.gz')

        run('rm /tmp/dist.tar.gz')
        local('rm dist.tar.gz')

def dev():
    local('nodemon -e "jade,less,js" -w js -w less -w views -x python /usr/local/bin/fab compile')

def compile():
    css()
    jade()
    local('cp js/main.js dist/js/main.js')

def css():
    local('lessc --strict-imports less/main.less > dist/css/main.css')

def jade():
    local('jade -o dist views')

