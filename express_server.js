const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  key: ['key1', 'key2 '],
  secret: 'first secret',
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userId: "apple"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userId: "banana"
  }
};

const users = {
  "apple": {
    id: "apple",
    email: "user@example.com",
    password: "user1"
  },
 "banana": {
    id: "banana",
    email: "user2@example.com",
    password: "user2"
  }
}

app.get("/", (req, res) => {
  let userId = req.session["user_id"];
  if (userId in users) {
    let userObj = users[userId];
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }

});

app.get("/urls", (req, res) => {
  let userId = req.session["user_id"];
  if (userId in users) {
    let userObj = users[userId];
    let templateVars = {urls: urlsForUser(userId),
                        user: userObj};
    res.render("urls_index", templateVars);
    res.status(200);
  } else {
    res.render("error", res.status(401));
  }
});

function urlsForUser(id) {
  let filteredObj = {};
  for (let urlKey in urlDatabase) {
    if(id === urlDatabase[urlKey].userId) {
      filteredObj[urlKey] = {
        shortUrl: urlDatabase[urlKey].shortURL,
        longURL: urlDatabase[urlKey].longURL,
        userId: urlDatabase[urlKey].userId,
        ownedByCurrentUser: id == urlDatabase[urlKey].userId
      }
    }
  }
  return filteredObj;
}

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: req.body.longURL,
    userId: req.session['user_id']
  };
  if (req.session["user_id"] in users) {
    res.redirect(`http://localhost:${PORT}/urls/` + shortURL);
  } else {
    res.render("error", res.status(401));
  }
});

app.get("/urls/new", (req, res) => {
  let userId = req.session["user_id"];
  if (userId in users) {
    userObj = users[userId];
  } else {
    userObj = null;
  }
  let templateVars = { user: userObj };
    if (req.session["user_id"] in users) {
      res.render("urls_new", templateVars);
    } else {
      res.render("error", res.status(401));
    }
});

app.get("/urls/:id", (req, res) => {
  let userId = req.session["user_id"];
  if (req.params.id in urlDatabase === false) {
    res.status(404).send("Please make sure that you use the correct path");
  } else if (req.session["user_id"] in users === false) {
     res.render("error", res.status(401));
   } else if (req.session["user_id"] in users === true && req.session["user_id"] !== urlDatabase[req.params.id]["userId"]) {
     res.render("error", res.status(403));
   } else {
     let getShortURL = urlDatabase[req.params.id]["shortURL"];
     let getLongURL = urlDatabase[req.params.id]["longURL"];
     if (userId in users) {
       userObj = users[userId];
     } else {
       userObj = null;
     }
     let templateVars = { shortURL: req.params.id,
                          longURL: getLongURL,
                          user: userObj};
     res.render("urls_show", templateVars);
   }
});

app.post("/urls/:id", (req, res) => {
  let userId = req.session["user_id"];
  if (userId in users) {
    userObj = users[userId];
  } else {
    userObj = null;
  }
  urlDatabase[req.params.id]['longURL'] = req.body.longURL;
  // let templateVars = { shortURL: req.params.id,
  //                      longURL: req.body.longURL,
  //                      user: userObj};
  res.redirect(`http://localhost:${PORT}/urls`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]['longURL'];
  console.log(req.params);
  console.log(longURL);
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id]["userId"] === req.session["user_id"]) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.render("error", res.status(401));
  }
});

app.get("/register", (req, res)=> {
  res.render("urls_register");
});

app.post("/register", (req,res) => {
  const newUserId = generateRandomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPassword, 10);
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
                           password: hashedPassword
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
      console.log("loggedUserId: ", loggedUserId);
      console.log("loggedUserPassword: ", loggedUserPassword);
      console.log("users[elem]['password']: ", users[elem]["password"]);
      if(bcrypt.compareSync(loggedUserPassword, users[elem]["password"]) === true) {
        req.session['user_id'] = users[elem]["id"];
        res.redirect('/');
      }
    }
  }
  res.status(403).send("Username or password is not correct");
});

app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.redirect("/");
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
