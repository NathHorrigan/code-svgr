import * as vscode from "vscode";
import SvgCheck from "is-svg";
import { convertSelection } from "../converter";
import { isJavascriptFile, askConverterOptions } from "../utils";

export const pasteEvent = async (event: vscode.TextDocumentChangeEvent) => {
  // Check if the pasted text is SVG & Quit if not
  const changes = event.contentChanges[0];
  if (!changes) return;
  const { text: insertedText } = changes;
  const isSvg = SvgCheck(insertedText);
  if (!isSvg) return;

  // Check if document is react file & Quit if not
  const activeTextEditor = vscode.window.activeTextEditor;
  const activeDocument = activeTextEditor?.document;
  const activeDocumentPath = activeDocument?.uri.path;
  const documentIsJs = isJavascriptFile(activeDocumentPath);
  if (!documentIsJs) return;

  // Check if this is a clean file
  if (!activeDocument) return;
  let cleanFileText = activeDocument.getText().replace(insertedText, "");
  if (cleanFileText !== "") return;

  // Convert SVG to React Component
  const options = await askConverterOptions(false);
  const jsCode = await convertSelection(insertedText, options);

  // Hack to clear the screen
  activeTextEditor?.edit(editBuilder => {
    editBuilder.delete(
      new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(activeDocument.lineCount, 0)
      )
    );
    editBuilder.insert(new vscode.Position(0, 0), jsCode);
  });
};
