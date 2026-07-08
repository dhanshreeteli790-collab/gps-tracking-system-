const socket = io({
    transports: ["websocket"]
});

// create map
const map = L.map("map").setView([0, 0 ], 5);

// add map tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

// store markers
const markers = {};

// get location continuously (LIVE movement)
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            console.log("My Location:", latitude, longitude);

            // send location to server
            socket.emit("send-location", {
                username: username,   // or dynamic later
                latitude,
                longitude
            });

            // auto center map to your location
            map.setView([latitude, longitude], 15);
        },
        (error) => console.log(error),
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// receive all users
socket.on("all-users", (users) => {

    for (let id in users) {
        const user = users[id];
        const latlng = [user.latitude, user.longitude];

        // update existing marker
        if (markers[id]) {
            markers[id].setLatLng(latlng);
        } else {
            // create new marker
            markers[id] = L.marker(latlng)
                .addTo(map)
                .bindPopup(user.username);
        }
    }

    // remove disconnected users
    for (let id in markers) {
        if (!users[id]) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    }

});