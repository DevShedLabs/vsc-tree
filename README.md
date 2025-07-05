# Tree

This is a simple extension that generates a `TREE.md` file each time a directory or new file is added to the project.

## Extension Settings

This extension contributes the following settings:

* `tree.maxDepth`: Maximum depth to display in TREE.md (default: 3).
* `tree.exclude`: Glob patterns to exclude from TREE.md (default: `["node_modules", ".git", "dist", "out"]`).


## Example Output

```
├── CHANGELOG.md
├── LICENSE.txt
├── README.md
├── TREE.md
├── eslint.config.mjs
├── package-lock.json
├── package.json
├── src
│   ├── extension.ts
│   └── test
│       └── extension.test.ts
├── tree-0.0.1.vsix
├── tsconfig.json
├── vsc-extension-quickstart.md
└── webpack.config.js
```


## Release Notes
v0.0.1 - Initial release
v0.0.2 - Added Pause / Run in the status bar for Tree and added some more default ignores.

