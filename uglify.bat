rem cnpm i -g uglify-es
call uglifyjs ./pages/index/index.js -o ./pages/index/index.js -c -m
call uglifyjs ./pages/detail/index.js -o ./pages/detail/index.js -c -m
call uglifyjs ./pages/center/index.js -o ./pages/center/index.js -c -m
call uglifyjs ./pages/picture/index.js -o ./pages/picture/index.js -c -m
call uglifyjs ./pages/history/index.js -o ./pages/history/index.js -c -m
call uglifyjs ./pages/search/index.js -o ./pages/search/index.js -c -m
call uglifyjs ./pages/feedback/index.js -o ./pages/feedback/index.js -c -m
call uglifyjs ./pages/subject/index.js -o ./pages/subject/index.js -c -m
call uglifyjs ./pages/subject_select/index.js -o ./pages/subject_select/index.js -c -m
