# CodeMap - VSCode Extension

Interactive code map for quick visualization and navigation within code DOM objects (e.g. classes, members).
<hr/>

## Overview
This simple extension visualizes the cod DOM objects defined in the active document. This extension is a por of the popular plugin that is available for:
* Sublime Text 3 - [Sublime CodeMap plugin](https://github.com/oleg-shilo/sublime-codemap/blob/master/README.md)
* Notepad++ - [Part of CS-Script.Npp plugin](https://github.com/oleg-shilo/cs-script.npp/blob/master/README.md)
* Visual Studio - [PyMap (python flavour) extension](https://marketplace.visualstudio.com/items?itemName=OlegShilo.PyMap)

The extension functionality is straight forward. Just click the code map item and it will trigger the navigation to the document where the corresponding code element is defined in the document.

_Features_:
* Customization by adding support for new syntaxes via:
  * set of Regex expressions in user settings
  * dedicated simple mapper JS script file.
* Auto-refreshing code map on document change.
* Navigation to code fragment associated with the clicked code map node.
* Refreshing on demand via "Refresh" toolbar button a and VSCode command.

The plugin comes with support for TypeScript, Python and Markdown syntax. C# support will come very soon. 

![](https://raw.githubusercontent.com/oleg-shilo/codemap.vscode/master/resources/images/codemap_vscode.gif)

## Adding custom mappers
The most intriguing plugin's feature is the possibility to extend it to support new even most exotic syntaxes. 

There are two way of achieving this: with a dedicated mapper script or by using generic mapper with the syntax specific Regex definitions in the user settings. 

Both mappers produce a map definition - collection of strings/lines where every line describes a _code map_ item with a very simple format :
```
[indent]<name>|<line>|<icon>
```
`indent` - the whitespace indent is optional and is used to express code nesting.</br> 
`name` - display name of the navigatable code member</br>
`line` - line number to navigate to</br>
`action` - name of the predefined icons:
- class
- interface
- function
- property
- document
- level1
- level2
- level3

Below is a sample map definition produced by the built-in Python mapper:
```
def settings()|1|function
class NavigateCodeMap|4|class
    def highlight_line()|6|function
    def keep_going_down()|9|function
        def indented()|11|function
    def keep_going_up()|16|function
        def indented()|18|function
        def up()|23|function
def down()|26|function
```
And this is the 

## Roadmap
Coming soon:
* Support for C# syntax
* Support for universal RegEx based mapper




