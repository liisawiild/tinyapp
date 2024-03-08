// generate a random short URL ID
const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortURL = "";
  for (let i = 0; i < 6; i++) {
    shortURL += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return shortURL;
};

// lookup user in database by email
const getUserByEmail = function(userEmail, database) {
  for (let user in database) {
    if (database[user].email === userEmail) {
      return database[user];
    }
  }
  return undefined;
};

module.exports = { generateRandomString, getUserByEmail }