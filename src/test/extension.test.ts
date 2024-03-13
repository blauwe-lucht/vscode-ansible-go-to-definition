import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import {
	getFilePatternForRelativePath,
	getHandlerNameFromLine,
	lineIsFileProperty,
	lineIsNotify,
	lineIsRole
} from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('lineIsFileProperty', () => {
		assert.strictEqual(lineIsFileProperty("        file: tasks/included_tasks.yml"), true);
		assert.strictEqual(lineIsFileProperty("      include_tasks: tasks/included_tasks.yml"), true);
		assert.strictEqual(lineIsFileProperty("      ansible.builtin.include_tasks: tasks/included_tasks.yml"), true);
		assert.strictEqual(lineIsFileProperty("      ansible.builtin.import_tasks: tasks/included_tasks.yml"), true);
		assert.strictEqual(lineIsFileProperty("        src: file_in_files.txt"), true);
		assert.strictEqual(lineIsFileProperty("        msg: \"my_var = {{ my_var }}\""), false);
	});

	test('getFilePatternForRelativePath', () => {
		assert.strictEqual(getFilePatternForRelativePath("tasks/included_tasks.yml"), "**/tasks/included_tasks.yml");
	});

	test('lineIsRole', () => {
		assert.strictEqual(lineIsRole("        file: tasks/included_tasks.yml"), false);
		assert.strictEqual(lineIsRole("        - simple"), true, "- simple");
		assert.strictEqual(lineIsRole("        - role: simple"), true, "- role: simple");
	});

	test('lineIsNotify-file', () => {
		assert.strictEqual(lineIsNotify("        file: tasks/included_tasks.yml"), false);
	});

	test('lineIsNotify-simple', () => {
		assert.strictEqual(lineIsNotify("        - simple"), false);
	});

	test('lineIsNotify-notify', () => {
		assert.strictEqual(lineIsNotify("        notify: Some handler"), true);
	});

	test('getHandlerNameFromLine', () => {
		assert.strictEqual(getHandlerNameFromLine("     notify: Some handler    "), "Some handler");
	});
});
