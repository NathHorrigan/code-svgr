// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { JsxDetector } from "./actions/jsx-detector";
import {
  convertToClipboard,
  convertInlineToComponent,
  convertInlineToInline,
  convertInlineToFile,
  convertToFile,
  pasteEvent,
} from "./commands";

export function activate(context: vscode.ExtensionContext) {
  // Add code actions to detect invalid SVG code in .ts & .js
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ["javascript", "typescript"],
      new JsxDetector(),
      {
        providedCodeActionKinds: JsxDetector.providedCodeActionKinds,
      }
    )
  );

  // Addd code lens to detect invalid SVG code in .ts & .js
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      ["javascript", "typescript"],
      new JsxDetector()
    )
  );

  // Convert selected text to component in clipboard
  const convertSelectionToFile = vscode.commands.registerCommand(
    "svgr.convert_selection",
    convertToClipboard
  );

  // Listen to paste changes into a blank file
  vscode.workspace.onDidChangeTextDocument(pasteEvent);

  // Convert SVG file to JSX file
  const convertFileToFile = vscode.commands.registerCommand(
    "svgr.convert_file",
    convertToFile
  );

  context.subscriptions.push(convertSelectionToFile);
  context.subscriptions.push(convertFileToFile);

  // ===============================
  // Commands called by code actions
  vscode.commands.registerCommand(
    "svgr.qa_convert_to_component",
    convertInlineToComponent
  );
  vscode.commands.registerCommand(
    "svgr.qa_convert_to_inline",
    convertInlineToInline
  );
  vscode.commands.registerCommand(
    "svgr.qa_convert_to_file",
    convertInlineToFile
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
