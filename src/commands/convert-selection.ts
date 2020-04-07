import * as vscode from "vscode";
import SvgCheck from "is-svg";
import { convertSelection } from "../converter";
import { askConverterOptions, getSelectedText, getTextRange } from "../utils";

export const convertToClipboard = async () => {
  // Get Component options
  const options = await askConverterOptions(false);
  // Get SVG content
  const selectedText = getSelectedText();
  // Check selected text is an SVG
  const isSvg = SvgCheck(selectedText);
  // Give error if not svg
  if (!isSvg) {
    vscode.window.showInformationMessage(`Selected text was not an SVG`);
  }
  // Actually convert the code
  const jsCode = await convertSelection(selectedText, options);
  // Copy code to the clipboard
  vscode.env.clipboard.writeText(jsCode);
  vscode.window.showInformationMessage("React code copied to the clipboard ✂️");
};

export const convertInlineToComponent = async (
  svg: string,
  document: vscode.TextDocument,
  range: vscode.Range
) => {
  // Ask how you want to generate component
  const options = await askConverterOptions(false);
  // Transform SVG into inline JSX
  let jsCode = await convertSelection(svg, {
    ...options,
    useMemo: false,
  });
  // Replace svg with JSX code
  const fix = new vscode.WorkspaceEdit();
  // Remove react import
  jsCode = jsCode.replace('import * as React from "react";', "");
  fix.replace(document.uri, range, `<${options.componentName} />`);
  fix.insert(document.uri, new vscode.Position(document.lineCount, 0), jsCode);
  // Apply edit to file
  vscode.workspace.applyEdit(fix);
};

export const convertInlineToInline = async (
  svg: string,
  document: vscode.TextDocument,
  range: vscode.Range
) => {
  // Transform SVG into inline JSX
  const jsCode = await convertSelection(svg, {
    componentName: "InlineComponent",
    template: "jsx",
    isIcon: false,
  });
  // Replace svg with JSX code
  const fix = new vscode.WorkspaceEdit();
  fix.replace(document.uri, range, jsCode);
  // Apply edit to file
  vscode.workspace.applyEdit(fix);
};
