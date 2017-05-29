#!/usr/local/bin/python
from jinja2 import Template, Environment, FileSystemLoader
import os

# Capture our current directory
THIS_DIR = os.path.dirname(os.path.abspath(__file__))

def render_templates():
    j2_env = Environment(
        loader=FileSystemLoader(THIS_DIR),
        trim_blocks=True
    )

    context = {
        "jsrequire": j2_env.get_template("require.js.j2").render(),
        "jsauth": j2_env.get_template("auth.js.j2").render()
    }

    files = [
        "post-events.js",
        "create-object.js",
        "create-owner.js"
    ]
    for file in files:
        filename = THIS_DIR + "/dist/" + file
        print filename
        with open(filename, 'w') as f:
            f.write(j2_env.get_template(file + '.j2').render(context))

if __name__ == '__main__':
    render_templates()