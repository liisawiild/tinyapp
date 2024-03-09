const chai = require('chai');
const chaiHttp = require("chai-http");
const assert = chai.assert;
const expect = chai.expect;
const { getUserByEmail } = require('../helpers.js');

chai.use(chaiHttp);

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUser = testUsers["userRandomID"];
    assert.strictEqual(user.email, expectedUser.email);
  });

  it('should return undefined if no valid email', function() {
    const user = getUserByEmail("user3@example.com", testUsers)
    assert.isNull(user);
  });
});


/**AI generated chai-http testing: it did not register the 302 status code set as the redirect was 200. After testing this with a mentor I'm commenting it out, but it all works manually */

describe('Testing URL access and login with session cookie and redirects', function() {
  let agent = chai.request.agent('http://localhost:8080');

  it('Should redirect to /login for / route when user is not logged in', function() {
    return agent
      .get('/')
      .then(function(res) {
        expect(res).to.redirectTo('http://localhost:8080/login');
      });
  });

  it('Should redirect to /login for /urls/new route when user is not logged in', function() {
    return agent
      .get('/urls/new')
      .then(function(res) {
        expect(res).to.redirectTo('http://localhost:8080/login');
      });
  });

  it('Should return 403 for /urls/:id route when user is not logged in', function() {
    return agent
      .get('/urls/b2xVn2') // Assuming :id is replaced with an actual ID
      .then(function(res) {
        expect(res).to.have.status(403);
      });
  });

 
  it('Should return 403 after login for /urls/b2xVn2 route', function() {
    // First, perform login request
    return agent
      .post('/login')
      .send({ email: 'user2@example.com', password: 'dishwasher-funk' })
      .then(function(res) {
        expect(res).to.have.status(200); // Assuming login is successful

        // Then, perform GET request to /urls/b2xVn2
        return agent
          .get('/urls/b2xVn2')
          .then(function(res) {
            expect(res).to.have.status(403);
          });
      });
  });

  // Cleanup: Closing agent after all tests
  after(function() {
    agent.close();
  });
});