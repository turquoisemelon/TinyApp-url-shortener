const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "user1"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "user2"
  }
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let userId = req.cookies["user_id"];
  if (userId in users) {
    userObj = users[userId];
  } else {
    userObj = null;
  }
  let templateVars = {urls: urlDatabase,
                      user: userObj};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  urlDatabase[shortURL] = req.body.longURL;
  console.log(req.body);  // debug statement to see POST parameters
  res.redirect("http://localhost:3000/urls/" + shortURL);
});

app.get("/urls/new", (req, res) => {
  let userId = req.cookies["user_id"];
  if (userId in users) {
    userObj = users[userId];
  } else {
    userObj = null;
  }
  let templateVars = { user: userObj };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let userId = req.cookies["user_id"];
  if (userId in users) {
    userObj = users[userId];
  } else {
    userObj = null;
  }
  let templateVars = { shortURL: req.params.id,
                       longURL: urlDatabase[req.params.id],
                       user: userObj};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let userId = req.cookies["user_id"];
  if (userId in users) {
    userObj = users[userId];
  } else {
    userObj = null;
  }
  let templateVars = { shortURL: req.params.id,
                       longURL: req.body.longURL,
                       user: userObj};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(req.params);
  console.log(longURL);
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  console.log(req.params);
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/register", (req, res)=> {
  res.render("urls_register");
});

app.post("/register", (req,res) => {
  newUserId = generateRandomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  newUserEmail = req.body.email;
  newUserPassword = req.body.password;
  let existingUserEmail;
  for (element in users) {
    if(users[element]['email'] === newUserEmail) {
      existingUserEmail = newUserEmail;
    }
  }

  if(newUserEmail === '' || newUserPassword === '') {
    res.status(400).send("Please type a valid email and password");
  } else {
    for (element in users) {
      if(users[element]['email'] === newUserEmail) {
        existingUserEmail = newUserEmail;
      }
    }
    if(existingUserEmail !== undefined) {
      res.status(400).send("User already exists");
    } else {
      users[newUserId] = { id : newUserId,
                           email: newUserEmail,
                           password: newUserPassword
                         };
      res.cookie('user_id', newUserId);
      console.log(users);
      res.redirect("/");
    }
  }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) => {
  let loggedUserEmail = req.body.email;
  let loggedUserPassword = req.body.password;
  let loggedUserId;
  for (var elem in users) {
    if(users[elem]["email"] === loggedUserEmail) {
      loggedUserId = users[elem]["id"];
    }
  }
  if(!loggedUserId) {
      res.status(403).send("This user doesn't exist.");
  } else {
    if(users[loggedUserId]["password"] !== loggedUserPassword) {
      res.status(403).send("Your password is incorrect.");
    }
  }
  res.cookie('user_id', loggedUserId);
  res.redirect('/');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString(length, chars) {
  let result = "";
  for (var i = length; i > 0; i--) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
 return result;
}
