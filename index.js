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
  <a class="option" href="#" data-disabled>Log out</a>
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
}