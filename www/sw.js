self.addEventListener("push", (event) => {
  console.log(event);
  event.waitUntil(self.registration.showNotification(event.data.json().title, event.data.json()));
});

self.onnotificationclick = function (event) {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => clients.openWindow(event.notification.data.url))
  );
};

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
