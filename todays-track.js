(() => {
    const status = document.getElementById("todays-track-status");
    const link = document.getElementById("todays-track-link");
    const thumbnail = document.getElementById("todays-track-thumbnail");
    const title = document.getElementById("todays-track-title");

    if (!status || !link || !thumbnail || !title) return;

    const dateParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());
    const dateValues = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const todayInJapan = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;

    fetch(`data/todays-track.json?date=${todayInJapan}`, { cache: "no-store" })
        .then((response) => {
            if (!response.ok) throw new Error("Track data is unavailable.");
            return response.json();
        })
        .then((data) => {
            const track = data.dailyTrack;
            if (
                !track ||
                track.date !== todayInJapan ||
                !/^[A-Za-z0-9_-]+$/.test(track.videoId || "") ||
                !track.title ||
                !/^https:\/\/i\.ytimg\.com\//.test(track.thumbnailUrl || "")
            ) {
                throw new Error("Today's track is not available yet.");
            }

            link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(track.videoId)}`;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.setAttribute("aria-label", `Watch ${track.title} on YouTube`);
            thumbnail.src = track.thumbnailUrl;
            thumbnail.alt = `Thumbnail for ${track.title}`;
            title.textContent = track.title;
            status.hidden = true;
            link.hidden = false;
        })
        .catch(() => {
            status.textContent = "Today's track is being updated. / 今日の一曲を更新中です。";
        });
})();
