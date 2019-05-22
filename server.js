const express = require('express'),
      server = express();

server.set('port', process.env.PORT || 3000);

server.get('/', (request,response)=>{
  response.send('Home page');
});

server.get('/downloadBiorxiv', (request,response)=>{
  downloadBiorxiv();
  response.send('Started job');
});

server.use((request,response)=>{
  response.type('text/plain');
  response.status(404);
  response.send('Error');
});

server.listen(3000, ()=>{
  console.log('Yea');
});