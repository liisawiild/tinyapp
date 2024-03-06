const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const PORT = 8080; // default port 8080

// generate a random short URL ID
const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortURL = "";
  for (let i = 0; i < 6; i++) {
    shortURL += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return shortURL;
};

// user lookup
const getUserByEmail = function(userEmail) {
  for (let key in users) {
    if (users[key].email === userEmail) {
      return users[key];
    }
  }
  return null;
};

// url database
const urlDatabase = {
  //shortURL: { longURL: "", userID: user_id}
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "aJ48lW"
  },
};

// users database
const users = {
  aJ48lW: { id: "aJ48lW" , email: "a@a.com", password: "123"}
};

// function to isolate logged in users URLs only (id = req.cookies["user_id"]).
const urlsForUser = function(id) {
  let userUrls = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userId) {
      userUrls[shortURL] = { longURL: urlDatabase[shortURL].longURL, userId: urlDatabase[shortURL].userId };
    }
  }
  return userUrls;
};

// set ejs as the view engine
app.set("view engine", "ejs");

// set encoding to read URLs
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// render the urls page; urlDatabase and user_id (for _header) are accessible
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send('You must be logged in to create a TinyURL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n');
  }

  const userUrls = urlsForUser(userId);
  const templateVars = { 
    urls: userUrls, 
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

// render the register page; user_id is accessible for _header
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    return res.redirect("/urls");
  }

  const templateVars = { 
    user: users[userId] 
  };
  res.render("register", templateVars);
});

// client submits a registration request, email, password, and user_id are save to users obj + edge case handling
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    return res.sendStatus(400);
  }

  if (getUserByEmail(req.body.email) !== null) {
    return res.sendStatus(400);
  }

  const user_id = generateRandomString();
  users[user_id] = { 
    id: user_id, 
    email: req.body.email, 
    password: req.body.password
  };
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

// renders the login page
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[userId] };
  res.render("login", templateVars);
});

// client submits a login request, server determines if user exists, saves user_id in cookie + edge cases
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);
  if (user === null || user.password !== password) {
    return res.sendStatus(403);
  }

  if (user.email && user.password === password) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }
});

// client requests to logout, server clears cookie and redirects to login page
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// client submits longURL, if logged in server saves longURL in database & redirects new tinyURL page
app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send('You must be logged in to create a TinyURL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n'); 
  }

  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = { 
    longURL: longURL,
    userId: userId 
  };
  res.redirect(`/urls/${id}`);
});

// if logged in, the server renders the new tiny URL form page
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login");
  }

  const templateVars = { 
    user: users[userId] 
  };
  res.render("urls_new", templateVars);
});

// renders tinyURL page that offers to update the longURL
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send('You must be logged in to create a TinyURL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n');
  }

  const urlObj = urlDatabase[req.params.id];
  if (!urlObj) {
    return res.status(404).send('This short URL does not exist.\n');
  }
  
  const urlBelongsToUser = userId === urlObj.userId
  if (!urlBelongsToUser) {
    return res.status(403).send('You do not own this URL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n');
  }

  const templateVars = {
    shortURL: req.params.id,
    longURL: urlObj.longURL,
    user: users[userId]
  }
  res.render("urls_show", templateVars);
});

// client requests to update long URL and redirects to the same page w/ changes to longURL made
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send('You must be logged in to create a TinyURL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n');
  }

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    return res.status(404).send('This short URL does not exist.\n');
  }
  
  const urlBelongsToUser = userId === urlObj.userId
  if (!urlBelongsToUser) {
    return res.status(403).send('You do not own this URL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n');
  }

  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// client request to delete an existing tinyURL on the my URLs page
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.cookies["user_id"];

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('This short URL does not exist.\n');
  }

  if (!userId) {
    return res.status(403).send('You must be logged in to create a TinyURL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n');
  }

  const urlObj = urlDatabase[shortURL];
  if (userId !== urlObj.userId) {
    return res.status(403).send('You do not own this URL. Please <a href="/login">login</a> or <a href="/register">register.</a>\n');
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// client request to go to the shortURL link redirects to longURL website + edge cases
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlObj = urlDatabase[shortURL];
  if (urlObj === undefined) {
    return res.redirect("/u/error");
  }

  const longURL = urlObj.longURL;
  if (longURL.startsWith("http://") || longURL.startsWith("https://")) {
    return res.redirect(longURL);
  }
  return res.redirect(`https://${longURL}`);
});

// error message page for no ID/long URL found
app.get("/u/error", (req, res) => {
  return res.status(404).send('This short URL does not exist.\n');
});

// client request will result in urlDatabase being sent to the client as a JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Establishes server connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


