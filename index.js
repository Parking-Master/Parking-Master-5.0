tippy("[data-tippy-content]");
let currentProgress = 0;
function animate() {
  if (currentProgress >= 100) return document.querySelector(".loading-banner").style.opacity = 0;
  currentProgress += 2;
  document.querySelector(".loading-progress").textContent = currentProgress + "%";
  requestAnimationFrame(animate);
}
animate();
function openSettings() {
  let content = document.createElement("div");
  content.innerHTML = `
  <h2>Options</h2>
  <a class="option" href="#" onclick="this.dataset.disabled = 'disabled', users.logout()" data-disabled>Log out</a>
  <a class="option" href="/account.html" data-disabled>Edit Profile</a>
  <a class="option" href="#">Performance</a>
  <h2>More</h2>
  <a class="option" href="/users.html">Leaderboard</a>
  <a class="option" href="/clips.html" data-disabled>Your Game Clips</a>
  <a class="option" href="https://github.com/Parking-Master/Parking-Master-5.0/issues">Report a Bug</a>
  `;
  swal({
    content: content,
    button: "Close"
  });
  if (users.loggedIn) document.querySelectorAll(".swal-content a.option").forEach(link => link.removeAttribute("data-disabled"));
}
function openLobbies() {
  document.querySelector(".lobbies").classList.toggle("opened");
}
function createLobby() {
  swal({
    text: "Enter Lobby Name (3-20 characters):",
    content: "input",
    buttons: ["Cancel", "Next"]
  }).then(function(lobbyName) {
    if (lobbyName) {
      if (lobbyName.length >= 3 && lobbyName.length <= 20) {
        let loading = document.createElement("div");
        loading.className = "swal-spinner";
        swal({
          content: loading,
          button: false
        });
        users.createLobby(lobbyName, function() {
          swal({
            icon: "success",
            text: "Your Lobby was created! Wait for other players to join it.",
            button: "Close"
          }).then(function() {
            document.querySelector(".lobbies .lobby-wrapper").innerHTML = `
            <a href="/multiplayer.html?lobby=${lobbyName}" class="lobby" style="outline:4px solid #47b3ff"><span class="lobby-name">${lobbyName}</span><span class="lobby-date">${new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></a>
            ` + document.querySelector(".lobbies .lobby-wrapper").innerHTML;
          });
        });
      } else {
        swal({
          icon: "error",
          text: "Lobby Name must be between 3-20 characters.",
          button: "Try Again"
        }).then(() => createLobby());
      }
    }
  });
}
if (users.loggedIn) {
  document.querySelector(".account .profile-picture").style.backgroundImage = "url(" + users.data.profilePicture + ")";
  document.querySelector(".account .username").textContent = users.data.username;
  document.querySelector(".account .points").textContent = users.data.points + " PTS";
  document.querySelector(".nav-button-login").innerHTML = "Log out";
  document.querySelector(".nav-button-login").parentElement.href = "#";
  document.querySelector(".nav-button-login").parentElement.onclick = function() {
    document.querySelector(".nav-button-login").disabled = "disabled";
    document.querySelector(".nav-button-login").innerHTML = `<span class="btn-loader"></span>`;
    users.logout();
  };
  document.querySelector(".nav-button-signup").remove();
  let vehicleNames = {
    "Honda_Civic": "2019 Honda Civic Sport Touring",
    "Toyota_RAV4": "2023 Toyota RAV4",
    "Mini_Cooper": "2014 Mini Cooper S",
    "Ford_Victoria": "2010 Ford Crown Victoria",
    "Ford_F150": "2017 Ford F-150 Raptor",
    "Chevy_Camaro": "2017 Chevrolet Camaro"
  };
  document.querySelector(".current-car-image").src = "/images/cars/" + users.data.currentCar + ".png";
  document.querySelector(".current-car-text").innerHTML = `<span style="font-weight:600">${vehicleNames[users.data.currentCar].split(" ")[0]}</span> ${vehicleNames[users.data.currentCar].split(" ").splice(1).join(" ").toUpperCase()}</p>`;
} else {
  document.querySelector(".account .profile-picture").remove();
  document.querySelector(".account .username").remove();
  document.querySelector(".account .points").textContent = (localStorage["points"] || 0) + " PTS";
  document.querySelector(".account").style = "width: auto; top: 24px; right: 25px";
}
users.getLobbies(function(lobbies) {
  lobbies = lobbies.reverse();
  for (let i = 0; i < lobbies.length; i++) {
    document.querySelector(".lobbies .lobby-wrapper").innerHTML += `
    <a href="/multiplayer.html?lobby=${lobbies[i].name}" class="lobby"><span class="lobby-name">${lobbies[i].name}</span><span class="lobby-date">${new Date(lobbies[i].creationDate).toLocaleDateString() + " " + new Date(lobbies[i].creationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></a>
    `;
  }
});