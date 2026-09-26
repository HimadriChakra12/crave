#define OUTFILE "dist/crave.user.js"
//#define BUILD_WITH_MUJS
#include "build.h"
//#include "mujscompiler.h"

#define NAME        "Crave"
#define NAMESPACE   "https://github.com/HimadriChakra12/bundlejs"
#define DESCRIPTION "Kagi-like power features on Brave Search: domain blocking/boosting, lenses, Google quick-links, Wikipedia infobox, inline calculator, Google Maps popup, plus a lightweight mode that trims trackers/autoplay/animations for lower RAM/CPU/network use"

listmatch(
    "https://search.brave.com/*",
    );

listgrant(
    "GM_getValue",
    "GM_setValue"
    );

listextra(
    { "icon",        "https://brave.com/static-assets/images/brave-favicon.png" },
    { "homepageURL", "https://github.com/HimadriChakra12/bundlejs" },
    { "updateURL",   "https://raw.githubusercontent.com/HimadriChakra12/bundlejs/main/dist/crave.user.js" },
    { "downloadURL", "https://raw.githubusercontent.com/HimadriChakra12/bundlejs/main/dist/crave.user.js" },
    );

/* Loaded first: its own top-level state (the shared observer) has to be
   initialized before craveMain() -- which runs synchronously later in this
   same script, from inside the GOOGLE group -- starts calling into it. */
#define PREFS group( \
    "src/prefs/observer.js", \
    "src/prefs/network.js",  \
    "src/prefs/media.js",    \
    "src/prefs/motion.js",   \
    "src/prefs/main.js",     \
    )

#define GOOGLE group( \
    "src/google/config.js",   \
    "src/google/ui.js",       \
    "src/google/lenses.js",   \
    "src/google/settings.js", \
    "src/google/main.js",     \
    )

#define KAGI group( \
    "src/kagi/bang.js",       \
    "src/kagi/categories.js", \
    "src/kagi/tracker.js",    \
    "src/kagi/archive.js",    \
    "src/kagi/within.js",     \
    )

listorder(
    "src/start.js",
    PREFS
    GOOGLE
    KAGI
    "src/end.js",
    );

declaremeta(
    .name        = NAME,
    .namespace_  = NAMESPACE,
    .description = DESCRIPTION,
    .match       = MATCH, .match_count = MATCH_COUNT,
    .grant       = GRANT, .grant_count = GRANT_COUNT,
    .run_at      = "document-end",
    .extra       = EXTRA, .extra_count = EXTRA_COUNT,
);

int main(void) {
    build_t b;
    build_init(&b, NULL, NULL);
    build_userscript_header(&b, &META);
    build_add_all(&b, ORDER, ORDER_COUNT, "src/");
    build_finish(&b, NULL);
    return 0;
}
