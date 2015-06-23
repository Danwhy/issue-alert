var Hapi = require('hapi');
var server = new Hapi.Server();
var r = require('rethinkdb');
var connection = null;

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) {
        console.log(err);
        throw err;
    }
    connection = conn;
});

server.connection({
    host: 'localhost',
    port: 8000
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
    method: 'POST',
    path: '/create',
    handler: function(request, reply){
        r.table('issues').insert(request.payload).run(connection, function(err, result){
            if (err) {
                throw err;
            }
            return;
        });
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply){
        reply.file('index.html');
    }
});

server.route({
    method: 'GET',
    path: '/issues',
    handler: function(request, reply){
        r.table('issues').run(connection, function(err, cursor){
            var iss = [];
            if (err){
                throw err;
            }
            cursor.each(function(err, row){
                iss.push(row);
            });
            reply.file('index.html');
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

io.on('connection', function(socket){
    socket.on('issue', function(socket){
        console.log('mmm');
    });
});

server.start();
