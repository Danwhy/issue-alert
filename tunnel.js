var fs = require('fs');
var exec = require('child_process').exec;
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
var port = target[1] ? '-p ' + target[1] : '';

var forwards = process.env.SSH_TUNNEL_FORWARDS.split(',')
    .map(function(element){
        return '-L ' + element;
    })
    .join(' ');

fs.writeFile('tmp', keyFile, function(err){
    if (err){
        throw err;
    }
});

exec('ssh -N ' + host  + ' ' + port + ' ' + forwards + ' -i tmp')
    .on('error', function(err){
        throw err;
    });

fs.unlink('tmp', function(err){
    if (err){
        throw err;
    }
});
