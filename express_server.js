const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the view engine
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// makes urlDatabase accessible to urls_index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// error message page for no ID/long URL found
app.get('/u/error', (req, res) => {
  res.send('The requested URL does not exist.');
});

// responds to a POST with redirect to page with new id and input longURL
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// render the new tiny URL form
app.get("/urls/new", (req, res) => {
  res.render('urls_new');
});

// makes id (shortened URL) and long URL accessible to urls_show
app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render('urls_show', templateVars);
});

// click shortURL or request /u/shortURL = redirect to longURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id] === undefined) {
    return res.redirect('/u/error');
  } 
  const longURL = urlDatabase[id];
  if (longURL[0] !== "h") {
    return res.redirect(`http://${longURL}`);
  } 
  return res.redirect(longURL);
  
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// generate a random short URL ID
const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortURL = "";
  for (let i = 0; i < 6; i++) {
    shortURL += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return shortURL;
};