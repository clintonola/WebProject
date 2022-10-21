var express = require('express');
var app = express();
var bodyParser = require('body-parser');

const postgres = require('postgres');
const sql = postgres('postgresql://host:port/database', {
    username: '',
    password: '',
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session
let userId = null;
let name = null;

function checkUser(email, pass) {
   const hasUser = sql`
      SELECT id, name FROM users WHERE email = ${email} AND password = ${pass}
   `;
   return hasUser;
}
app.post('/login', async function (req, res) {
   console.log(req.body);
   const user = await checkUser(req.body.email, req.body.password);
   if (user.length > 0) {
      userId = user[0].id;
      name = user[0].name;
      res.redirect(`/display.html`);
   } else {
      res.redirect(401, '/login.html');
   }
})

function registerUser(name, email, pass) {
   const addUser = sql`
      INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${pass})
   `;
   return addUser.execute();
}
app.post('/register', function (req, res) {
   console.log(req.body);
   if (req.body.password !== req.body.confirmPassword) {
      res.redirect(400, '/register.html');
   } else {
      registerUser(req.body.name, req.body.email, req.body.password);
      const user = checkUser(req.body.email, req.body.password);
      userId = user[0].id;
      name = user[0].name;
      res.redirect('/display.html');
   }
})

function addWeblink(name, url) {
   const addLink = sql`
      INSERT INTO links (name, url, user_id) VALUES (${name}, ${url}, ${userId})
   `;
   addLink.execute();
}
app.get('/addWeblink', function (req, res) {
   console.log(req.query);
   addWeblink(req.query.name, req.query.url);
   res.redirect('/display.html')
})

function deleteWeblink(id) {
   const ids = [].concat(id);
   ids.forEach(id => {
      const deleteLink = sql`
         DELETE FROM links WHERE id = ${id} AND user_id = ${userId}
      `;
      deleteLink.execute();
   })
}
app.get('/deleteWeblink', function (req, res) {
   console.log(req.query);
   if (req.query.action === 'delete') {
      deleteWeblink(req.query.id);
   }
   res.redirect('/display.html')
})

function updateWeblink(id, name, url) {
   const ids = [].concat(id);
   const names = [].concat(name);
   const urls = [].concat(url);
   for(let i = 0; i < ids.length; i++) {
      const updateLink = sql`
         UPDATE links SET name = ${names[i]}, url = ${urls[i]} WHERE id = ${ids[i]}
      `;
      updateLink.execute();
   }
}
app.get('/updateWeblink', function (req, res) {
   console.log(req.query);
   if (req.query.action === 'update') {
      updateWeblink(req.query.id, req.query.name, req.query.url);
   }
   res.redirect('/display.html')
})

async function getWeblinks() {
   const getLinks = sql`
      SELECT * FROM links WHERE user_id = ${userId}
   `;
   return getLinks;
}
app.get('/getWeblinks', async function (req, res) {
   res.send(await getWeblinks());
})

var server = app.listen(5000, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})