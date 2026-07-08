const socket = io("https://provoke-citric-tumbling.ngrok-free.dev");

// join admin
socket.emit("join-admin");

// map
const map = L.map("map").setView([20.5937, 78.9629], 20);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

let markers = {};
let paths = {};

// ✅ ADD THIS LINE
let selectedUserId = null;

socket.on("update-users", (users) => {

    console.log("Admin data:", users);

    if (!users) return;

    document.getElementById("users").innerHTML = "";

    for (let id in users) {

        const user = users[id];

        console.log("USER PATH:", user.path);

        // skip invalid data
        if (user.latitude == null  || user.longitude == null ) continue;

        // =====================
        // 📌 SIDEBAR UI
        // =====================
const div = document.createElement("div");
div.className = "user";

div.innerHTML = `
    <strong>${user.username}</strong><br>
    Lat: ${user.latitude}<br>
    Lng: ${user.longitude}<br>
    Time: ${user.path?.slice(-1)[0]?.time || "N/A"}
`;

// ✅ ADD CLICK HERE
div.onclick = () => {
    selectedUserId = id;

    // zoom to that user
    map.setView([user.latitude, user.longitude], 5);
};

document.getElementById("users").appendChild(div);

        // =====================
        // 📍 MARKER (LIVE UPDATE)
        // =====================
        if (markers[id]) {
            markers[id].setLatLng([user.latitude, user.longitude]);
        } else {
            markers[id] = L.marker([user.latitude, user.longitude])
                .addTo(map)
                .bindPopup(user.username);
        }

       
   // =====================
// 🟦 PATH TRACKING
// =====================

if (selectedUserId === id) {
if (!paths[id]) {

    const colors = ["red", "blue", "green", "orange"];

    paths[id] = L.polyline([], {
        color: colors[Math.floor(Math.random() * colors.length)],
        weight: 4
    }).addTo(map);
}

const latlngs = (user.path || []).map(p => [p.lat, p.lng]);
paths[id].setLatLngs(latlngs);

    }
}
});