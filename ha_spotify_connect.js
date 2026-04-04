
(function queueReceiver() {
    async function poll() {
        try {
            const res = await fetch("http://localhost:5000/poll");
            const data = await res.json();
            if (!data.track) return;

            await Spicetify.addToQueue([{ uri: data.track }]);
            Spicetify.showNotification(`Added to queue`);
        } catch (e) {
            console.error("[QueueReceiver]", e);
        }
    }

    setInterval(poll, 2000);
})();
