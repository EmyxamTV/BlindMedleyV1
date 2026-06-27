import { test } from "@japa/runner";
import { sanitizeTrackText } from "#services/track_sanitizer";

test.group("track sanitizer", () => {
  test("removes import noise without stripping useful credits", ({ assert }) => {
    assert.equal(sanitizeTrackText("Song Title - 2011 Remaster"), "Song Title");
    assert.equal(sanitizeTrackText("Song Title (Remastered 2009)"), "Song Title");
    assert.equal(sanitizeTrackText("Song Title [Radio Edit]"), "Song Title");
    assert.equal(sanitizeTrackText("Stairway to Heaven - Remaster"), "Stairway to Heaven");
    assert.equal(sanitizeTrackText("Start Me Up - Remastered 2009"), "Start Me Up");
    assert.equal(sanitizeTrackText("Start Me Up - 2009 Re-Mastered"), "Start Me Up");
    assert.equal(sanitizeTrackText("(I Can't Get No) Satisfaction - Mono"), "(I Can't Get No) Satisfaction");
    assert.equal(sanitizeTrackText("Rage Against The Machine - XX (20th Anniversary Special Edition)"), "Rage Against The Machine");
    assert.equal(sanitizeTrackText("By the Way (Deluxe Edition)"), "By the Way");
    assert.equal(sanitizeTrackText("Second Helping (Expanded Edition)"), "Second Helping");
    assert.equal(sanitizeTrackText("Hybrid Theory (Bonus Edition)"), "Hybrid Theory");
    assert.equal(sanitizeTrackText("Slowhand 35th Anniversary"), "Slowhand");
    assert.equal(sanitizeTrackText("Song Title (feat. Artist)"), "Song Title");
    assert.equal(sanitizeTrackText("Song Title ft. Artist"), "Song Title");
    assert.equal(sanitizeTrackText("Song Title - Artist Remix"), "Song Title");
    assert.equal(sanitizeTrackText("Song Title (Club Mix)"), "Song Title");
    assert.equal(sanitizeTrackText("Rollin' (Air Raid Vehicle)"), "Rollin'");
    assert.equal(sanitizeTrackText("Rocket Man (I Think It's Going To Be A Long, Long Time)"), "Rocket Man");
    assert.equal(sanitizeTrackText("Snow (Hey Oh)"), "Snow");
    assert.equal(sanitizeTrackText("The 1975"), "The 1975");
    assert.equal(sanitizeTrackText("Déjà Vu - Édition spéciale"), "Déjà Vu - Édition spéciale");
  });
});
