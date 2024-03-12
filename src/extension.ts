// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	log('extension active');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ansible-go-to-definition.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ansible-go-to-definition!');
	});
	context.subscriptions.push(disposable);

    const provider = new AnsibleDefinitionProvider();
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: 'ansible' }, provider));
}

class AnsibleDefinitionProvider implements vscode.DefinitionProvider {
    public async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | vscode.DefinitionLink[]> {
		const line: string = document.lineAt(position.line).text;
		const currentWordRange: string = document.getText(document.getWordRangeAtPosition(position));
		if (lineIsFileProperty(line))
		{
			return await getFilesLocationsFromWordRange(currentWordRange);
		}
		if (lineIsRole(line))
		{
			return await getRolesLocationsFromWordRange(currentWordRange);
		}

		return await getVarLocationsFromWordRange(currentWordRange);    
	}
}

async function getVarLocationsFromWordRange(currentWordRange: string) {
	log(`Looking for ${currentWordRange}`);

	const pattern: string = `\\s*${currentWordRange}\\s*:`;
	const regex = new RegExp(pattern);

	const playbookFiles = await vscode.workspace.findFiles('**/*playbook*.{yml,yaml}');
	const playbookDirFiles = await vscode.workspace.findFiles('**/playbooks/**/*.{yml,yaml}');
	const roleVarsFiles = await vscode.workspace.findFiles('**/vars/**/*');
	const hostVarsFiles = await vscode.workspace.findFiles('**/host_vars/**/*');
	const groupVarsFiles = await vscode.workspace.findFiles('**/group_vars/**/*');
	const roleDefaultsFiles = await vscode.workspace.findFiles('**/defaults/**/*');
	const ymlFiles = await vscode.workspace.findFiles('**/*.{yml,yaml}');
	const allFiles = [
		...playbookFiles,
		...playbookDirFiles,
		...roleVarsFiles,
		...hostVarsFiles,
		...groupVarsFiles,
		...roleDefaultsFiles,
		...ymlFiles
	];

	const filesSet = new Set(allFiles.map(file => file.fsPath));
	const files = Array.from(filesSet).map(path => vscode.Uri.file(path));
	log(`${files.length} files found matching the file pattern`);

	const locations: vscode.Location[] = [];
	for (const file of files) {
		const contentBytes: Uint8Array = await vscode.workspace.fs.readFile(file);
		const content: string = contentBytes.toString();
		if (regex.test(content)) {
			const lines = content.toString().split('\n');
			lines.forEach((line, i) => {
				if (regex.test(line)) {
					const startIndex = line.indexOf(currentWordRange);
					const endIndex = startIndex + currentWordRange.length;
					const range = new vscode.Range(i, startIndex, i, endIndex);
					const location = new vscode.Location(file, range);
					log(`  ${file}`);
					locations.push(location);
				}
			});
		}
	}

	return locations;
}

async function getFilesLocationsFromWordRange(wordRange: string): Promise<vscode.Definition | vscode.DefinitionLink[]> {
	log(`searching for file ${wordRange}`);
	const filePattern: string = getFilePatternForRelativePath(wordRange);
	return await getFileLocationsFromPattern(filePattern);
}

async function getRolesLocationsFromWordRange(wordRange: string): Promise<vscode.Definition | vscode.DefinitionLink[]> {
	log(`searching for role ${wordRange}`);
	const filePattern: string = getFilePatternForRole(wordRange);
	return await getFileLocationsFromPattern(filePattern);
}

async function getFileLocationsFromPattern(filePattern: string) {
	const files = await vscode.workspace.findFiles(filePattern);
	const locations: vscode.Location[] = [];
	const range = new vscode.Range(0, 0, 0, 0);
	for (const file of files) {
		const location = new vscode.Location(file, range);
		log(`  ${file}`);
		locations.push(location);
	}
	return locations;
}

// This method is called when your extension is deactivated
export function deactivate() {}

function log(message: string) {
    const extensionName = 'ansible-go-to-definition';
    console.log(`[${extensionName}]: ${message}`);
}

export function lineIsFileProperty(line: string): boolean {
	const parts: string[] = line.split(':');
	if (parts.length <= 1) {
		return false;
	}

	const keyword: string = parts[0].trim();
	return keyword === 'file' || 
		keyword === 'src' ||
		keyword.includes('include_tasks') ||
		keyword.includes('import_tasks');
}

export function lineIsRole(line: string): boolean {
	if (!line.trim().startsWith('- ')) {
		return false;
	}
	if (!line.includes(':')) {
		// - role_name
		return true;
	}

	// Check for - role: role_name
	const pattern: string = `\\s*-\\s*role\\s*:.*`;
	const regex = new RegExp(pattern);
	return regex.test(line);
}

export function getFilePatternForRelativePath(currentWord: string): string {
	return `**/${currentWord}`;
}

export function getFilePatternForRole(currentWord: string): string {
	return `**/roles/${currentWord}/tasks/main.{yml,yaml}`;
}
