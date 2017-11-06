# CodeMap - VSCode Extension

Interactive code map for quick visualization and navigation within code DOM objects (e.g. classes, members).
<hr/>

This simple extension visualizes the cod DOM objects defined in the active document. This extension is a por of the popular plugin that is available for:
* Sublime Text 3 - [Sublime CodeMap plugin](https://github.com/oleg-shilo/sublime-codemap/blob/master/README.md)
* Notepad++ - [Part of CS-Script.Npp plugin](https://github.com/oleg-shilo/cs-script.npp/blob/master/README.md)
* Visual Studio - [PyMap (python flavour) extension](https://marketplace.visualstudio.com/items?itemName=OlegShilo.PyMap)

The extension functionality is straight forward. Just click the code map item and it will trigger the navigation to the document where the corresponding code element is defined in the document.

Currently only TypeScript syntax is supported but the mappers to Python and C# will also be ported very soon. At this moment the mappers are to embedded in the extension itself but support for user defined mappers is also in the pipeline:

* Auto-refreshing code map on document change.
* Navigation to code fragment associated with the clicked code map node.
* Refreshing on demand via "Refresh" toolbar button a and VSCode command.

Coming soon:
* Support for Python syntax
* Support for C# syntax
* Support for universal RegEx based mapper
* Support for custom user-defined mappers (to allow integration with even the most exotic languages) 

![image](https://raw.githubusercontent.com/oleg-shilo/codemap.vscode/master/resources/images/codemap_vscode.gif)



