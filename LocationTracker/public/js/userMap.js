const socket = io("https://provoke-citric-tumbling.ngrok-free.dev");



// 🌍 initialize map
const map = L.map('map').setView([20.5937, 78.9629], 20);

// 🗺️ load map tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "© OpenStreetMap"
}).addTo(map);

let marker;

// 🔵 LIVE PATH
let path = [];
let polyline = L.polyline(path, { color: "blue" }).addTo(map);


// 📍 get live location
if (navigator.geolocation) {

    navigator.geolocation.watchPosition(
        (position) => {

            const { latitude, longitude } = position.coords;

            console.log("My Location:", latitude, longitude); // ✅ DEBUG

            // ✅ SEND TO SERVER

            socket.emit("join-user", username);
            socket.emit("send-location", {
                username: username,
                latitude: latitude,
                longitude: longitude
            });


               // 🔵 ADD PATH
            path.push([latitude, longitude]);
            polyline.setLatLngs(path);

            // ✅ show on map
            if (marker) {
                marker.setLatLng([latitude, longitude]);
            } else {
                marker = L.marker([latitude, longitude]).addTo(map);
            }

            map.setView([latitude, longitude], 5);

        },
        (error) => {
            console.error("Location error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );

} else {
    alert("Geolocation not supported");
}