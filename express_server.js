const express = require("express");
const { generateRandomString, urlsForUser, getUserByEmail } = require('./helpers');
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
app.use(cookieSession({
  name: 's3curs3$s!on',
  keys: ['gr33negg$', 'dontDO!t', 'anDh@m', ]
}));
const PORT = 8080; // default port 8080

const urlDatabase = {
  //shortURL: { longURL: "", userId: userId}
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "zYiS3Y"
  },
  "9sm5xK": {
    longURL: "http://www.google.ca",
    userId: "zYiS3Y"
  },
};

const users = {
  //userId: { id: userId,  email: "", password: hashedPassword}
  zYiS3Y: {
    id: "zYiS3Y",
    email: "bob@gmail.com",
    password: "$2a$10$Ux.vuUZ/HYt2WJswfb9GA.EVAKQi1O067hOd.CQ4MCIfbo4nHGRma"
  }
};

// set ejs as the view engine
app.set("view engine", "ejs");

// set encoding to read URLs
app.use(express.urlencoded({ extended: true }));

// decode JSON from testing with chai-http (requests not coming from a form)
app.use(express.json());

// homepage
app.get("/", (req, res) => {
  const userIdCookie = req.session.userId;
  if (!userIdCookie) {
    return res.redirect("/login");
  }

  if (userIdCookie) {
    return res.redirect('/urls');
  }
  
});

// server renders the urls page; urlDatabase and userId are accessible to _header
app.get("/urls", (req, res) => {
  const userIdCookie = req.session.userId;
  if (!userIdCookie) {
    return res.status(403).send('Access Denied. Please <a href="/login">LOGIN</a> or <a href="/register">REGISTER</a> to proceed.\n');
  }

  const userUrls = urlsForUser(userIdCookie, urlDatabase);
  const templateVars = {
    urls: userUrls,
    user: users[userIdCookie]
  };
  res.render("urls_index", templateVars);
});

// server renders the register page; userId is accessible to _header
app.get("/register", (req, res) => {
  const userIdCookie = req.session.userId;
  if (userIdCookie) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[userIdCookie]
  };
  res.render("register", templateVars);
});

// client submits a registration request; email, hashed password, and userId are saved to users obj; encrypted cookie set
app.post("/register", (req, res) => {
  const reqEmail = req.body.email;
  const reqPassword = req.body.password;

  const emptyEmail = reqEmail === "";
  const emptyPassword = reqPassword === "";
  if (emptyEmail || emptyPassword) {
    return res.send('Invalid email or password. Please try to <a href="/register">REGISTER</a> again.\n');
  }

  const userFound = getUserByEmail(reqEmail, users) !== null;
  if (userFound) {
    return res.send('Email exists in database. Please <a href="/login">LOGIN</a> instead.\n');
  }

  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(reqPassword, 10);
  users[userId] = {
    id: userId,
    email: reqEmail,
    password: hashedPassword
  };
  req.session.userId = userId;
  res.redirect("/urls");
});

// server renders the login page if logged in
app.get("/login", (req, res) => {
  const userIdCookie = req.session.userId;
  if (userIdCookie) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[userIdCookie]
  };
  res.render("login", templateVars);
});

// client submits a login request, server determines if user exists, and if so finds user's cookie
app.post("/login", (req, res) => {
  const reqEmail = req.body.email;
  const reqPassword = req.body.password;
  const user = getUserByEmail(reqEmail, users);
  if (user === null || bcrypt.compareSync(reqPassword, user.password) === false) {
    return res.send('Invalid email or password. Please try to <a href="/login">LOGIN</a> again, or <a href="/register">REGISTER</a> for an account to proceed.\n');
  }

  if (user !== null && bcrypt.compareSync(reqPassword, user.password) === true) {
    req.session.userId = user.id;
    return res.redirect("/urls");
  }
});

// client requests to logout, server clears cookie and redirects to login page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// client submits longURL, if logged in server saves longURL in database & redirects new tinyURL page
app.post("/urls", (req, res) => {
  const userIdCookie = req.session.userId;
  if (!userIdCookie) {
    return res.status(403).send('Access Denied. Please <a href="/login">LOGIN</a> or <a href="/register">REGISTER to proceed.</a>\n');
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: userIdCookie
  };
  res.redirect(`/urls/${shortURL}`);
});

// server renders tinyURL creation form if logged in
app.get("/urls/new", (req, res) => {
  const userIdCookie = req.session.userId;
  if (!userIdCookie) {
    return res.redirect("/login");
  }

  const templateVars = {
    user: users[userIdCookie]
  };
  res.render("urls_new", templateVars);
});

// server renders tinyURL page that offers to update the longURL
app.get("/urls/:id", (req, res) => {
  const userIdCookie = req.session.userId;
  if (!userIdCookie) {
    return res.status(403).send('Access Denied. Please <a href="/login">LOGIN</a> or <a href="/register">REGISTER to proceed.</a>\n');
  }

  const shortURL = req.params.id;
  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    return res.status(404).send('This short URL does not exist. <a href="/urls">GO BACK</a>\n');
  }
  
  const urlBelongsToUser = userIdCookie === urlObj.userId;
  if (!urlBelongsToUser) {
    return res.status(403).send('You do not own this URL. <a href="/login">LOGIN</a> to the correct account or <a href="/urls">GO BACK</a>\n');
  }

  const templateVars = {
    shortURL: shortURL,
    longURL: urlObj.longURL,
    user: users[userIdCookie]
  };
  res.render("urls_show", templateVars);
});

// client requests to update long URL and redirects to the same page w/ changes to longURL made
app.post("/urls/:id", (req, res) => {
  const userIdCookie = req.session.userId;
  if (!userIdCookie) {
    return res.status(403).send('Access Denied. Please <a href="/login">LOGIN</a> or <a href="/register">REGISTER to proceed.</a>\n');
  }

  const shortURL = req.params.id;
  const shortUrlObj = urlDatabase[shortURL];
  if (!shortUrlObj) {
    return res.status(404).send('This short URL does not exist. <a href="/urls">GO BACK</a>\n');
  }
  
  const urlBelongsToUser = userIdCookie === shortUrlObj.userId;
  if (!urlBelongsToUser) {
    return res.status(403).send('You do not own this URL. <a href="/login">LOGIN</a> to the correct account or <a href="/urls">GO BACK</a>\n');
  }

  const longURL = req.body.longURL;
  shortUrlObj.longURL = longURL;
  res.redirect('/urls');
});

// client request to delete an existing tinyURL on the my URLs page
app.post("/urls/:id/delete", (req, res) => {
  const userIdCookie = req.session.userId;
  if (!userIdCookie) {
    return res.status(403).send('Access Denied. Please <a href="/login">LOGIN</a> or <a href="/register">REGISTER to proceed.</a>\n');
  }
  
  const shortURL = req.params.id;
  const shortUrlObj = urlDatabase[shortURL];
  if (!shortUrlObj) {
    return res.status(404).send('This short URL does not exist. <a href="/urls">GO BACK</a>\n');
  }
  
  const urlBelongsToUser = userIdCookie === shortUrlObj.userId;
  if (!urlBelongsToUser) {
    return res.status(403).send('You do not own this URL. <a href="/login">LOGIN</a> to the correct account or <a href="/urls">GO BACK</a>\n');
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// server redirects to the longURL website through shortURL link
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const shortUrlObj = urlDatabase[shortURL];
  if (!shortUrlObj) {
    return res.status(404).send(`This short URL does not exist. <a href="/urls">GO BACK</a>\n`);
  }

  const longURL = shortUrlObj.longURL;
  if (longURL.startsWith("http://") || longURL.startsWith("https://")) {
    return res.redirect(longURL);
  }

  res.redirect(`https://${longURL}`);
});

// server sends urlDatabase as JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Establishes server connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


