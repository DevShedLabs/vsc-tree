import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function getConfig() {
    const config = vscode.workspace.getConfiguration('tree');
    return {
        enabled: config.get<boolean>('enabled', true),
        maxDepth: config.get<number>('maxDepth', 3),
        exclude: config.get<string[]>('exclude', ['node_modules', '.git', 'dist', 'out', '.vscode', '.cache', 'logs', 'build', 'temp', '.vscode-test', '.github', '.idea', '.DS_Store', 'TREE.md'])
    };
}

function isExcluded(name: string, exclude: string[]): boolean {
    return exclude.some(pattern => {
        // Simple pattern match: exact or wildcard
        if (pattern.endsWith('/**')) {
            return name.startsWith(pattern.slice(0, -3));
        }
        if (pattern.includes('*')) {
            // Convert glob to regex
            const regex = new RegExp('^' + pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$');
            return regex.test(name);
        }
        return name === pattern;
    });
}

function buildTree(dir: string, depth: number, maxDepth: number, exclude: string[], prefix = ''): string {
    if (depth > maxDepth) return '';
    let tree = '';
    let entries: string[] = [];
    try {
        entries = fs.readdirSync(dir);
    } catch {
        return '';
    }
    entries = entries.filter(e => !isExcluded(e, exclude));
    entries.sort();
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const fullPath = path.join(dir, entry);
        const isDir = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
        tree += `${prefix}${i === entries.length - 1 ? '└── ' : '├── '}${entry}\n`;
        if (isDir) {
            tree += buildTree(fullPath, depth + 1, maxDepth, exclude, prefix + (i === entries.length - 1 ? '    ' : '│   '));
        }
    }
    return tree;
}


function updateTreeMd() {
    const { enabled, maxDepth, exclude } = getConfig();
    if (!enabled) return;
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;
    const root = folders[0].uri.fsPath;
    const tree = buildTree(root, 1, maxDepth, exclude);
    const content = `# Project Tree\n\n\`\`\`\n${tree}\`\`\``;
    const treeMdPath = path.join(root, 'TREE.md');
    fs.writeFileSync(treeMdPath, content, 'utf8');
}

export function activate(context: vscode.ExtensionContext) {
    let paused = false;

    // Status bar item
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

    function updateStatusBar() {
        if (paused) {
            statusBar.text = 'Tree: Paused';
            statusBar.tooltip = 'Click to Run TREE.md update';
            statusBar.command = 'tree.runNow';
        } else {
            statusBar.text = 'Tree: Run';
            statusBar.tooltip = 'Click to Pause TREE.md updates';
            statusBar.command = 'tree.togglePause';
        }
    }

    function maybeUpdateTreeMd() {
        if (!paused) {
            updateTreeMd();
        }
    }

    statusBar.show();
    context.subscriptions.push(statusBar);

    // Initial TREE.md
    maybeUpdateTreeMd();

    // Watch for file/directory creation
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidCreate(() => maybeUpdateTreeMd());
    watcher.onDidDelete(() => maybeUpdateTreeMd());
    watcher.onDidChange(() => { }); // No-op, only update on create/delete
    context.subscriptions.push(watcher);

    // Watch for settings changes
    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (
            e.affectsConfiguration('tree.exclude') ||
            e.affectsConfiguration('tree.maxDepth') ||
            e.affectsConfiguration('tree.enabled')
        ) {
            maybeUpdateTreeMd();
        }
    });
    context.subscriptions.push(configWatcher);

    // Command for manual update
    const disposable = vscode.commands.registerCommand('tree.helloWorld', () => {
        maybeUpdateTreeMd();
        vscode.window.showInformationMessage('TREE.md updated!');
    });
    context.subscriptions.push(disposable);

    // Command to toggle pause/run
    const togglePause = vscode.commands.registerCommand('tree.togglePause', () => {
        paused = !paused;
        updateStatusBar();
        vscode.window.showInformationMessage(paused ? 'TREE.md updates paused.' : 'TREE.md updates running.');
    });
    context.subscriptions.push(togglePause);

    // Command to run TREE.md update immediately (when paused)
    const runNow = vscode.commands.registerCommand('tree.runNow', () => {
        updateTreeMd();
        vscode.window.showInformationMessage('TREE.md updated!');
    });
    context.subscriptions.push(runNow);

    updateStatusBar();
}

export function deactivate() { }
