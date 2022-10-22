let express = require('express')
let app = express()
let bodyParser = require('body-parser')
let bcrypt = require('bcrypt')

require('dotenv').config()

const postgres = require('postgres')
const e = require('express')
const sql = postgres(
  `postgresql://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
  {
    username: `${process.env.DB_USER}`,
    password: `${process.env.DB_PASSWORD}`,
  }
)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

// Session
let userId = null
let name = null

async function checkUser(email, pass, res) {
  const hasUser = await sql`
   SELECT id, name, password FROM users WHERE email = ${email} 
   `
  console.log(hasUser)
  if (hasUser.length === 1) {
    const encryPass = hasUser[0].password
    bcrypt.compare(pass, encryPass, (err, isMatch) => {
      if (isMatch) {
        userId = hasUser[0].id
        name = hasUser[0].name
        res.redirect(`/display.html`)
        return
      } else if (err) {
        console.log('error', err)
      }
      res.redirect(401, '/login.html')
    })
  }
}
app.post('/login', async function (req, res) {
  console.log(req.body)
  await checkUser(req.body.email, req.body.password, res)
})

async function registerUser(name, email, pass) {
  const addUser = sql`
      INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${pass}) returning id, name
   `
  return addUser.execute()
}
app.post('/register', async function (req, res) {
  console.log(req.body)
  if (req.body.password !== req.body.confirmPassword) {
    res.redirect(400, '/register.html')
  } else {
    let hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = await registerUser(
      req.body.name,
      req.body.email,
      hashedPassword
    )

    userId = user[0].id
    name = user[0].name
    res.redirect('/display.html')
  }
})

function addWeblink(name, url) {
  const addLink = sql`
      INSERT INTO links (name, url, user_id) VALUES (${name}, ${url}, ${userId})
   `
  addLink.execute()
}
app.get('/addWeblink', function (req, res) {
  console.log(req.query)
  addWeblink(req.query.name, req.query.url)
  res.redirect('/display.html')
})

function deleteWeblink(id) {
  const ids = [].concat(id)
  ids.forEach((id) => {
    const deleteLink = sql`
         DELETE FROM links WHERE id = ${id} AND user_id = ${userId}
      `
    deleteLink.execute()
  })
}
app.get('/deleteWeblink', function (req, res) {
  console.log(req.query + 'meme')
  if (req.query.action === 'delete') {
    deleteWeblink(req.query.id)
  }
  res.redirect('/display.html')
})

function updateWeblink(id, name, url) {
  const ids = [].concat(id)
  const names = [].concat(name)
  const urls = [].concat(url)
  for (let i = 0; i < ids.length; i++) {
    const updateLink = sql`
         UPDATE links SET name = ${names[i]}, url = ${urls[i]} WHERE id = ${ids[i]}
      `
    updateLink.execute()
  }
}
app.get('/updateWeblink', function (req, res) {
  console.log(req.query)
  if (req.query.action === 'update') {
    updateWeblink(req.query.id, req.query.name, req.query.url)
  }
  res.redirect('/display.html')
})

async function getWeblinks() {
  const getLinks = sql`
      SELECT * FROM links WHERE user_id = ${userId}
   `
  return getLinks
}
app.get('/getWeblinks', async function (req, res) {
  res.send(await getWeblinks())
})

app.use('/logout', (req, res) => {
  res.redirect('/login.html')
})
let server = app.listen(5000, function () {
  let host = server.address().address
  let port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
