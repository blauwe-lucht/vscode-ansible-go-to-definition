// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ansible-go-to-definition" is now active!');

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
		const varName: string = document.getText(document.getWordRangeAtPosition(position));
		const pattern: string = `\\s*${varName}\\s*:`;
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
		console.log(`${files.length} files found matching the pattern`);

		const locations: vscode.Location[] = [];
        for (const file of files) {
            const contentBytes: Uint8Array = await vscode.workspace.fs.readFile(file);
			const content: string = contentBytes.toString();
			if (regex.test(content))
			{
				const lines = content.toString().split('\n');
				lines.forEach((line, i) => {
					if (regex.test(line)) {
						const startIndex = line.indexOf(varName);
						const endIndex = startIndex + varName.length;
						const range = new vscode.Range(i, startIndex, i, endIndex);
						const location = new vscode.Location(file, range);
						console.log(`  ${file}`);
						locations.push(location);
					}
				});
			}
        }

        return locations;    
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
