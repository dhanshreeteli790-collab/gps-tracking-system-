const express = require('express');
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");

const server = http.createServer(app);
const io = socketio(server);

//database creation
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin@211",
    database: "gps"
});

db.connect(err => {
    if (err) {
        console.log(err);

    } else {
        console.log("MySQL Connector");
    }
});



// view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// static folder (FIXED)
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({extended: true }));
app.use(express.json());

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));

// socket connection
// socket connection
const users = {}; // store users

io.on("connection", function(socket) {

    console.log("User connected:", socket.id);

    // ✅ ADMIN JOIN ROOM
    socket.on("join-admin", () => {
        socket.join("admin-room");
        console.log("Admin joined");
    });

    // ✅ RECEIVE USER LOCATION
   socket.on("send-location", function(data){

     const time = new Date().toLocaleTimeString();

    // ✅ create user only first time
    if (!users[socket.id]) {
        users[socket.id] = {
            username: data.username,
            latitude: data.latitude,
            longitude: data.longitude,
            path: []   // ⭐ VERY IMPORTANT
        };
    }

    // ✅ update location
    users[socket.id].latitude = data.latitude;
    users[socket.id].longitude = data.longitude;

    // ✅ STORE TIME WITH PATH
    users[socket.id].path.push({
        lat: data.latitude,
        lng: data.longitude,
        time: time
    });
    console.log("SERVER PATH:", users[socket.id].path);


db.query(
    "INSERT INTO user_locations (username, latitude, longitude) VALUES (?, ?, ?)",
    [data.username, data.latitude, data.longitude],
    (err, result) => {
        if (err) {
            console.log("❌ DB ERROR:", err);
        } else {
            console.log("✅ SAVED:", result);
        }
    }
);

    // send to admin
    io.to("admin-room").emit("update-users", users);
});


    // ✅ REMOVE USER WHEN DISCONNECTED
    socket.on("disconnect", function(){
        delete users[socket.id];

        // update admin again
        io.to("admin-room").emit("update-users", users);
    });

});
// route
app.get("/", (req, res) => {
    res.redirect("/login");
});
 

app.get("/login", (req, res) => {
    res.render("login");
});

//login page 
app.post("/login", (req, res) => {

    if (!req.body.username || !req.body.password) {
        return res.send("Username or password missing");
    }

    const username = req.body.username.trim();
    const password = req.body.password;

    db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, results) => {

            if (err) return res.send(err);

            if (results.length === 0) {
                return res.send("User not found");
            }

            const user = results[0];

            const match = bcrypt.compareSync(password, user.password);

            if (match) {
                req.session.user = user.username;
                res.redirect("/map");
            } else {
                res.send("Wrong Password");
            }
        }
    );
});

//register page
app.get("/register", async(req, res) => {
    res.render("register");
});

//register logic
app.post("/register", async (req, res) => {
    const{username, password} = req.body;

    const hash = await bcrypt.hash(password, 10);
    db.query(
        "insert into users(username, password) values (?, ?)",
        [username, hash],
        (err) => {
            if(err) return res.send(err);
            res.redirect("/login");
        }
    );
});

app.get("/map", (req, res) => {
    if (!req.session.user){
        return res.redirect("/login");
    }
    res.render("index", {username: req.session.user});
});


// admin page
app.get("/admin", function (req, res)  {
    res.render("admin");
});


//logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});


// server listen (FIXED)
server.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
});