# azure release helper

> [!WARNING]  
> Alpha level software to explore azure api

## Setup
To install via local git repo:

```bash
git clone <URL>
npx tsc
npm link
```

To install globally via npm
```bash
npm install -g no0x9d/azure-story-map
```

### configuration
To make it easier to use when you configure the base values via environment variables

example: For the project in `https://dev.azure.com/My-Org/My-Project` you can configure the 
following environment variables

```bash
AZURE_PERSONAL_ACCESS_TOKEN=1234567890abcdefghijklmnop
AZURE_BASE_URL=https://dev.azure.com/My-Org
```



## Usage
To run:

### create story map

```bash
azsm story-map --query "SELECT [System.Id] FROM workitems WHERE [System.Id] = 12345"
```

If you have a more complex or long query it's possible to save the query in a file and pipe it in by specifying the parameter as a single dash (`-`)

```bash
cat query.txt | azsm story-map -q -
```

For more options to change the layout of the graph and change the format please see the help

```bash
$ azsm story-map --help
azsm story-map

create a story map for a query


Options:
      --version    Show version number                                 [boolean]
  -o, --org        https://dev.azure.com/<ORG>
                                        [required] [default: env AZURE_BASE_URL]
  -P, --pat        personal access token
                           [required] [default: env AZURE_PERSONAL_ACCESS_TOKEN]
      --help       Show help                                           [boolean]
  -q, --query      wiql query for all stories                [string] [required]
  -f, --format     output format of the graph as svg or Graphviz dot
                               [string] [choices: "svg", "dot"] [default: "svg"]
  -d, --direction  direction of the graph layout
                                  [string] [choices: "lr", "tb"] [default: "lr"]
  -s, --splines    controls how edges are drawn
   [choices: "ortho", "polyline", "line", "spline", "curved"] [default: "ortho"]

```
