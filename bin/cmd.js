#!/usr/bin/env node
require("../lib/cli")
    .run()
    .then(
        results => {
            console.log(results);
            process.exit(0);
        },
        error => {
            console.error(error);
            process.exit(1);
        }
    );
