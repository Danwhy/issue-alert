var socket = io();

socket.on('issue', function(data){
    var newIss = document.createElement('p');
    newIss.innerHTML = data.new_val.issue;
    document.getElementById('insert').appendChild(newIss);
    console.log(data.new_val.issue);
});
