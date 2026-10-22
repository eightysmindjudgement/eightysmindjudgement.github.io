import test from "node:test";
import assert from "node:assert/strict";
import { chooseDailyTrack, createTrackDocument, getJstDate } from "./update-todays-track.mjs";

const videos = [
    { videoId: "video-a", title: "Track A", thumbnailUrl: "https://i.ytimg.com/a.jpg", publishedAt: "2025-01-01T00:00:00Z", watchUrl: "https://www.youtube.com/watch?v=video-a" },
    { videoId: "video-b", title: "Track B", thumbnailUrl: "https://i.ytimg.com/b.jpg", publishedAt: "2025-01-02T00:00:00Z", watchUrl: "https://www.youtube.com/watch?v=video-b" },
    { videoId: "video-c", title: "Track C", thumbnailUrl: "https://i.ytimg.com/c.jpg", publishedAt: "2025-01-03T00:00:00Z", watchUrl: "https://www.youtube.com/watch?v=video-c" }
];

test("JST date changes at midnight Japan time", () => {
    assert.equal(getJstDate(new Date("2026-10-22T14:59:59Z")), "2026-10-22");
    assert.equal(getJstDate(new Date("2026-10-22T15:00:00Z")), "2026-10-23");
});

test("selection is stable on the same date even when the video list changes", () => {
    const first = chooseDailyTrack(videos, null, "2026-10-22");
    const updatedList = [...videos, { videoId: "video-0", title: "New Video", thumbnailUrl: "https://i.ytimg.com/new.jpg", publishedAt: "2026-10-22T00:00:00Z" }];
    assert.deepEqual(chooseDailyTrack(updatedList, first, "2026-10-22"), first);
});

test("selection changes the next day when multiple videos are available", () => {
    const today = chooseDailyTrack(videos, null, "2026-10-22");
    const tomorrow = chooseDailyTrack(videos, today, "2026-10-23");
    assert.notEqual(tomorrow.videoId, today.videoId);
});

test("daily track title, thumbnail, and destination come from the same video", () => {
    const track = chooseDailyTrack(videos, null, "2026-10-22");
    const source = videos.find(({ videoId }) => videoId === track.videoId);
    assert.equal(track.title, source.title);
    assert.equal(track.thumbnailUrl, source.thumbnailUrl);
    assert.equal(track.watchUrl, `https://www.youtube.com/watch?v=${track.videoId}`);
});

test("an update on the same day preserves the saved selection", () => {
    const initial = createTrackDocument(videos, null, "2026-10-22", new Date("2026-10-22T01:00:00Z"));
    const changedVideos = [...videos, { videoId: "video-0", title: "New Video", thumbnailUrl: "https://i.ytimg.com/new.jpg", publishedAt: "2026-10-22T00:00:00Z", watchUrl: "https://www.youtube.com/watch?v=video-0" }];
    const updated = createTrackDocument(changedVideos, initial, "2026-10-22", new Date("2026-10-22T03:00:00Z"));
    assert.deepEqual(updated.dailyTrack, initial.dailyTrack);
    assert.equal(updated.videos.length, videos.length + 1);
});
