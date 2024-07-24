# Change Log

## 1.26.2 (24 July 2024)

- Changed extension icon (#103)

## 1.26.1 (29 June 2024)

- Fixed problem with the extension startup crash if the last state file for `Codemap Settings` contains corrupted data.
- Issue #98: Make icon as simple additional string
  Not you can specify an emoji character as a node icon in the config section of the generic mapper.


## 1.26.0 (28 June 2024)

- Issue #99: Added Verilog Mapper
- Issue #98: Make icon as simple additional string
  Not you can specify an emoji character as a node icon in the config section of the generic mapper.

## 1.25.0 (15 June 2024)

- Issue #96: Unresponsive Generic Mapper
- Added support (dedicated mapper) for LScript syntax.

## 1.24.0 (21 April 2024)

- Issue #59: How to register a custom mapper with a complex file extension
  
## 1.23.0 (8 April 2024)

- Issue #94: Default class/function display settings

## 1.22.0 (13 March 2024)

- Added support for React modules in TypeScript and JavaScript syntax (*.tsx/*.jsx files).

## 1.21.0 (5 February 2024)

- Added support for GO syntax (*.go files).
- Added workflow for editing the mapper of the active opened document.
- Added workflow for creating a new mapper for the active opened document.
- New commands: `codemap.edit_mapper` and `codemap.create_mapper`

## 1.20.5 (30 January 2024)

- Improved TS mapper algorithm so it handles pure JS class functions for `*.js` files.
- Updated all packages

## 1.20.4 (18 December 2023)

- Added support Arduino syntax (*.ino files)

## 1.20.3 (19 June 2023)

- Added Support PDL2 Files(Comau Robot Language)
 _Curtesy of Marco Caputo_

## 1.20.1 (19 March 2023)

- Just a rebuild of v1.20.1 (#82)

## 1.20.1 (18 March 2023)

- Syntaxer upgraded to v3.1.2 to run on .NET 7.0

## 1.20.0 (5 December 2022)

- Bumped version to align with the published one on VSCode marketplace

## 1.19.1 (5 December 2022)

- PR #81: opening new unopened script initially filters all nodes.
  This is a fix of an accidental side effect of the very previous PR.

## 1.19.0 (2 December 2022)

- PR #80: Add sorting option (include/exclude) by node type (e.g. class, functions) 
  The option is available in the [explorer view](https://github.com/oleg-shilo/codemap.vscode/pull/80).
- Incorporated GitHub suggested vulnerability patches  

## 1.18.0 (11 November 2022)

- Issue #72: Add sort button to the CodeMap display (continuation)
  Added config value "defaultSortDirection"
  Special txs to Timhobson-source who contributed this enhancement

## 1.17.0 (20 October 2022)

- Issue #72: Add sort button to the CodeMap display  
Added context menu for sorting direction when it is enabled.
Supported sorting directions are:
- Ascendant
- Descendant
- By location (in document)
After switching the active document the default sorting direction (ascendant) is always restored.

## 1.16.4 (24 August 2022)

- Issue #71: Missing Parenthesis  

## 1.16.3 (22 April 2022)

- Issue #66: Generic Mapper: a pipe char in the source interferes with the complete mapping

## 1.16.2 (10 sep 2021)

- Added generic mapper for VB.NET syntax
  
## 1.16.1 (15 May 2021)

- Issue #55: Unfold also in editor
- Issue #50: Alpha Sorting for custom generic mapper
- Issue #51: codemap.quick_pick not found
- Addressed dependencies' vulnerabilities
- Only refresh when the document is saved, not when it is edited
- Hot-reload custom mapper scripts when they have changed
- Update mapper_tcl.ts

## 1.16.0 (23 September 2020)

- Added support for TCS syntax
- Issue #44: Cannot create json setting for dedicated mapper
- Issue #43: Sorting
  Implemented items sorting `codemap.sortingEnabled`
- Added `SyntaxMapping.levelIndent: number;` to allow defining logical indent for otherwise non-indented items matching generic mapper definition (triggered #32)
  Generic mapper definition is extended with an extra value `levelIndent`. This value defines not physical but logical indent that is assigned to the matching item that is non-indented at otherwise at runtime. For the cases of mixed indented/non-indented syntax like yours, this value needs to match the indent of the main (indented) syntax. Thus if your Python used 4 spaces to define first level nesting should be `4`. And the second level - `8`.

## 1.15.0 (12 August 2020)

- Issue #41: Customizing the color of the squares in "Codemap explorer"

  You can use an additional format for icon allows specifying custom path:
  `path:<absolute path to svg icon file>`
  The path string can contain special token `{theme}` which is replaced at runtime with the word "dark" or "light". Depending on the VS theme.  

  ``` json
      "codemap.md": [
        {
            "pattern": "^(\\s*)### (.*)",
            "clear": "###",
            "prefix": " -",
            "icon": "path:E:\\icons\\VSCode\\codemap\\{theme}\\custom_level_a.svg"
        },
        . . .
  ```

## 1.14.0 (21 July 2020)

- Added support for Blazor/Razor (.razor) syntax.
- Added an option for automatically invoking "Reveal In Tree" on caret position change.

## 1.13.0 (29 May 2020)

- Implemented Reveal In Tree (Alt+L) for revealing the tree view node that corresponds to code at the current position in the document.
  - Issue #29: Show current location of cursor in file

## 1.12.1 (24 May 2020)

- Added icons to "Quick Pick" list

## 1.12.0 (22 May 2020)

- Implemented Quick Pick (Alt+P) for simple search/filter mapitems
  - Issue #36: add search or filter?
  - Issue #31: Feature proposal - Document Symbol

## 1.11.2

- Issue #33: Codemap generic mapper does not work with UTF-16 encoded files.
Changed (from reading doc content from the file) to reading the doc content from the text editor buffer. So no dependency on the file encoding.

## 1.11.1

- Issue #34: Refresh button is missing

## 1.11.0

- C# syntaxer is migrated to .NET Core. There is no longer any dependency on Mono.

## 1.10.4

- Issue #27: Add an option to put the code map back into the explorer.

## 1.10.2

- Issue #25: Added collapse all items button

## 1.10.1

- Issue #22: Codemap doesn't display async function

## 1.10.0

- Issue #18: Simplify mapping rules for Python
- Issue #16: Add to Activity Bar

## 1.9.0

- Fixed false class detection in source if substring 'class' present in some variables.
- Issue #14: Show/Hide level in code map. Added `maxNestingLevel` setting.

## 1.8.0

- Added `syntaxer.cli.exe` to allow synchronous client-server communication for C# mapper. Needed to handle the problem with the latest VSCode failing to process unsolicited map refresh requests.

## 1.7.0

- Added support for Java (.java) syntax.

## 1.6.0

- Added support for R (.r) syntax.
- Added handling unsaved content ("unknown-*") documents.

## 1.5.0

- Added support for PowerShell (.ps1) syntax.

## 1.4.3

- Added dedicated Erlang mapper (courtesy of @andreabenini).

## 1.4.2

- Fixed badly formatted `configuration.properties` in the package.json. The defect can potentially affect whole "read config value" use-case.

## 1.4.1

- Added work around for the VSCode failure to return config values defaults defined in `package.json` (VSCode issue #14500 is back)
- Improved XML mapper to handle badly formatted XML in `codemap.textMode:false` mode

## 1.4.0

- Added XML/SVG/XAML mapper
- Added support for linked mappers: `"codemap.svg": "config:codemap.xml"`

## 1.3.1

- Improved JSON mapper
- Fixed problem with "clear" (config values) being applied for the first occurrence of the value

## 1.3.0

- Added JSON mapper
- TypeScript mapper enabled for mapping JavaScript code
- Added Generic Mapper icons

## 1.2.0

- Added C# mapper

## 1.1.0

- Added Python and Markdown mappers
- Added support for custom mappers

## 1.0.0

- Initial release
