import svgr from "@svgr/core";
import { SvgConversionOptions } from "./utils";

interface SVGRConfig {
  icon?: boolean;
  memo?: boolean;
  native?: boolean | object;
  typescript?: boolean;
  template?: any;
  plugins: string[];
}

export const dryRun = async (
  svg: string | Buffer | undefined
): Promise<boolean> => {
  try {
    const jsx = await convertSelection(svg, {
      componentName: "TestDryRun",
      reactEnviroment: "web",
      template: "jsx",
    });
    console.log(jsx);
    return !!jsx;
  } catch {
    return false;
  }
};

export const convertSelection = async (
  svg: string | Buffer | undefined,
  options: SvgConversionOptions
) => {
  let svgrConfig: SVGRConfig = {
    icon: options.isIcon,
    memo: options.useMemo,
    native: false,
    typescript: options.isTypescript,
    plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx", "@svgr/plugin-prettier"],
  };

  // Check if React Native
  if (options.reactEnviroment === "native") {
    svgrConfig.native = { expo: options.isExpo };
  }

  // Check if we should override the template
  if (options.template === "jsx") {
    svgrConfig.template = JsxOnlyTemplate;
  }
  if (options.template === "snippet") {
    svgrConfig.template = SnippetTemplate;
  }

  const jsCode = await svgr(svg, svgrConfig, {
    componentName: options.componentName,
  });
  return jsCode;
};

interface SVGROptions {
  componentName: string;
  typescript: boolean;
}

interface SVGRTemplateProps {
  imports?: string;
  exports?: string;
  interfaces?: string;
  props?: string;
  jsx?: string;
  componentName?: string;
}

// This is used when just returning inline SVG code
function JsxOnlyTemplate(
  { template }: SVGRConfig,
  opts: any,
  { jsx }: SVGRTemplateProps
) {
  const plugins = ["jsx"];
  if (opts.typescript) {
    plugins.push("typescript");
  }
  const typeScriptTpl = template?.smart({ plugins });
  return typeScriptTpl.ast`${jsx}`;
}

// Used when creating snuppet components
function SnippetTemplate(
  { template }: SVGRConfig,
  opts: SVGROptions,
  { imports, interfaces, componentName, props, jsx, exports }: SVGRTemplateProps
) {
  const plugins = ["jsx"];
  if (opts.typescript) {
    plugins.push("typescript");
  }
  const typeScriptTpl = template?.smart({ plugins });
  return typeScriptTpl.ast`${imports}
  ${interfaces}
  function $1 (${props}) {
    return ${jsx};
  }
  ${exports}
    `;
}
