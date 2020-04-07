import * as vscode from "vscode";
import SvgCheck from "is-svg";
import { dryRun } from "../converter";
import { askConverterOptions, applyRegexSearch, getTextRange } from "../utils";

export class JsxDetector
  implements vscode.CodeActionProvider, vscode.CodeLensProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  public async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range
  ): Promise<vscode.CodeAction[] | undefined> {
    const svgSearch = this.getSvgCode(document, range);
    if (!svgSearch) return;
    const dryRunJsx = await dryRun(svgSearch.content);
    if (!dryRunJsx) return;

    // Convert inline SVG to inline JSX
    const convertToInline = this.createSvgFix(
      svgSearch.content,
      document,
      svgSearch.range,
      "Convert SVG to inline JSX",
      "svgr.qa_convert_to_inline"
    );
    convertToInline.isPreferred = true;

    // Convert inline SVG to React Component
    const convertToComponent = this.createSvgFix(
      svgSearch.content,
      document,
      svgSearch.range,
      "Create React Component from SVG",
      "svgr.qa_convert_to_component"
    );

    // Extract inline SVG to file
    const extractToComponentFile = this.createSvgFix(
      svgSearch.content,
      document,
      svgSearch.range,
      "Extract SVG to React Component file",
      "svgr.qa_convert_to_file"
    );

    return [convertToInline, convertToComponent, extractToComponentFile];
  }

  private getSvgCode(document: vscode.TextDocument, range: vscode.Range) {
    // Select text from cursor to end of file
    const textFile = document.getText();
    // Search file for SVG
    const svgSearch = applyRegexSearch(
      textFile,
      new RegExp(/<svg .*?>[\s\S]*?<\/svg>/)
    );
    // Return the SVG search
    if (svgSearch && SvgCheck(svgSearch.content)) {
      return svgSearch;
    }
    return null;
  }

  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[] | undefined> {
    // Check if you can extract an SVG from the open file.
    const textFile = document.getText();
    const svgSearch = applyRegexSearch(
      textFile,
      new RegExp(/<svg .*?>[\s\S]*?<\/svg>/)
    );
    if (!svgSearch) return;
    // Check the SVG code itself for validity
    if (!SvgCheck(svgSearch.content)) return;
    // Check that SVG the code converts to JSX
    const dryRunJsx = await dryRun(svgSearch.content);
    if (!dryRunJsx) return;
    // Create a range for the svg code
    const convertToInline = new vscode.CodeLens(svgSearch.range, {
      command: "svgr.qa_convert_to_inline",
      title: "Convert SVG to inline JSX",
      arguments: [svgSearch.content, document, svgSearch.range],
    });

    const convertToComponent = new vscode.CodeLens(svgSearch.range, {
      command: "svgr.qa_convert_to_component",
      title: "Convert to React Component",
      arguments: [svgSearch.content, document, svgSearch.range],
    });

    const extractToFile = new vscode.CodeLens(svgSearch.range, {
      command: "svgr.qa_convert_to_file",
      title: "Extract to Component file",
      arguments: [svgSearch.content, document, svgSearch.range],
    });

    return [convertToInline, convertToComponent, extractToFile];
  }

  private createSvgFix(
    svg: string,
    document: vscode.TextDocument,
    range: vscode.Range,
    label: string,
    command: string
  ): vscode.CodeAction {
    const fix = new vscode.CodeAction(label, vscode.CodeActionKind.QuickFix);
    fix.command = {
      title: label,
      command,
      arguments: [svg, document, range],
    };
    return fix;
  }
}
