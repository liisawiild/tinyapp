// generate a random short URL ID
const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortURL = "";
  for (let i = 0; i < 6; i++) {
    shortURL += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return shortURL;
};

// function to isolate logged in users URLs only (id = req.cookies["user_id"]).
const urlsForUser = function(id, database) {
  let userUrls = {};
  for (let shortURL in database) {
    if (id === database[shortURL].userId) {
      userUrls[shortURL] = { longURL: database[shortURL].longURL, userId: database[shortURL].userId };
    }
  }
  return userUrls;
};

// lookup user in database by email
const getUserByEmail = function(userEmail, database) {
  for (let user in database) {
    if (database[user].email === userEmail) {
      return database[user];
    }
  }
  return null;
};

module.exports = { generateRandomString, urlsForUser, getUserByEmail };