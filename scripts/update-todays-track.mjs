import { createHash, randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

export const CHANNEL_ID = "UChh-9Ik4sCslLBSzaKTD7Sg";
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(SCRIPT_DIR, "..", "data", "todays-track.json");
const API_BASE = "https://www.googleapis.com/youtube/v3";

export function getJstDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function makeWatchUrl(videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function normalizeVideo({ videoId, title, thumbnailUrl, publishedAt }) {
    if (!videoId || !title || !thumbnailUrl) {
        throw new Error("YouTube returned a video without required metadata.");
    }
    return { videoId, title, thumbnailUrl, publishedAt, watchUrl: makeWatchUrl(videoId) };
}

export function chooseDailyTrack(videos, previousTrack, date) {
    if (previousTrack?.date === date && previousTrack.videoId) {
        return previousTrack;
    }
    if (!Array.isArray(videos) || videos.length === 0) {
        throw new Error("No public videos were returned; keeping the previous data file.");
    }

    const sortedVideos = [...videos].sort((a, b) => a.videoId.localeCompare(b.videoId));
    const digest = createHash("sha256").update(`${CHANNEL_ID}:${date}`).digest();
    let index = digest.readUInt32BE(0) % sortedVideos.length;
    if (sortedVideos.length > 1 && sortedVideos[index].videoId === previousTrack?.videoId) {
        index = (index + 1) % sortedVideos.length;
    }
    const selected = normalizeVideo(sortedVideos[index]);
    return { date, ...selected };
}

export function createTrackDocument(videos, previousDocument, date, now = new Date()) {
    const dailyTrack = chooseDailyTrack(videos, previousDocument?.dailyTrack, date);
    const videosChanged = JSON.stringify(videos) !== JSON.stringify(previousDocument?.videos ?? null);
    const trackChanged = JSON.stringify(dailyTrack) !== JSON.stringify(previousDocument?.dailyTrack ?? null);
    const updatedAt = videosChanged || trackChanged
        ? now.toISOString()
        : previousDocument?.updatedAt ?? now.toISOString();

    return {
        channelId: CHANNEL_ID,
        updatedAt,
        videos,
        dailyTrack
    };
}

async function youtubeList(resource, params, apiKey) {
    const url = new URL(`${API_BASE}/${resource}`);
    for (const [key, value] of Object.entries({ ...params, key: apiKey })) {
        url.searchParams.set(key, value);
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`YouTube Data API request failed (HTTP ${response.status}).`);
    }
    const result = await response.json();
    if (result.error) {
        throw new Error(`YouTube Data API returned an error (${result.error.code ?? "unknown"}).`);
    }
    return result;
}

export async function fetchPublicVideos(apiKey) {
    const channelResult = await youtubeList("channels", {
        part: "contentDetails",
        id: CHANNEL_ID,
        fields: "items(contentDetails(relatedPlaylists(uploads)))"
    }, apiKey);
    const uploadsPlaylistId = channelResult.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) throw new Error("The channel uploads playlist was not found.");

    const videoIds = [];
    let pageToken;
    const seenPageTokens = new Set();
    do {
        const page = await youtubeList("playlistItems", {
            part: "snippet",
            playlistId: uploadsPlaylistId,
            maxResults: "50",
            fields: "nextPageToken,items(snippet(resourceId(videoId)))",
            ...(pageToken ? { pageToken } : {})
        }, apiKey);
        for (const item of page.items ?? []) {
            const id = item.snippet?.resourceId?.videoId;
            if (id) videoIds.push(id);
        }
        pageToken = page.nextPageToken;
        if (pageToken && seenPageTokens.has(pageToken)) {
            throw new Error("YouTube returned a repeated playlist page token.");
        }
        if (pageToken) seenPageTokens.add(pageToken);
    } while (pageToken);

    const uniqueIds = [...new Set(videoIds)];
    const publicVideos = [];
    for (let offset = 0; offset < uniqueIds.length; offset += 50) {
        const batch = uniqueIds.slice(offset, offset + 50);
        const result = await youtubeList("videos", {
            part: "snippet,status",
            id: batch.join(","),
            maxResults: "50",
            fields: "items(id,snippet(title,publishedAt,thumbnails),status(privacyStatus))"
        }, apiKey);
        for (const video of result.items ?? []) {
            if (video.status?.privacyStatus !== "public") continue;
            const thumbs = video.snippet?.thumbnails ?? {};
            const thumbnail = thumbs.maxres ?? thumbs.high ?? thumbs.medium ?? thumbs.standard ?? thumbs.default;
            if (!thumbnail?.url) continue;
            publicVideos.push(normalizeVideo({
                videoId: video.id,
                title: video.snippet?.title,
                thumbnailUrl: thumbnail.url,
                publishedAt: video.snippet?.publishedAt ?? ""
            }));
        }
    }

    return publicVideos.sort((a, b) => a.videoId.localeCompare(b.videoId));
}

async function readPreviousData(path) {
    try {
        return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") return null;
        throw new Error("Existing track JSON could not be read; preserving it.");
    }
}

export async function updateTrackData({ apiKey, dataFile = DATA_FILE, now = new Date() }) {
    if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY environment variable.");
    const previous = await readPreviousData(dataFile);
    const videos = await fetchPublicVideos(apiKey);
    const document = createTrackDocument(videos, previous, getJstDate(now), now);
    const serialized = `${JSON.stringify(document, null, 2)}\n`;
    if (previous && JSON.stringify(previous) === JSON.stringify(document)) {
        console.log(`Track data is unchanged for ${getJstDate(now)}.`);
        return document;
    }

    const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
    await writeFile(temporaryFile, serialized, "utf8");
    await rename(temporaryFile, dataFile);
    console.log(`Saved ${videos.length} public videos for ${getJstDate(now)}.`);
    return document;
}

async function main() {
    await updateTrackData({ apiKey: process.env.YOUTUBE_API_KEY });
}

if (typeof process !== "undefined" && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
