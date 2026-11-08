#!/bin/sh
cd "$(dirname "$0")" && { cat shell.html; echo '<script>'; cat core.js; echo; cat recipes.js; echo; cat app.js; echo; cat options.js; echo; cat boot.js; echo '</script>'; } > index.html && wc -c index.html
