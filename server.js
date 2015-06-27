var Hapi = require('hapi');
var server = new Hapi.Server();
var r = require('rethinkdb');
var connection = null;
var httpRequest = require('request');
var dbOptions = {host: '127.0.0.2', port: 28015};

server.connection({
    port: process.env.PORT || 8000
});

server.route({
    method: 'GET',
    path: '/hook',
    handler: function(request, reply){
        httpRequest.post({
            url: 'https://api.github.com/repos/danwhy/issue-alert/hooks',
            headers: {
                'user-agent': 'danwhy',
                'Authorization': 'token ' + process.env.GITHUBTOKEN
            },
            json: {
                name: 'web',
                config: {
                    url: server.info.uri + '/create'
                },
                events: ['issues']
            }},
            function(err, req, res){
                reply(console.log('Hook added: ' + res));
            }
        );
    }
});

server.views({
	engines: {
		html: require('handlebars')
	},
	path: __dirname + '/templates'
});

var io = require('socket.io')(server.listener);

server.route({
    method: 'GET',
    path: '/static/{file}',
    handler: function(request, reply){
        reply.file('static/' + request.params.file);
    }
});

server.route({
    method: 'GET',
    path: '/issues',
    handler: function(request, reply){
        r.connect(dbOptions, function(err, conn) {
            if (err) {
                console.log(err);
            }
            connection = conn;
            console.log('connected');
            r.table('issues').run(connection, function(err, cursor) {
                var iss = [];
                if (err){
                    throw err;
                }
                cursor.each(function(err, row) {
                    iss.push(row);
                });
                reply(iss);
            });
        });
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply){
        reply.file('index.html');
        r.connect(dbOptions, function(err, conn) {
            if (err) {
                console.log(err);
            }
            connection = conn;
            console.log('connected');
            r.table('issues').changes().run(connection, function(err, cursor) {
                if (err) {
                    throw err;
                }
                cursor.each(function(err, change) {
                    io.emit('issue', change);
                });
            });
        });
    }
});

server.start();
