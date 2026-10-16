import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import { cloneJSON } from "discourse/lib/object";
import discoveryFixtures from "discourse/tests/fixtures/discovery-fixtures";
import pretender, { response } from "discourse/tests/helpers/create-pretender";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

const GIST = "A short AI summary of this topic.";

// The first topic carries a gist, the second does not. Core's topic cell renders
// topic-list-after-title too, so this runs without Horizon installed.
const latest = cloneJSON(discoveryFixtures["/latest.json"]);
const [withGist, withoutGist] = latest.topic_list.topics;
withGist.ai_topic_gist = GIST;
delete withoutGist.ai_topic_gist;

const row = (topic) => `.topic-list-item[data-topic-id="${topic.id}"]`;

acceptance("Horizon AI Gists", function (needs) {
  needs.pretender((server, helper) => {
    server.get("/latest.json", () => helper.response(cloneJSON(latest)));
  });

  let originalHidden;

  needs.hooks.beforeEach(function () {
    localStorage.clear();
    originalHidden = settings.gist_hidden_categories;
  });

  needs.hooks.afterEach(function () {
    settings.gist_hidden_categories = originalHidden;
  });

  test("renders the gist on topics that have one", async function (assert) {
    await visit("/latest");

    assert.dom(`${row(withGist)} .horizon-ai-gist`).hasText(GIST);
    assert
      .dom(`${row(withGist)} .horizon-ai-gist`)
      .hasAttribute(
        "aria-hidden",
        "true",
        "kept out of the title's accessible name"
      );
  });

  test("renders nothing on topics without a gist", async function (assert) {
    await visit("/latest");

    assert.dom(`${row(withoutGist)} .horizon-ai-gist`).doesNotExist();
  });

  test("hides the gist in gist_hidden_categories", async function (assert) {
    settings.gist_hidden_categories = String(withGist.category_id);

    await visit("/latest");

    assert.dom(`${row(withGist)} .horizon-ai-gist`).doesNotExist();
  });

  test("escapes the gist instead of rendering it as HTML", async function (assert) {
    const html = "<b>bold</b>";
    const escaped = cloneJSON(latest);
    escaped.topic_list.topics[0].ai_topic_gist = html;
    pretender.get("/latest.json", () => response(200, escaped));

    await visit("/latest");

    assert.dom(`${row(withGist)} .horizon-ai-gist b`).doesNotExist();
    assert.dom(`${row(withGist)} .horizon-ai-gist`).hasText(html);
  });
});
