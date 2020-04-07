import * as vscode from "vscode";
import * as path from "path";
import { getLocator } from "locate-character";

// Easy helper for building text boxes
export function createAsyncTextBox(
  title: string,
  description: string,
  defaultValue?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create box obj with options
    const box = vscode.window.createInputBox();
    box.title = title;
    box.prompt = description;
    box.value = defaultValue || "";
    // Display a message box to the user
    box.show();
    // Return value if there is one
    box.onDidAccept((e) => {
      resolve(box.value);
      box.dispose();
    });
    // If cancelled then return nothing...
    box.onDidHide(() => {
      reject(undefined);
    });
  });
}

// Easy helper for building option boxes
interface CustomQuickPickItem<T> {
  id: T;
  label: string;
  description?: string;
  picked?: boolean;
}

export function createAsyncQuickPick<T>(
  title: string,
  items: CustomQuickPickItem<T>[]
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Create box obj with options
    const box = vscode.window.createQuickPick();
    box.title = title;
    box.items = items;
    // Display a message box to the user
    box.show();
    // Return value if there is one
    box.onDidAccept((e) => {
      resolve(
        items.find(({ label }) => box.activeItems[0].label === label)?.id
      );
      box.dispose();
    });
    // If cancelled then return nothing...
    box.onDidHide(() => {
      reject(undefined);
    });
  });
}

// Function to get selected text
export function getSelectedText(): string {
  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;
  if (selection) {
    const range = new vscode.Range(selection?.start, selection?.end);
    return editor?.document.getText(range) ?? "";
  }

  return "";
}

interface RegexSearch {
  content: string;
  range: vscode.Range;
}

// Apply a regex to text and get the range
export const applyRegexSearch = (
  text: string,
  regexp: RegExp
): RegexSearch | null => {
  const locator = getLocator(text);
  const selection = text.match(regexp);
  if (selection && selection.index) {
    const start = locator(selection.index);
    const end = locator(selection.index + selection[0].length);
    const startPos = new vscode.Position(start.line, start.column);
    const endPos = new vscode.Position(end.line, end.column);

    return {
      content: selection[0],
      range: new vscode.Range(startPos, endPos),
    };
  }

  return null;
};

// Get all text from a position to end of file
export const getTextRange = (
  document: vscode.TextDocument,
  range: vscode.Range
) =>
  document.getText(
    new vscode.Range(range.start, new vscode.Position(document.lineCount, 0))
  );

// Function to open a filename
export function openFile(filename: string | undefined) {
  if (filename) {
    return vscode.workspace.openTextDocument(filename).then((document) => {
      vscode.window.showTextDocument(document);
    });
  }
}

// Function to extract useful imformation from path
export function extractFilename(currentFilePath: string) {
  const ext = path.extname(currentFilePath);
  const filename = path.basename(currentFilePath, ext) ?? "";
  return {
    filename,
    directory: path.dirname(currentFilePath),
    recommendedComponentName: toPascalCase(filename),
  };
}

// Function to convert camal-case to PascalCase
function toPascalCase(str: string) {
  return str.replace(/(\-|^)([a-z])/gi, function (
    match,
    delimiter,
    hyphenated
  ) {
    return hyphenated.toUpperCase();
  });
}

// Function to check if file is JS
export function isJavascriptFile(filepath?: string) {
  if (filepath) {
    const activeDocumentExt = path.extname(filepath);
    const documentIsJs =
      [".js", ".jsx", ".ts", ".tsx"].indexOf(activeDocumentExt) !== -1;
    return documentIsJs;
  }
  return false;
}

// Function to check if file is TS
export function isTypescriptFile(filepath?: string) {
  if (filepath) {
    const activeDocumentExt = path.extname(filepath);
    const documentIsTs = [".ts", ".tsx"].indexOf(activeDocumentExt) !== -1;
    return documentIsTs;
  }
  return false;
}

export interface SvgConversionOptions {
  componentName?: string;
  reactEnviroment?: string;
  isIcon?: boolean;
  isExpo?: boolean;
  isTypescript?: boolean;
  isOverwriting?: boolean;
  useMemo?: boolean;
  template?: string;
  fileLocation?: string | undefined;
  originalFilename?: string | undefined;
}

// Ask the details we need to create the component
export async function askConverterOptions(
  isSavingFile: boolean = true,
  uri: vscode.Uri | null = null,
  askIfOverwrite = true
): Promise<SvgConversionOptions> {
  // Obtain a URI to recommend a saving place
  const currentUri: string | undefined = (
    uri || vscode.window.activeTextEditor?.document.uri
  )?.fsPath;
  const { directory, recommendedComponentName } = extractFilename(
    currentUri ?? vscode.workspace.rootPath ?? ""
  );

  // Display a message box to the user
  const componentName = await createAsyncTextBox(
    "Component Name",
    "What do you want to name the component? ",
    recommendedComponentName
  );

  // Where to save the file
  let isOverwriting = false;
  let fileLocation: string = "";
  if (isSavingFile) {
    if (askIfOverwrite) {
      // Are we creating extra or overwriting the open file
      isOverwriting = await createAsyncQuickPick<boolean>(
        "Do you want to overwrite current file?",
        [
          {
            id: true,
            label: "Yes",
            description: "Convert this .svg to a .js file",
          },
          {
            id: false,
            label: "No",
            description: "Create a seperate .js file and keep this one",
          },
        ]
      );
    }

    fileLocation = await createAsyncTextBox(
      "File Location",
      "Where do you want to save the file? ",
      `${directory}/${componentName}.js`
    );
  }

  // What type of react?
  const reactEnviroment: string = await createAsyncQuickPick(
    "Which React enviroment?",
    [
      {
        id: "web",
        label: "React JS",
        description: "Works only in web enviroments, No imports nessacery",
      },
      {
        id: "native",
        label: "React Native",
        description:
          "Works in RN enviroments only, Uses react-native-svg library",
      },
    ]
  );

  let isExpo = false;
  if (reactEnviroment === "native") {
    isExpo = await createAsyncQuickPick("Are you using Expo?", [
      {
        id: true,
        label: "Yes",
        description: "",
      },
      {
        id: false,
        label: "No",
        description: "Click here if you have ejected out of Expo",
      },
    ]);
  }

  // What type of react?
  const isIcon: boolean = await createAsyncQuickPick("Is this SVG an icon?", [
    {
      id: false,
      label: "No",
      description: "This is a shape, pattern or other non-icon image",
      picked: true,
    },
    {
      id: true,
      label: "Yes",
      description:
        "Yes, this is an icon and I want to resize using font sizes.",
    },
  ]);

  return {
    componentName,
    fileLocation,
    reactEnviroment,
    isOverwriting,
    isExpo,
    isIcon,
    useMemo: true,
    isTypescript: isTypescriptFile(fileLocation),
    originalFilename: currentUri,
  };
}
