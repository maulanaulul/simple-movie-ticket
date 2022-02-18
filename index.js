const http = require('http')
const express = require('express')
const path = require('path')
const { dirname } = require('path')
const hbs = require('hbs')
const swal = require('sweetalert')

// Memanggil express
const app = express()

app.use(express.json())

app.set('view engine', 'hbs')

app.use('/public', express.static(path.join(__dirname, 'public')))

let identUser = 0


hbs.registerPartials(__dirname + '/views/partials')

// setting connection
const dbConnection = require('./connection/db')

// setting encode f to b
app.use(express.urlencoded({ extended: false }))

// setting express session
const session = require('express-session')
app.use(
    session({
        cookie: {
            maxAge: 2 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true
        },
        store: new session.MemoryStore(),
        saveUninitialized: false,
        resave: false,
        secret: 'secretValue'
    })
)

// Setting middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message
    delete req.session.message
    res.locals.user = req.session.user
    next()
})

// setting multer
const uploadFile = require('./middlewares/uploadFile')

//setting folder upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// setting path file img
const pathFile = "http://localhost:4000/uploads/"


app.get('/', function (req, response) {

    const query = `SELECT * FROM tb_movie;`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            let movies = []

            for (let result of results) {
                movies.push({
                    ...result,
                    image: pathFile + result.image
                })
            }

            if (movies == 0) {
                movies = false
            }

            response.render('index', {

                isLogin: req.session.isLogin,
                isAdmin: req.session.isAdmin,
                movies

            })
        })
    })

})

app.get('/about', function (req, response) {
    const title = "About"
    response.render('about', {
        title: title,
        isLogin: req.session.isLogin,
        isAdmin: req.session.isAdmin
    })
})

app.get('/movie', function (req, response) {

    const query = `SELECT * FROM tb_movie;`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            let movies = []

            for (let result of results) {
                movies.push({
                    ...result,
                    image: pathFile + result.image
                })
            }


            if (movies == 0) {
                movies = false
            }

            response.render('movie', {

                isLogin: req.session.isLogin,
                isAdmin: req.session.isAdmin,
                movies

            })
        })
        conn.release()
    })



})

app.get('/movieOrder/:id', function (req, res) {
    var { id } = req.params

    const query = `SELECT * FROM tb_movie WHERE id = ${id};`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            const movie = {
                ...results[0],
                image: pathFile + results[0].image
            }

            res.render('movieOrder', {

                isLogin: req.session.isLogin,
                isAdmin: req.session.isAdmin,
                movie

            })
        })
        conn.release()
    })
})

app.get('/login', function (req, response) {
    const title = "Login"

    response.render('login', {
        title: title,
        isLogin: req.session.isLogin,
        isAdmin: req.session.isAdmin

    })
})

app.post('/register', function (req, res) {
    // register
    const { emailReg, passwordReg, nameReg } = req.body
    const query = `INSERT INTO tb_user (email, password, fullname) VALUES ('${emailReg}','${passwordReg}', '${nameReg}');`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            req.session.message = {
                type: "alert-success",
                message: "Register Success, Please Login to your account!",
                label: "Danger:"
            }
            swal("Good job!", "You clicked the button!", "success");

            res.redirect('/login')
        })
        conn.release()
    })
})

app.post('/login', function (req, res) {
    const { emailLogin, passwordLogin } = req.body

    const query = `SELECT id, fullname, email, MD5(password) FROM tb_user where email = '${emailLogin}' AND password = '${passwordLogin}';`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            if (results.length == 0) {
                req.session.message = {
                    type: "alert-danger",
                    message: "Your email or password might wrong!",
                    label: "Danger:"
                }
                return res.redirect('/login')
            }



            else {
                req.session.isLogin = true
                req.session.user = {
                    id: results[0].id,
                    fullname: results[0].fullname,
                    email: results[0].email,

                }
                identUser = results[0].id
                if (emailLogin == 'admin@gmail.com' && passwordLogin == 'admin') {
                    req.session.isAdmin = true
                }
                return res.redirect('/')

                // cek value pada field user level 
            }

        })
        conn.release()
    })
})

app.get('/logout', function (req, res) {
    req.session.destroy()
    res.redirect('/')

})

// app.get('/account', function(req, response){
//     const title = "Account"
//     response.render('account',{
//         title: title,
//         isLogin:  req.session.isLogin,
//         isAdmin:req.session.isAdmin
//     })
// })

app.get('/dashboard', function (req, response) {
    const title = "Dashboard"
    response.render('dashboard', {
        title: title,
        isLogin: req.session.isLogin,
        isAdmin: req.session.isAdmin
    })
})

app.post('/add-movie', uploadFile('image'), function (req, res) {
    const { title, hours, genre } = req.body
    const image = req.file.filename

    const query = `INSERT INTO tb_movie (name, movie_hour, image, type_id) VALUES ('${title}', '${hours}', '${image}', ${genre});`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            req.session.message = {
                type: "alert-success",
                message: "Register Success, Please Login to your account!",
                label: "Danger:"
            }
            swal("Good job!", "You clicked the button!", "success");

            res.redirect('/dashboard')
        })
        conn.release()
    })
})

app.post('/ticket/:id', function (req, res) {
    var { id } = req.params
    const { date, time, userId, movieId } = req.body
    const pUserId = parseInt(userId)
    const pMovieId = parseInt(movieId)
    const ticketNumber = Date.now()

    const query = `INSERT INTO tb_ticket (ticket_number, date_show, time_show, price, movie_id, user_id) VALUES ('${ticketNumber}', '${date}', '${time}', 20000, ${pMovieId}, ${pUserId});`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            req.session.message = {
                type: "alert-success",
                message: "Register Success, Please Login to your account!",
                label: "Danger:"
            }
            swal("Good job!", "You clicked the button!", "success");

            res.redirect(`/ticket/${id}`)
        })
        conn.release()
    })
})

app.get('/ticket/:id', function (req, res) {
    var { id } = req.params

    const query = `SELECT * FROM tb_ticket WHERE user_id = '${id}';`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            const ticket = {
                ...results[0]
            }

            res.render('ticket', {

                isLogin: req.session.isLogin,
                isAdmin: req.session.isAdmin,
                ticket

            })
        })
        conn.release()
    })
})

app.post('/payment/:id', function (req, res) {
    var { id } = req.params
    const { price, quantity } = req.body
    const total = price * quantity

    const query = `INSERT INTO tb_payment (amount, sub_total, ticket_id) VALUES ('${quantity}', '${total}', '${id}');`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            req.session.message = {
                type: "alert-success",
                message: "Register Success, Please Login to your account!",
                label: "Danger:"
            }
            swal("Good job!", "You clicked the button!", "success");

            res.redirect('/account')
        })
        conn.release()
    })
})

app.get('/account', function (req, res) {

    const userId = req.session.user.id

    const query = `SELECT fullname, name, ticket_number, date_show, time_show, price, amount, sub_total FROM tb_movie INNER JOIN tb_ticket ON tb_ticket.movie_id = tb_movie.id INNER JOIN tb_payment ON tb_payment.ticket_id = tb_ticket.id INNER JOIN tb_user ON tb_ticket.user_id = tb_user.id  WHERE tb_user.id = ${identUser} ;`
 
    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            console.log(query)
            let amounts = []

            for (let result of results) {
                amounts.push({
                    ...result
                })
            }

            if (amounts == 0) {
                amounts = false
            }

            res.render('account', {

                isLogin: req.session.isLogin,
                isAdmin: req.session.isAdmin,
                amounts

            })
        })
        conn.release()
    })
})

app.get('/delete/:id', function (req, res) {
    var { id } = req.params

    const query = `DELETE FROM tb_movie WHERE id = ${id};`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err



            res.render('movieOrder', {

                isLogin: req.session.isLogin,
                isAdmin: req.session.isAdmin,


            })
        })
        conn.release()
    })
})


app.get('/update/:id', function (req, res) {
    var { id } = req.params

    const query = `SELECT * FROM tb_movie WHERE id = ${id};`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            const edit = {
                ...results[0]
            }

            res.render('editMovie', {

                isLogin: req.session.isLogin,
                isAdmin: req.session.isAdmin,
                edit

            })
        })
        conn.release()
    })
})

app.post('/edit-movie/:id', uploadFile('image'), function (req, res) {
    var { id } = req.params
    const { title, hours, genre } = req.body

    // const query = `INSERT INTO tb_movie (name, movie_hour, image, type_id) VALUES ('${title}', '${hours}', '${image}', ${genre});`

    const query = `UPDATE tb_movie
    SET name = '${title}', movie_hour = '${hours}', type_id = '${genre}'
    WHERE id = ${id};`

    dbConnection.getConnection((err, conn) => {
        if (err) throw err

        conn.query(query, (err, results) => {
            if (err) throw err

            req.session.message = {
                type: "alert-success",
                message: "Register Success, Please Login to your account!",
                label: "Danger:"
            }
            swal("Good job!", "You clicked the button!", "success");

            res.redirect(`/movieOrder/${id}`)
        })
        conn.release()
    })
})
app.unsubscribe(express.json())

const port = 4000
const server = http.createServer(app)
server.listen(port)

console.debug(`Server running on port ${port}`)
