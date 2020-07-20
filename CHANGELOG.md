# Change Log

## 1.12.1 (24 May 2020)

* Added icons to "Quick Pick" list

## 1.14.0 (21 July 2020)

* Added support for Blazor/Razor (.razor) syntax.
* Added an option for automatically invoking "Reveal In Tree" on caret position change.

## 1.13.0 (29 May 2020)

* Implemented Reveal In Tree (Alt+L) for revealing the tree view node that corresponds to code at the current position in the document.
  * Issue #29: Show current location of cursor in file

## 1.12.0 (22 May 2020)

* Implemented Quick Pick (Alt+P) for simple search/filter mapitems
  * Issue #36: add search or filter?
  * Issue #31: Feature proposal - Document Symbol

## 1.11.2

* Issue #33: Codemap generic mapper does not work with UTF-16 encoded files.
Changed (from reading doc content from the file) to reading the doc content from the text editor buffer. So no dependency on the file encoding.

## 1.11.1

* Issue #34: Refresh button is missing

## 1.11.0

* C# syntaxer is migrated to .NET Core. There is no longer any dependency on Mono.

## 1.10.4

* Issue #27: Add an option to put the code map back into the explorer.

## 1.10.2

* Issue #25: Added collapse all items button

## 1.10.1

* Issue #22: Codemap doesn't display async function

## 1.10.0

* Issue #18: Simplify mapping rules for Python
* Issue #16: Add to Activity Bar

## 1.9.0

* Fixed false class detection in source if substring 'class' present in some variables.
* Issue #14: Show/Hide level in code map. Added `maxNestingLevel` setting.

## 1.8.0

* Added `syntaxer.cli.exe` to allow synchronous client-server communication for C# mapper. Needed to handle the problem with the latest VSCode failing to process unsolicited map refresh requests.

## 1.7.0

* Added support for Java (.java) syntax.

## 1.6.0

* Added support for R (.r) syntax.
* Added handling unsaved content ("unknown-*") documents.

## 1.5.0

* Added support for PowerShell (.ps1) syntax.

## 1.4.3

* Added dedicated Erlang mapper (courtesy of @andreabenini).

## 1.4.2

* Fixed badly formatted `configuration.properties` in the package.json. The defect can potentially affect whole "read config value" use-case.

## 1.4.1

* Added work around for the VSCode failure to return config values defaults defined in `package.json` (VSCode issue #14500 is back)
* Improved XML mapper to handle badly formatted XML in `codemap.textMode:false` mode

## 1.4.0

* Added XML/SVG/XAML mapper
* Added support for linked mappers: `"codemap.svg": "config:codemap.xml"`

## 1.3.1

* Improved JSON mapper
* Fixed problem with "clear" (config values) being applied for the first occurrence of the value

## 1.3.0

* Added JSON mapper
* TypeScript mapper enabled for mapping JavaScript code
* Added Generic Mapper icons

## 1.2.0

* Added C# mapper

## 1.1.0

* Added Python and Markdown mappers
* Added support for custom mappers

## 1.0.0

* Initial release
