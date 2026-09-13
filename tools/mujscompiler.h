#ifndef MUJSCOMPILER_H
#define MUJSCOMPILER_H

#ifndef BUILD_WITH_MUJS
#error "mujscompiler.h: #define BUILD_WITH_MUJS before #include \"build.h\" -- \
then #include \"mujscompiler.h\" after it. Without BUILD_WITH_MUJS defined \
first, build.h already compiled no-op stubs of these functions, and this \
header can't safely replace them."
#endif

#include <mujs.h>

static void mujs_syntax_check(const char *code, const char *label)
{
    const char *what = label ? label : "<bundle>";

    js_State *J = js_newstate(NULL, NULL, JS_STRICT);
    if (!J) {
        fprintf(stderr, "mujscompiler: could not create MuJS state\n");
        exit(1);
    }


    if (js_ploadstring(J, what, code)) {
        fprintf(stderr, "mujscompiler: syntax error in %s:\n  %s\n",
                what, js_trystring(J, -1, "unknown error"));
        js_freestate(J);
        exit(1);
    }

    js_pop(J, 1);
    js_freestate(J);
}

static void mujs_check_all(const char *const *paths, size_t count,
                            const char *strip_prefix)
{
    for (size_t i = 0; i < count; i++) {
        long len;
        char *content = build__read_file(paths[i], &len);

        const char *display = paths[i];
        if (strip_prefix) {
            size_t plen = strlen(strip_prefix);
            if (strncmp(paths[i], strip_prefix, plen) == 0)
                display = paths[i] + plen;
        }

        printf("mujscompiler: checking %s ...\n", display);
        mujs_syntax_check(content, display);
        free(content);
    }
    printf("mujscompiler: %zu source file(s) OK\n", count);
}

#define mujs_check_order(paths, count, strip_prefix) \
    mujs_check_all((paths), (count), (strip_prefix))

static void mujs_check_bundle(const build_t *b)
{

    mujs_syntax_check(b->out, "bundle");
    printf("mujscompiler: bundle OK (%zu bytes)\n", b->out_len);
}

static void mujs_check_full(const build_t *b,
                             const char *const *paths, size_t count,
                             const char *strip_prefix)
{
    mujs_check_all(paths, count, strip_prefix);
    mujs_check_bundle(b);
}

#endif
