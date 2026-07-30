users = {
  serverURL: "https://parkingmaster-cloud.serveousercontent.com/Parking-Master-5.0",
  login: function(username, password, callback = () => {}) {
    fetch(users.serverURL + "/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    }).then(function(response) {
      if (response.status == 200) {
        response.text().then(sessionKey => {
          alert(sessionKey);
          callback(true);
        });
      } else {
        callback(false, 0);
      }
    }).catch(function() {
      callback(false, 1);
    });
  },
  signup: function(email, username, password, callback = () => {}) {
    fetch(users.serverURL + "/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        username: username,
        password: password,
        verificationUrl: location.protocol + "//" + location.host + "/verify.html"
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  verify: function(email, verificationKey, callback = () => {}) {
    fetch(users.serverURL + "/users/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        verificationKey: verificationKey
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  }
};