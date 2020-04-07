import * as vscode from "vscode";
import * as fs from "fs";
import SvgCheck from "is-svg";
import { convertSelection } from "../converter";
import { askConverterOptions, getTextRange, openFile } from "../utils";

export const convertToFile = async (uri: vscode.Uri) => {
  // Get Component options
  const options = await askConverterOptions(true, uri);
  // Get SVG content
  const selectedText = uri
    ? fs.readFileSync(options?.originalFilename ?? "")
    : vscode.window.activeTextEditor?.document.getText() ?? "";
  // Check selected text is an SVG
  const isSvg = SvgCheck(selectedText);
  // Give error if not svg
  if (!isSvg) {
    vscode.window.showErrorMessage(`File did not contain an SVG`);
    return;
  }
  // Actually convert the code
  const jsCode = await convertSelection(selectedText, options);
  // Write code to file
  if (options?.fileLocation) {
    fs.writeFile(options.fileLocation, jsCode, err => {
      // Report error
      if (err) {
        return vscode.window.showErrorMessage(err.message);
      }
      // Update the user
      vscode.window.showInformationMessage(
        "React Component file was created 🚀"
      );
      // Open the newly generated react component
      openFile(options?.fileLocation);
      // Delete original
      if (options?.isOverwriting && options?.originalFilename) {
        fs.unlinkSync(options.originalFilename);
      }
    });
  }
};

export const convertInlineToFile = async (
  svg: string,
  document: vscode.TextDocument,
  range: vscode.Range
) => {
  const restOfFile = getTextRange(document, range);
  // Ask how you want to generate component
  const options = await askConverterOptions(true, null, false);
  // Transform SVG into inline JSX
  const jsCode = await convertSelection(svg, options);
  // Write code to file
  if (!options.fileLocation) return;
  fs.writeFile(options.fileLocation, jsCode, async err => {
    // Report error
    if (err) {
      vscode.window.showErrorMessage(err.message);
      return;
    }
    // Update the user
    vscode.window.showInformationMessage("React Component file was created 🚀");
    // Add import to the new component file
    const relativePath = vscode.workspace.asRelativePath(
      options.fileLocation ?? ""
    );
    const importFix = new vscode.WorkspaceEdit();
    importFix.insert(
      document.uri,
      new vscode.Position(0, 0),
      `import ${options.componentName} from "./${relativePath}"\n`
    );
    // Replace SVG code with use of new component
    const svgFix = new vscode.WorkspaceEdit();
    svgFix.replace(
      document.uri,
      new vscode.Range(range.start, new vscode.Position(document.lineCount, 0)),
      restOfFile.replace(svg, `<${options.componentName} />`)
    );
    await vscode.workspace.applyEdit(svgFix);
    await vscode.workspace.applyEdit(importFix);
  });
};
