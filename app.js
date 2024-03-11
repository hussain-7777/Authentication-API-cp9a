const express = require('express')
const app = express()
app.use(express.json())
path = require('path')
dbPath = path.join(__dirname, 'userData.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

let db = null
const initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initDBAndServer()

// post/register User API
app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashPassword = await bcrypt.hash(password, 10)
  const dbUserQuery = `select * from user where username = '${username}';`
  const dbUser = await db.get(dbUserQuery)
  if (dbUser === undefined && password.length >= 5) {
    const createUserQuery = `insert into user 
    (username, name, password, gender, location) values 
    ('${username}', '${name}', '${hashPassword}', '${gender}', '${location}');`
    const newUser = await db.run(createUserQuery)
    response.send('User created successfully')
  } else if (dbUser !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
  }
})

// login API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const dbUserQuery = `select * from user where username = '${username}';`
  const dbUser = await db.get(dbUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isValidPassword = await bcrypt.compare(password, dbUser.password)
    if (isValidPassword) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// Update user API
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const dbUserQuery = `select * from user where username = '${username}';`
  const dbUser = await db.get(dbUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const newHashPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `update user set
        password = '${newHashPassword}';`
        await db.run(updatePasswordQuery)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
