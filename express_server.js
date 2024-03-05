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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  //user_id: { id: "" , email: "", password: "",},  should it be JSON?
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
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

// render the register page; user_id is accessible for _header
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
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
  users[user_id] = { id: user_id, email: req.body.email, password: req.body.password};
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

// renders the login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
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

// error message page for no ID/long URL found
app.get("/u/error", (req, res) => {
  res.send("The requested URL does not exist.");
});

// client submits longURL, server saves longURL in database & redirects new tinyURL page
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

// renders the new tiny URL form page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

// renders tinyURL page that offers to update the longURL
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

// client requests to update long URL and redirects to the same page w/ changes to longURL made
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

// client request to delete an existing tinyURL on the my URLs page
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

// client request to go to the shortURL link redirects to longURL website + edge cases
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id] === undefined) {
    return res.redirect("/u/error");
  }
  const longURL = urlDatabase[id];
  if (longURL.startsWith("http://") || longURL.startsWith("https://")) {
    return res.redirect(longURL);
  }
  return res.redirect(`https://${longURL}`);
});

// client request will result in urlDatabase being sent to the client as a JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Establishes server connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


