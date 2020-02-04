# Change Log

## 1.10.3

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
