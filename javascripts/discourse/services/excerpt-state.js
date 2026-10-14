import { tracked } from "@glimmer/tracking";
import Service from "@ember/service";

// Stand-in for the `excerptState` service the "Topic Excerpts & AI Gists Button"
// component injects but does not ship (it expects a topic-list-excerpts component
// built for core's list, not Horizon's cards). Only the two members the button uses.
// A component that also defines service:excerpt-state should not be installed alongside.
const KEY = "horizonPrefersExcerpt";

function stored() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false; // storage blocked: fall back to not preferring excerpts
  }
}

export default class ExcerptState extends Service {
  @tracked prefersExcerpt = stored();

  toggleExcerpt() {
    this.prefersExcerpt = !this.prefersExcerpt;
    try {
      localStorage.setItem(KEY, this.prefersExcerpt ? "1" : "0");
    } catch {
      // storage blocked: the choice lasts until reload
    }
  }
}
