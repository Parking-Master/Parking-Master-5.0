function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
function deleteAllCookies() {
  let cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    let eqPos = cookie.indexOf("=");
    let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

users = {
  serverURL: "https://parkingmaster-cloud.serveousercontent.com/Parking-Master-5.0",
  data: null,
  loggedIn: false,
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
          setCookie("s", sessionKey, 30);
          callback(true, 0);
          users.load(function() {
            callback(true, 1);
          });
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
  },
  sendPasswordReset: function(email, callback = () => {}) {
    fetch(users.serverURL + "/users/reset-password-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        verificationUrl: location.protocol + "//" + location.host + "/login.html"
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  resetPassword: function(email, verificationKey, newPassword, callback = () => {}) {
    fetch(users.serverURL + "/users/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        verificationKey: verificationKey,
        newPassword: newPassword
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  logout: function() {
    if (users.loggedIn) {
      let sessionKey = getCookie("s");
      fetch(users.serverURL + "/users/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionKey: sessionKey
        })
      }).then(function(response) {
        if (response.status == 200) {
          deleteAllCookies();
          localStorage.removeItem("user-cache");
          location.reload(true);
        }
      });
    }
  },
  load: function(callback = () => {}) {
    let sessionKey = getCookie("s");
    if (sessionKey) {
      users.loggedIn = true;
      if (localStorage["user-cache"]) users.data = JSON.parse(localStorage["user-cache"]);
      fetch(users.serverURL + "/users/get/" + sessionKey).then(function(response) {
        if (response.status == 200) {
          response.json().then(function(data) {
            users.data = data;
            localStorage.setItem("user-cache", JSON.stringify(data));
            callback();
          });
        }
      });
    }
  },
  set: function(key, value) {
    users.data[key] = value;
    if (users.loggedIn) {
      let sessionKey = getCookie("s");
      fetch(users.serverURL + "/users/set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionKey: sessionKey,
          key: key,
          value: value
        })
      }).then(function(response) {
        if (response.status == 200) {
          if (localStorage["user-cache"]) {
            let cache = JSON.parse(localStorage["user-cache"]);
            cache[key] = value;
            localStorage.setItem("user-cache", JSON.stringify(cache));
          }
        }
      });
    }
  }
};
users.load();