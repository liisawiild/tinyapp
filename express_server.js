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
}


// set ejs as the view engine
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// makes urlDatabase accessible to urls_index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

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

// logs user in
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
});

// logout - clear cookie and redirect to /urls
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// error message page for no ID/long URL found
app.get("/u/error", (req, res) => {
  res.send("The requested URL does not exist.");
});

// responds to a POST with redirect to page with new id and input longURL
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

// render the new tiny URL form page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

// makes id (shortened URL) and long URL accessible to urls_show
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

// update long URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

// clicking delete button removes the table row on "/" associated with the id(shortURL)
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

// click shortURL or request /u/shortURL = redirect to longURL
// edge cases: no matching id = error; no protocol (http://) = add protocol & redirect
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Establishes server connection
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


