#!/usr/bin/node
const af = require('async-file');
const mustache = require('mustache');

(async function () {
    const cwd = process.cwd();

    const jsrequire = await af.readFile(`${cwd}/require.mustache`, 'utf8');
    const jsauth = await af.readFile(`${cwd}/auth.mustache`, 'utf8');

    const data = {
        jsrequire,
        jsauth
    };

    const files = [
        "postEvents",
        "createObject",
        "createOwner"
    ];

    await af.mkdirp(`${cwd}/dist`);

    for (let filename of files) {
        const templatePath = `${cwd}/${filename}.mustache`;
        const distPath = `${cwd}/dist/${filename}.js`;

        const template = await af.readFile(templatePath, 'utf8');

        const rendered = mustache.render(template, data);

        await af.writeFile(distPath, rendered);
    }
})();