var fs = require('fs');
var spawn = require('child_process').spawn;
var fullKey = process.env.SSH_TUNNEL_KEY.split(':');
var type = fullKey[0];
var key = fullKey[1];

var keyFile = '-----BEGIN ' + type + ' PRIVATE KEY-----\n';

for (var i = 0, j = key.length; i < j; i += 64){
    keyFile += key.substr(i, 64) + '\n';
}

keyFile += '-----END ' + type + ' PRIVATE KEY-----\n';

var target = process.env.SSH_TUNNEL_TARGET.split(':');
var host = target[0];
var port = target[1];

var forwards = process.env.SSH_TUNNEL_FORWARDS.split(',');

fs.writeFile('tmp', keyFile, function(err){
    if (err){
        throw err;
    }
});

var args = ['-f', '-N', host, '-i', 'tmp', '-o', 'StrictHostKeyChecking=no',
'-o', 'ExitOnForwardFailure=yes'];

if (port){
    args.push('-p', port);
}

for (var i = 0; i < forwards.length; i++){
    args.push('-L', forwards[i]);
}

spawn('ssh', args)
    .on('error', function(err){
        throw err;
    });

fs.unlink('tmp', function(err){
    if (err){
        throw err;
    }
});
