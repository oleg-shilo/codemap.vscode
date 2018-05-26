# Change Log

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
